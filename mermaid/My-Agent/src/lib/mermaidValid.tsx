import mermaid from 'mermaid';

export type DiagramType = 'sequence' | 'er';

interface CleanResult {
  cleanedCode: string;
  diagramType: DiagramType | null;
  warnings: string[];
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Detects diagram type from code
 */
export function detectDiagramType(code: string): DiagramType | null {
  const trimmed = code.trim().toLowerCase();
  
  if (trimmed.startsWith('sequencediagram')) {
    return 'sequence';
  }
  
  if (trimmed.startsWith('erdiagram')) {
    return 'er';
  }
  
  return null;
}

/**
 * Cleans sequence diagram syntax
 */
function cleanSequenceDiagram(code: string): { cleaned: string; warnings: string[] } {
  const warnings: string[] = [];
  const lines = code.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('%%')) {
      cleanedLines.push(line);
      continue;
    }

    // Fix participant names with special characters
    if (trimmed.toLowerCase().startsWith('participant')) {
      // Pattern: participant Name -> participant "Name" if it has special chars
      const participantMatch = trimmed.match(/^participant\s+(.+?)(?:\s+as\s+(.+))?$/i);
      
      if (participantMatch) {
        const name = participantMatch[1].trim();
        const alias = participantMatch[2]?.trim();

        // Check if name has special characters and isn't quoted
        if (/[(),/&\s]/.test(name) && !name.startsWith('"')) {
          const quotedName = `"${name.replace(/"/g, '\\"')}"`;
          line = alias 
            ? `    participant ${quotedName} as ${alias}`
            : `    participant ${quotedName}`;
          warnings.push(`Line ${i + 1}: Auto-quoted participant name`);
        }
      }
    }

    // Fix arrow syntax with special characters in labels
    if (/[-]?->>?[+-]?/.test(trimmed) || /[-]?->>[+-]?/.test(trimmed)) {
      // Check for unquoted labels with special characters
      const arrowMatch = trimmed.match(/^(.+?)([-]?->>?[+-]?|[-]?->>[+-]?)(.+?)?:\s*(.+)$/);
      
      if (arrowMatch) {
        const from = arrowMatch[1].trim();
        const arrow = arrowMatch[2];
        const to = arrowMatch[3]?.trim();
        const label = arrowMatch[4]?.trim();

        // If label has special chars and isn't quoted
        if (label && /[(),/&]/.test(label) && !label.startsWith('"')) {
          const quotedLabel = `"${label.replace(/"/g, '\\"')}"`;
          line = to 
            ? `    ${from}${arrow}${to}: ${quotedLabel}`
            : `    ${from}${arrow}: ${quotedLabel}`;
          warnings.push(`Line ${i + 1}: Auto-quoted arrow label`);
        }
      }
    }

    cleanedLines.push(line);
  }

  return {
    cleaned: cleanedLines.join('\n'),
    warnings,
  };
}

/**
 * Cleans ER diagram syntax
 */
function cleanERDiagram(code: string): { cleaned: string; warnings: string[] } {
  const warnings: string[] = [];
  const lines = code.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('%%')) {
      cleanedLines.push(line);
      continue;
    }

    // Fix entity names with special characters
    // Pattern: EntityName { ... } or relationships
    if (/\{/.test(trimmed)) {
      const entityMatch = trimmed.match(/^([A-Za-z0-9_\s(),-]+)\s*\{/);
      
      if (entityMatch) {
        const entityName = entityMatch[1].trim();
        
        // If entity name has spaces/special chars, might need quoting
        if (/[\s(),]/.test(entityName) && !entityName.startsWith('"')) {
          const quotedName = `"${entityName.replace(/"/g, '\\"')}"`;
          line = trimmed.replace(entityName, quotedName);
          warnings.push(`Line ${i + 1}: Auto-quoted entity name`);
        }
      }
    }

    // Fix relationship syntax
    // Pattern: Entity1 ||--o{ Entity2 : "relationship"
    const relationMatch = trimmed.match(/^([A-Za-z0-9_\s(),-]+)\s+([\|\}o][|o][\-\.]+[\|\{o][|\{])\s+([A-Za-z0-9_\s(),-]+)\s*:\s*(.+)$/);
    
    if (relationMatch) {
      const entity1 = relationMatch[1].trim();
      const relation = relationMatch[2].trim();
      const entity2 = relationMatch[3].trim();
      const label = relationMatch[4].trim();

      // Quote label if it has special characters and isn't quoted
      if (/[(),/&]/.test(label) && !label.startsWith('"')) {
        const quotedLabel = `"${label.replace(/"/g, '\\"')}"`;
        line = `    ${entity1} ${relation} ${entity2} : ${quotedLabel}`;
        warnings.push(`Line ${i + 1}: Auto-quoted relationship label`);
      }
    }

    cleanedLines.push(line);
  }

  return {
    cleaned: cleanedLines.join('\n'),
    warnings,
  };
}

/**
 * Main cleaning function that handles both diagram types
 */
export function cleanMermaidCode(code: string): CleanResult {
  let cleaned = code.trim();
  const warnings: string[] = [];

  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```mermaid\s*\n?/i, '');
  cleaned = cleaned.replace(/^```\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');
  cleaned = cleaned.trim();

  // Detect diagram type
  const diagramType = detectDiagramType(cleaned);

  if (!diagramType) {
    return {
      cleanedCode: cleaned,
      diagramType: null,
      warnings: ['Could not detect diagram type'],
    };
  }

  // Apply type-specific cleaning
  let result;
  if (diagramType === 'sequence') {
    result = cleanSequenceDiagram(cleaned);
  } else {
    result = cleanERDiagram(cleaned);
  }

  return {
    cleanedCode: result.cleaned,
    diagramType,
    warnings: [...warnings, ...result.warnings],
  };
}

/**
 * Validates Mermaid syntax using mermaid.parse
 */
export async function validateMermaidSyntax(code: string): Promise<ValidationResult> {
  try {
    if (!code || !code.trim()) {
      return {
        isValid: false,
        error: 'Diagram code cannot be empty',
      };
    }

    // Detect type first
    const type = detectDiagramType(code);
    if (!type) {
      return {
        isValid: false,
        error: 'Only sequence diagrams and ER diagrams are supported',
      };
    }

    // Use Mermaid's built-in parser
    await mermaid.parse(code);
    
    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid Mermaid syntax',
    };
  }
}

/**
 * Full cleaning and validation pipeline
 */
export async function cleanAndValidate(code: string): Promise<{
  success: boolean;
  cleanedCode: string;
  diagramType: DiagramType | null;
  warnings: string[];
  error?: string;
}> {
  // Step 1: Clean the code
  const cleanResult = cleanMermaidCode(code);

  // Step 2: Validate the cleaned code
  const validation = await validateMermaidSyntax(cleanResult.cleanedCode);

  return {
    success: validation.isValid,
    cleanedCode: cleanResult.cleanedCode,
    diagramType: cleanResult.diagramType,
    warnings: cleanResult.warnings,
    error: validation.error,
  };
}