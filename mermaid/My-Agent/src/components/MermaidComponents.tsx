'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Copy, Download, CheckCircle2, XCircle } from 'lucide-react';

/* ============================================================================
 * COMBINED MERMAID COMPONENTS
 * ============================================================================
 * 
 * This file contains all Mermaid-related components in one place:
 * 1. Mermaid - Basic diagram renderer with validation
 * 2. AIMermaidGenerator - AI-powered diagram generator
 * 3. MermaidEditor - Interactive diagram editor with templates
 * 
 * USAGE EXAMPLES:
 * ============================================================================
 * 
 * EXAMPLE 1: Basic Mermaid Renderer
 * ============================================================================
 * import { Mermaid } from '@/components/MermaidComponents';
 * 
 * function MyComponent() {
 *   const diagramCode = `
 *     flowchart TD
 *       A[Start] --> B[Process]
 *       B --> C[End]
 *   `;
 *   
 *   return (
 *     <Mermaid 
 *       chart={diagramCode} 
 *       className="w-full"
 *       onError={(error) => console.error('Diagram error:', error)}
 *     />
 *   );
 * }
 * 
 * ============================================================================
 * EXAMPLE 2: AI Mermaid Generator
 * ============================================================================
 * import { AIMermaidGenerator } from '@/components/MermaidComponents';
 * 
 * function MyPage() {
 *   return (
 *     <div className="container mx-auto p-6">
 *       <AIMermaidGenerator />
 *     </div>
 *   );
 * }
 * 
 * // User can type: "Create a sequence diagram for OAuth authentication"
 * // AI will generate the Mermaid code automatically
 * 
 * ============================================================================
 * EXAMPLE 3: Mermaid Editor with Templates
 * ============================================================================
 * import { MermaidEditor } from '@/components/MermaidComponents';
 * 
 * function MyEditorPage() {
 *   const handleSave = (diagram: string) => {
 *     console.log('Saving diagram:', diagram);
 *     // Save to database, localStorage, etc.
 *   };
 *   
 *   return (
 *     <div className="container mx-auto p-6">
 *       <MermaidEditor 
 *         initialDiagram="flowchart TD\n  A[Start]"
 *         onSave={handleSave}
 *       />
 *     </div>
 *   );
 * }
 * 
 * ============================================================================
 * EXAMPLE 4: Using All Components Together
 * ============================================================================
 * import { Mermaid, AIMermaidGenerator, MermaidEditor } from '@/components/MermaidComponents';
 * 
 * function FullMermaidSuite() {
 *   const [diagram, setDiagram] = useState('');
 *   
 *   return (
 *     <div className="space-y-8">
 *       {/* Generate with AI *\/}
 *       <AIMermaidGenerator />
 *       
 *       {/* Or edit manually *\/}
 *       <MermaidEditor onSave={setDiagram} />
 *       
 *       {/* Render the result *\/}
 *       {diagram && <Mermaid chart={diagram} />}
 *     </div>
 *   );
 * }
 * 
 * ============================================================================
 */

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface MermaidProps {
  chart: string;
  className?: string;
  onError?: (error: string) => void;
}

interface MermaidEditorProps {
  initialDiagram?: string;
  onSave?: (diagram: string) => void;
}

// ============================================================================
// COMPONENT 1: BASIC MERMAID RENDERER
// ============================================================================

/**
 * Mermaid Component - Renders Mermaid diagrams with syntax validation
 * 
 * Features:
 * - Validates Mermaid syntax before rendering
 * - Shows error messages for invalid syntax
 * - Supports all Mermaid diagram types (flowchart, sequence, class, etc.)
 * - Properly cleans up on unmount
 * 
 * @param chart - The Mermaid diagram code to render
 * @param className - Optional CSS classes to apply
 * @param onError - Optional callback when validation/render fails
 */
