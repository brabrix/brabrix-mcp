import { config } from '../config.js';
export const updateTaskStatusTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const { taskId, status, comment } = args;
    if (!taskId) {
        throw new Error('taskId é obrigatório.');
    }
    const allowedStatus = ['TODO', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED'];
    if (!allowedStatus.includes(status)) {
        throw new Error(`Status inválido. Permitidos: ${allowedStatus.join(', ')}`);
    }
    const result = await client.updateTaskStatus(projectId, taskId, status, comment);
    return {
        content: [{ type: 'text', text: `Status da tarefa ${taskId} atualizado para ${status}.${comment ? ' Comentário adicionado.' : ''}` }],
    };
};
