import mermaid from 'mermaid';
import type { ValidationResult, StoredDiagram, MermaidDiagramType } from './mermaid-types';

/**
 * Validates Mermaid syntax
 */
export async function validateMermaidSyntax(code: string): Promise<ValidationResult> {
  try {
    if (!code || !code.trim()) {
      return {
        isValid: false,
        error: 'Diagram code cannot be empty',
      };
    }

    // Use Mermaid's built-in parser for validation
    const isValid = await mermaid.parse(code);
    
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
 * Detects the type of Mermaid diagram from the code
 */
export function detectDiagramType(code: string): MermaidDiagramType | null {
  const trimmedCode = code.trim().toLowerCase();
  
  const typeMap: Record<string, MermaidDiagramType> = {
    'graph': 'flowchart',
    'flowchart': 'flowchart',
    'sequencediagram': 'sequence',
    'classdiagram': 'class',
    'statediagram': 'state',
    'erdiagram': 'er',
    'gantt': 'gantt',
    'pie': 'pie',
    'journey': 'journey',
    'gitgraph': 'gitGraph',
    'mindmap': 'mindmap',
    'timeline': 'timeline',
    'quadrantchart': 'quadrantChart',
  };

  for (const [key, type] of Object.entries(typeMap)) {
    if (trimmedCode.startsWith(key)) {
      return type;
    }
  }

  return null;
}

/**
 * Exports a diagram as an SVG file
 */
export async function exportAsSVG(code: string, filename: string = 'diagram.svg'): Promise<void> {
  try {
    const id = `export-${Date.now()}`;
    const { svg } = await mermaid.render(id, code);
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting SVG:', error);
    throw error;
  }
}

/**
 * Exports a diagram as a PNG file
 */
export async function exportAsPNG(code: string, filename: string = 'diagram.png'): Promise<void> {
  try {
    const id = `export-${Date.now()}`;
    const { svg } = await mermaid.render(id, code);
    
    // Create an image from SVG
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Could not create blob');
        
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      });
    };
    
    img.src = url;
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw error;
  }
}


/**
 * Copies diagram code to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Sanitizes Mermaid code by removing common issues
 */
export function sanitizeMermaidCode(code: string): string {
  let sanitized = code.trim();
  
  // Remove markdown code blocks if present
  sanitized = sanitized.replace(/^```mermaid\n?/i, '');
  sanitized = sanitized.replace(/^```\n?/i, '');
  sanitized = sanitized.replace(/\n?```$/i, '');
  
  // Remove extra whitespace
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  return sanitized.trim();
}

/**
 * Generates a unique ID for diagrams
 */
export function generateDiagramId(): string {
  return `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}



// =================================================================
/**
 * Saves a diagram to localStorage
 */
// export function saveDiagramToLocal(diagram: StoredDiagram): void {
//   try {
//     const key = `mermaid-diagram-${diagram.id}`;
//     localStorage.setItem(key, JSON.stringify(diagram));
    
//     // Update index of diagrams
//     const indexKey = 'mermaid-diagrams-index';
//     const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[];
    
//     if (!index.includes(diagram.id)) {
//       index.push(diagram.id);
//       localStorage.setItem(indexKey, JSON.stringify(index));
//     }
//   } catch (error) {
//     console.error('Error saving diagram:', error);
//     throw error;
//   }
// }

// /**
//  * Loads a diagram from localStorage
//  */
// export function loadDiagramFromLocal(id: string): StoredDiagram | null {
//   try {
//     const key = `mermaid-diagram-${id}`;
//     const data = localStorage.getItem(key);
    
//     if (!data) return null;
    
//     return JSON.parse(data) as StoredDiagram;
//   } catch (error) {
//     console.error('Error loading diagram:', error);
//     return null;
//   }
// }

// /**
//  * Lists all saved diagrams from localStorage
//  */
// export function listLocalDiagrams(): StoredDiagram[] {
//   try {
//     const indexKey = 'mermaid-diagrams-index';
//     const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[];
    
//     return index
//       .map(id => loadDiagramFromLocal(id))
//       .filter((diagram): diagram is StoredDiagram => diagram !== null);
//   } catch (error) {
//     console.error('Error listing diagrams:', error);
//     return [];
//   }
// }

// /**
//  * Deletes a diagram from localStorage
//  */
// export function deleteDiagramFromLocal(id: string): void {
//   try {
//     const key = `mermaid-diagram-${id}`;
//     localStorage.removeItem(key);
    
//     // Update index
//     const indexKey = 'mermaid-diagrams-index';
//     const index = JSON.parse(localStorage.getItem(indexKey) || '[]') as string[];
//     const newIndex = index.filter(diagramId => diagramId !== id);
//     localStorage.setItem(indexKey, JSON.stringify(newIndex));
//   } catch (error) {
//     console.error('Error deleting diagram:', error);
//     throw error;
//   }
// }