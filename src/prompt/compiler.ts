export interface PromptBlock {
  type: 'text';
  text: string;
  cache_control?: {
    type: 'ephemeral';
  };
}

export interface MessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string | PromptBlock[];
}

export interface CompilationResult {
  rawPayload: MessagePayload[];
  hasCacheMarkers: boolean;
  estimatedTokens: number;
}

export class PromptCompiler {
  private systemPrompt: string;
  private toolsSchema: any[];
  private projectRules: string;

  constructor(systemPrompt: string, toolsSchema: any[], projectRules: string) {
    this.systemPrompt = systemPrompt;
    this.toolsSchema = toolsSchema;
    this.projectRules = projectRules;
  }

  /**
   * Compiles the full conversation payload by strictly organizing system, tools, 
   * and dynamic instructions to maximize provider-side prefix caching.
   */
  public compile(
    provider: 'gemini' | 'claude' | 'openai',
    userQuery: string,
    history: MessagePayload[] = [],
    toolResults: string = ''
  ): CompilationResult {
    const payload: MessagePayload[] = [];
    let hasCacheMarkers = false;

    // 1. Static Prefix Block (system parameters, tool definitions, architecture rules)
    const staticHeaderContent: PromptBlock[] = [
      {
        type: 'text',
        text: `Identity and System Constraints:\n${this.systemPrompt}`
      },
      {
        type: 'text',
        text: `Available Core Tools & Schemas:\n${JSON.stringify(this.toolsSchema, null, 2)}`
      },
      {
        type: 'text',
        text: `Static Project Guidelines and Architectural Conventions:\n${this.projectRules}`
      }
    ];

    // Under Anthropic Claude, we insert an explicit cache breakpoint right at the end of the static block
    if (provider === 'claude') {
      staticHeaderContent[staticHeaderContent.length - 1].cache_control = {
        type: 'ephemeral'
      };
      hasCacheMarkers = true;
    }

    // Add static system message at the head of the payload
    payload.push({
      role: 'system',
      content: provider === 'claude' ? staticHeaderContent : staticHeaderContent.map(b => b.text).join('\n\n')
    });

    // 2. Append turn history (if any)
    for (const turn of history) {
      payload.push(turn);
    }

    // 3. Exclude Tool Results Caching Strategy (Dynamic tail segment)
    let dynamicTail = '';
    
    if (toolResults) {
      dynamicTail += `=== EXCLUDE TOOL RESULTS CACHING SEPARATOR ===\n`;
      dynamicTail += `Active Tool Outputs / Terminal Execution Logs:\n${toolResults}\n\n`;
    }

    dynamicTail += `=== DYNAMIC TURN SEPARATOR ===\n`;
    dynamicTail += `Current User Query / Engineering Request:\n${userQuery}`;

    payload.push({
      role: 'user',
      content: dynamicTail
    });

    // Calculate a rough estimated token footprint (4 characters = 1 token average)
    let totalChars = 0;
    for (const msg of payload) {
      if (typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        totalChars += msg.content.reduce((acc, block) => acc + block.text.length, 0);
      }
    }
    const estimatedTokens = Math.ceil(totalChars / 4);

    return {
      rawPayload: payload,
      hasCacheMarkers,
      estimatedTokens
    };
  }
}
