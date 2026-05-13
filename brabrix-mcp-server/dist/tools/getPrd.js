import { config } from '../config.js';
export const getPrdTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const prd = await client.getPrd(projectId);
    if (!prd.content) {
        return {
            content: [{ type: 'text', text: 'Nenhum PRD encontrado para este projeto.' }],
        };
    }
    return {
        content: [{ type: 'text', text: prd.content }],
    };
};
