'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { cleanAndValidate } from '@/lib/mermaidValid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';

// Initialize Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

type DiagramType = 'sequence' | 'er';

interface MermaidResponse {
  mermaidCode: string;
  success: boolean;
  type: DiagramType;
  warning?: string;
  error?: string;
  attempts?: number;
}

export default function MermaidRenderTest2() {
  const [prompt, setPrompt] = useState('');
  const [diagramType, setDiagramType] = useState<DiagramType>('sequence');
  const [mermaidCode, setMermaidCode] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Generate diagram
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setWarnings([]);
    setMermaidCode('');

    try {
      const response = await axios.post<MermaidResponse>('/api/generate-mermaid', {
        prompt: prompt.trim(),
        type: diagramType,
      });

      const rawCode = response.data.mermaidCode;

      // Clean and validate on frontend
      const result = await cleanAndValidate(rawCode);

      if (result.success) {
        setMermaidCode(result.cleanedCode);
        if (result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
        if (response.data.warning) {
          setWarnings(prev => [...prev, response.data.warning!]);
        }
      } else {
        setError(result.error || 'Validation failed');
        setMermaidCode(rawCode); // Show it anyway for debugging
      }

    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to generate diagram');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render Mermaid diagram
  useEffect(() => {
    const renderDiagram = async () => {
      if (mermaidCode && mermaidRef.current) {
        try {
          mermaidRef.current.innerHTML = '';
          
          const id = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(id, mermaidCode);
          
          mermaidRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          mermaidRef.current.innerHTML = `
            <div class="text-red-500 p-4 border border-red-300 rounded">
              <p class="font-semibold">Failed to render diagram</p>
              <p class="text-sm mt-2">${error instanceof Error ? error.message : 'Invalid syntax'}</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Mermaid Diagram Generator</CardTitle>
          <p className="text-sm text-gray-500">Sequence Diagrams & ER Diagrams</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagram Type Selector */}
          <Tabs value={diagramType} onValueChange={(v) => setDiagramType(v as DiagramType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sequence">Sequence Diagram</TabsTrigger>
              <TabsTrigger value="er">ER Diagram</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Input Form */}
          <form onSubmit={handleGenerate} className="flex gap-2">
            <Input
              type="text"
              placeholder={
                diagramType === 'sequence' 
                  ? 'e.g., "user authentication flow"'
                  : 'e.g., "e-commerce database schema"'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={200}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </form>

          <p className="text-sm text-gray-500">
            {prompt.length}/200 characters
          </p>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm">
                  <p className="font-semibold mb-1">Auto-fixes applied:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Diagram Display */}
          {mermaidCode && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div 
                    ref={mermaidRef} 
                    className="flex justify-center items-center min-h-[200px] overflow-auto"
                  />
                </CardContent>
              </Card>

              {/* Code Preview */}
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold mb-2">
                  View Mermaid Code
                </summary>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                  <code>{mermaidCode}</code>
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}