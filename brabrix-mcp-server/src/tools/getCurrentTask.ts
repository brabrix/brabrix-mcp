import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';

export const getCurrentTaskTool = async (client: BrabrixClient, args: { projectId?: string, taskId?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  const task = await client.getCurrentTask(projectId, args.taskId);
  return {
    content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
  };
};
