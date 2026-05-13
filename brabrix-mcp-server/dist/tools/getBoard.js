import { config } from '../config.js';
export const getBoardTool = async (client, args) => {
    const projectId = args.projectId || config.projectId || 'demo-project';
    const board = await client.getBoard(projectId);
    return {
        content: [{ type: 'text', text: JSON.stringify(board, null, 2) }],
    };
};
