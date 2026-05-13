import { config } from '../config.js';
export const getTechnicalSpecTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const techSpec = await client.getTechnicalSpec(projectId);
    if (!techSpec.content) {
        return {
            content: [{ type: 'text', text: 'Nenhuma especificação técnica encontrada.' }],
        };
    }
    return {
        content: [{ type: 'text', text: techSpec.content }],
    };
};
