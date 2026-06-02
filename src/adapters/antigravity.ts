import { Adapter, OutputFile, TalosContext } from './index.js';
import { renderTemplate } from '../render/renderTemplate.js';
import { getAgentsMd, shouldIncludeAgentsMd } from './common.js';

export const antigravityAdapter: Adapter = {
  name: 'antigravity',
  async render(context: TalosContext): Promise<OutputFile[]> {
    const outputs: OutputFile[] = [
      {
        path: 'GEMINI.md',
        content: renderTemplate('GEMINI.md.hbs', context),
        overwriteStrategy: 'merge',
      },
      {
        path: '.gemini/settings.json',
        content: JSON.stringify(
          {
            context: {
              fileName: "GEMINI.md"
            },
            approvalMode: "default"
          },
          null,
          2
        ),
        overwriteStrategy: 'safe',
      }
    ];
    if (shouldIncludeAgentsMd(true, context)) {
      const agentsMd = getAgentsMd(context);
      if (agentsMd) outputs.push(agentsMd);
    }
    return outputs;
  },
};