export function Mermaid({ chart, className = '', onError }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'monospace',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !chart.trim()) {
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        setError(null);

        // Validate syntax before rendering
        const validation = await mermaid.parse(chart);
        
        if (!validation) {
          throw new Error('Invalid Mermaid syntax');
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, chart);
        
        // Insert the SVG into the container
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }

        setIsValidating(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
        setError(errorMessage);
        setIsValidating(false);
        
        if (onError) {
          onError(errorMessage);
        }

        console.error('Mermaid rendering error:', err);
      }
    };

    renderDiagram();

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [chart, onError]);

  if (isValidating) {
    return (
      <div className={`mermaid-container ${className}`}>
        <div className="flex items-center justify-center p-4 text-sm text-gray-500">
          Validating diagram...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mermaid-container ${className}`}>
        <div className="border border-red-300 bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-semibold mb-2">Invalid Mermaid Syntax</h3>
          <p className="text-red-600 text-sm font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`mermaid-container ${className}`}
    />
  );
}

// ============================================================================
// COMPONENT 2: AI MERMAID GENERATOR
// ============================================================================

/**
 * AIMermaidGenerator Component - AI-powered Mermaid diagram generator
 * 
 * Features:
 * - Generates Mermaid diagrams from natural language prompts
 * - Validates syntax before rendering
 * - Copy and download functionality
 * - Example prompts for quick start
 * 
 * Usage: Simply drop this component in your page, no props required
 */
export function AIMermaidGenerator() {
  const [generatedDiagram, setGeneratedDiagram] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    
    try {
      // Call your AI API endpoint to generate Mermaid syntax
      const response = await fetch('/api/generate-mermaid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const data = await response.json();
      
      if (data.mermaidCode) {
        setGeneratedDiagram(data.mermaidCode);
      }
    } catch (error) {
      console.error('Error generating diagram:', error);
      // Fallback: Generate a simple example
      setGeneratedDiagram(`sequenceDiagram
    participant User
    participant System
    User->>System: ${userPrompt}
    System->>User: Response`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDiagram);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDiagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Mermaid Generator
          </CardTitle>
          <CardDescription>
            Describe the diagram you want to create, and AI will generate the Mermaid syntax for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Example: Create a sequence diagram showing a user login flow with email verification and 2FA..."
            className="min-h-[120px]"
          />
          
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !userPrompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating diagram...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Diagram
              </>
            )}
          </Button>

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Example prompts:</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPrompt("Create a sequence diagram showing how a user authenticates with OAuth, including authorization code flow")}
              >
                OAuth Flow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPrompt("Create a flowchart for a payment processing system with fraud detection")}
              >
                Payment System
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserPrompt("Create a class diagram for an e-commerce system with users, products, orders, and payments")}
              >
                E-commerce Classes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Diagram */}
      {generatedDiagram && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Code</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono">
                {generatedDiagram}
              </pre>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white min-h-[400px] overflow-auto">
                <Mermaid chart={generatedDiagram} className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT 3: MERMAID EDITOR
// ============================================================================

/**
 * MermaidEditor Component - Interactive editor for Mermaid diagrams
 * 
 * Features:
 * - Live preview of Mermaid diagrams
 * - Syntax validation before rendering
 * - Pre-built templates for common diagram types
 * - Error handling and display
 * - Save functionality
 * 
 * @param initialDiagram - Optional initial diagram code
 * @param onSave - Optional callback when user saves the diagram
 */
export function MermaidEditor({ initialDiagram = '', onSave }: MermaidEditorProps) {
  const [diagramCode, setDiagramCode] = useState(initialDiagram);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleError = (error: string) => {
    setValidationError(error);
  };

  const handleSave = () => {
    if (onSave && !validationError) {
      onSave(diagramCode);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const loadTemplate = (template: string) => {
    const templates: Record<string, string> = {
      sequence: `sequenceDiagram
    participant User
    participant AI
    participant Validator
    participant Renderer

    User->>AI: Send prompt
    AI->>Validator: Generate Mermaid syntax
    Validator->>Validator: Validate syntax
    alt syntax valid
        Validator->>Renderer: Pass validated syntax
        Renderer->>User: Display diagram
    else syntax invalid
        Validator->>AI: Return error
        AI->>User: Show error message
    end`,
      flowchart: `flowchart TD
    A[Start] --> B{Is syntax valid?}
    B -->|Yes| C[Render Diagram]
    B -->|No| D[Show Error]
    C --> E[Display to User]
    D --> F[Request Correction]
    F --> A`,
      class: `classDiagram
    class MermaidComponent {
        +String chart
        +validate()
        +render()
        +handleError()
    }
    class Validator {
        +validateSyntax()
        +parse()
    }
    class Renderer {
        +generateSVG()
        +display()
    }
    MermaidComponent --> Validator
    MermaidComponent --> Renderer`,
      gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Define Requirements :a1, 2024-01-01, 7d
    Design System :a2, after a1, 5d
    section Development
    Setup Environment :b1, after a2, 2d
    Build Components :b2, after b1, 10d
    section Testing
    Integration Tests :c1, after b2, 5d
    Deploy :c2, after c1, 2d`,
      er: `erDiagram
    USER ||--o{ DIAGRAM : creates
    USER {
        string id
        string name
        string email
    }
    DIAGRAM {
        string id
        string type
        string content
        datetime created_at
    }
    DIAGRAM ||--o{ VERSION : has
    VERSION {
        string id
        int version_number
        string content
    }`
    };

    setDiagramCode(templates[template] || '');
    setValidationError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Mermaid Editor</CardTitle>
          <CardDescription>
            Write or paste your Mermaid diagram code below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadTemplate('sequence')}
            >
              Sequence Diagram
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadTemplate('flowchart')}
            >
              Flowchart
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadTemplate('class')}
            >
              Class Diagram
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadTemplate('gantt')}
            >
              Gantt Chart
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadTemplate('er')}
            >
              ER Diagram
            </Button>
          </div>

          {/* Code Editor */}
          <Textarea
            value={diagramCode}
            onChange={(e) => {
              setDiagramCode(e.target.value);
              setValidationError(null);
            }}
            placeholder="Enter your Mermaid diagram code here..."
            className="font-mono text-sm min-h-[400px]"
          />

          {/* Validation Status */}
          {validationError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {!validationError && diagramCode && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Syntax is valid
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          {onSave && (
            <Button
              onClick={handleSave}
              disabled={!diagramCode || !!validationError}
              className="w-full"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                'Save Diagram'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Your diagram will appear here after validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {diagramCode ? (
            <div className="border rounded-lg p-4 bg-white min-h-[400px] overflow-auto">
              <Mermaid
                chart={diagramCode}
                onError={handleError}
                className="w-full"
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                Select a template or enter code to see preview
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default { Mermaid, AIMermaidGenerator, MermaidEditor };
