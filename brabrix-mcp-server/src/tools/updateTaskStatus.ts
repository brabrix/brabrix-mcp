import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';
import { BacklogItemStatus } from '../models/backlog.js';

export const updateTaskStatusTool = async (client: BrabrixClient, args: { projectId?: string, taskId: string, status: string, comment?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  const { taskId, status, comment } = args;

  if (!taskId) {
    throw new Error('taskId é obrigatório.');
  }

  const allowedStatus: BacklogItemStatus[] = ['TODO', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED'];
  if (!allowedStatus.includes(status as BacklogItemStatus)) {
    throw new Error(`Status inválido. Permitidos: ${allowedStatus.join(', ')}`);
  }

  const result = await client.updateTaskStatus(projectId, taskId, status as BacklogItemStatus, comment);
  
  return {
    content: [{ type: 'text', text: `Status da tarefa ${taskId} atualizado para ${status}.${comment ? ' Comentário adicionado.' : ''}` }],
  };
};
