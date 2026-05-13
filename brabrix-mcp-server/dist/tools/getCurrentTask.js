import { config } from '../config.js';
export const getCurrentTaskTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const task = await client.getCurrentTask(projectId, args.taskId);
    return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
    };
};
