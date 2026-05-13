import { config } from '../config.js';
export async function suggestGitMetadataTool(client, args) {
    const projectId = args.projectId || config.projectId;
    const taskId = args.taskId || config.currentTaskId;
    if (!projectId || !taskId) {
        throw new Error('Project ID e Task ID são necessários.');
    }
    const task = await client.getCurrentTask(projectId, taskId);
    // Normalizar título para branch
    const normalizedTitle = task.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '-') // Apenas alfanuméricos e hifen
        .replace(/-+/g, '-') // Remover hifens duplos
        .replace(/^-|-$/g, ''); // Remover hifens no início/fim
    const typePrefix = task.type === 'BUG' ? 'fix' : 'feat';
    const branchName = `${typePrefix}/${taskId}-${normalizedTitle}`;
    const commitMessage = `${typePrefix}: ${task.title}\n\nRef: ${taskId}`;
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    branchName,
                    commitMessage,
                    taskId,
                    taskTitle: task.title
                }, null, 2),
            },
        ],
    };
}
