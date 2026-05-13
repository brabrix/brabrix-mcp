import { config } from '../config.js';
export const addTaskCommentTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const { taskId, comment } = args;
    if (!taskId) {
        throw new Error('taskId é obrigatório.');
    }
    if (!comment || comment.trim().length === 0) {
        throw new Error('O comentário não pode estar vazio.');
    }
    if (comment.length > 5000) {
        throw new Error('O comentário excede o limite de 5000 caracteres.');
    }
    await client.addTaskComment(projectId, taskId, comment);
    return {
        content: [{ type: 'text', text: `Comentário adicionado à tarefa ${taskId}.` }],
    };
};
