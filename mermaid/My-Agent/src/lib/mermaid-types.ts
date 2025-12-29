/**
 * Mermaid Diagram Types and Interfaces
 */

export type MermaidDiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'pie'
  | 'journey'
  | 'gitGraph'
  | 'mindmap'
  | 'timeline'
  | 'quadrantChart';

export interface MermaidConfig {
  startOnLoad?: boolean;
  theme?: 'default' | 'dark' | 'forest' | 'neutral' | 'base';
  securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  fontFamily?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

export interface DiagramMetadata {
  id: string;
  type: MermaidDiagramType;
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface StoredDiagram extends DiagramMetadata {
  mermaidCode: string;
  isValid: boolean;
  validationError?: string;
}

export interface GenerateDiagramRequest {
  prompt: string;
  diagramType?: MermaidDiagramType;
  includeComments?: boolean;
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface GenerateDiagramResponse {
  mermaidCode: string;
  success: boolean;
  diagramType?: MermaidDiagramType;
  error?: string;
  details?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Mermaid Diagram Templates
 */
export const MERMAID_TEMPLATES: Record<MermaidDiagramType, string> = {
  flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    
  sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B->>A: Hello Alice!`,
    
  class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
    
  state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing
    Processing --> Success
    Processing --> Error
    Success --> [*]
    Error --> Idle`,
    
  er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }`,
    
  gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Task 1 :a1, 2024-01-01, 7d
    Task 2 :after a1, 5d`,
    
  pie: `pie title Pets
    "Dogs" : 386
    "Cats" : 85
    "Birds" : 15`,
    
  journey: `journey
    title User Journey
    section Login
      Enter credentials: 5: User
      Authenticate: 3: System
    section Dashboard
      View data: 4: User`,
    
  gitGraph: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop`,
    
  mindmap: `mindmap
  root((Mermaid))
    Diagrams
      Flowchart
      Sequence
      Class
    Features
      AI Generation
      Validation
      Export`,
    
  timeline: `timeline
    title Project Milestones
    2024-01 : Planning
    2024-02 : Development
    2024-03 : Testing
    2024-04 : Launch`,
    
  quadrantChart: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]`,
};

/**
 * Example prompts for AI generation
 */
export const EXAMPLE_PROMPTS: Record<string, string> = {
  authentication: 'Create a sequence diagram showing a complete OAuth 2.0 authentication flow with authorization code grant type',
  ecommerce: 'Create a class diagram for an e-commerce system including users, products, orders, shopping cart, and payment processing',
  cicd: 'Create a flowchart showing a complete CI/CD pipeline with testing, staging, and production deployment',
  database: 'Create an ER diagram for a social media platform with users, posts, comments, likes, and followers',
  agile: 'Create a state diagram showing the lifecycle of a user story in an agile development process',
  microservices: 'Create a flowchart showing communication between microservices in a typical e-commerce application',
};
