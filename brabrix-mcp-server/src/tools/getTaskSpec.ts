import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';

export const getTaskSpecTool = async (client: BrabrixClient, args: { projectId?: string, taskId?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  const taskId = args.taskId || config.currentTaskId;

  if (!taskId) {
    return {
      content: [{ type: 'text', text: 'Nenhum taskId fornecido ou configurado.' }],
      isError: true,
    };
  }

  const spec = await client.getTaskSpec(projectId, taskId);
  
  if (!spec.content) {
    return {
      content: [{ type: 'text', text: 'Nenhuma spec de desenvolvimento encontrada para este item.' }],
    };
  }

  return {
    content: [{ type: 'text', text: spec.content }],
  };
};
