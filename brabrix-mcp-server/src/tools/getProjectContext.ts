import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';

export const getProjectContextTool = async (client: BrabrixClient, args: { projectId?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  const project = await client.getProjectContext(projectId);
  return {
    content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
  };
};
