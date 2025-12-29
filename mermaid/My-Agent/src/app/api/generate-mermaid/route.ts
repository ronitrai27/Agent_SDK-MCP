import { openai } from '@ai-sdk/openai';
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

type DiagramType = "sequence" | "er";

interface GenerateRequest {
  prompt: string;
  type: DiagramType;
}

/**
 * Basic syntax validation (server-side, no mermaid dependency)
 */
function basicValidation(
  code: string,
  type: DiagramType
): { isValid: boolean; error?: string } {
  const trimmed = code.trim();

  if (!trimmed) {
    return { isValid: false, error: "Empty code" };
  }

  if (type === "sequence") {
    if (!trimmed.toLowerCase().startsWith("sequencediagram")) {
      return { isValid: false, error: "Must start with sequenceDiagram" };
    }
  } else if (type === "er") {
    if (!trimmed.toLowerCase().startsWith("erdiagram")) {
      return { isValid: false, error: "Must start with erDiagram" };
    }
  }

  // Check minimum line count
  const lines = trimmed
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("%%"));
  if (lines.length < 2) {
    return { isValid: false, error: "Diagram too short" };
  }

  return { isValid: true };
}

/**
 * Cleans AI output
 */
function cleanAIOutput(text: string): string {
  let cleaned = text.trim();

  // Remove markdown blocks
  cleaned = cleaned.replace(/^```mermaid\s*\n?/i, "");
  cleaned = cleaned.replace(/^```\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, "");

  return cleaned.trim();
}

/**
 * Get AI system prompt based on diagram type
 */
function getSystemPrompt(type: DiagramType): string {
  if (type === "sequence") {
    return `You are an expert in creating Mermaid sequence diagrams.

RULES:
1. Return ONLY valid sequenceDiagram syntax
2. Start with "sequenceDiagram"
3. Quote participant names with special characters: participant "User Service"
4. Quote arrow labels with special characters: A->>B: "Process (Step 1)"
5. Use proper arrow syntax:
   - ->> for solid arrows
   - -->> for dotted arrows
   - ->>+ to activate
   - ->>- to deactivate
6. Add Notes when helpful: Note over A,B: Description

EXAMPLES:
sequenceDiagram
    participant "User (Client)"
    participant "API Gateway"
    participant "Database"
    
    "User (Client)"->>"API Gateway": "Login Request"
    "API Gateway"->>"Database": "Verify Credentials"
    "Database"-->>"API Gateway": "User Data"
    "API Gateway"-->>"User (Client)": "Auth Token"

Return ONLY the diagram code, no explanations, no markdown blocks.`;
  } else {
    return `You are an expert in creating Mermaid ER (Entity-Relationship) diagrams.

RULES:
1. Return ONLY valid erDiagram syntax
2. Start with "erDiagram"
3. Define entities with attributes: ENTITY { type name }
4. Use proper relationship syntax:
   - ||--|| : one to one
   - ||--o{ : one to many
   - }o--o{ : many to many
5. Quote labels with special characters

EXAMPLES:
erDiagram
    USER {
        int id PK
        string email
        string name
    }
    
    ORDER {
        int id PK
        int user_id FK
        datetime created_at
        string status
    }
    
    PRODUCT {
        int id PK
        string name
        decimal price
    }
    
    USER ||--o{ ORDER : "places"
    ORDER }o--o{ PRODUCT : "contains"

Return ONLY the diagram code, no explanations, no markdown blocks.`;
  }
}

export async function POST(req: NextRequest) {
  console.log("Received request");
  try {
    const body = (await req.json()) as GenerateRequest;
    const { prompt, type } = body;
    console.log("Received request", body);

    // Validation
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Valid prompt string is required" },
        { status: 400 }
      );
    }

    if (!type || !["sequence", "er"].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "sequence" or "er"' },
        { status: 400 }
      );
    }

    if (prompt.length > 200) {
      return NextResponse.json(
        { error: "Prompt too long (max 200 characters)" },
        { status: 400 }
      );
    }

    // Generate diagram
    const { text } = await generateText({
      model: openai('gpt-4.1-mini'),
      system: getSystemPrompt(type),
      prompt: `Create a ${type} diagram for: ${prompt}`,
      maxOutputTokens: 1000,
    });

    console.log("Generated text raw from GPT--->", text);
    let mermaidCode = cleanAIOutput(text);

    // Strict validation
    const validation = basicValidation(mermaidCode, type);

    if (!validation.isValid) {
      console.error("Validation failed:", validation.error);
      console.error("Generated code:", mermaidCode);

      return NextResponse.json(
        {
          error: "AI generated invalid diagram syntax",
          details: validation.error,
          generatedCode: mermaidCode,
        },
        { status: 422 }
      );
    }

    // Success - pass to frontend for mermaid parser validation
    return NextResponse.json({
      mermaidCode,
      success: true,
      type,
    });
  } catch (error) {
    console.error("Error generating diagram:", error);

    return NextResponse.json(
      {
        error: "Failed to generate diagram",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
