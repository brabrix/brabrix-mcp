import { config } from '../config.js';
export const getProjectContextTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const project = await client.getProjectContext(projectId);
    return {
        content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
    };
};
