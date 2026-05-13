import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';

export const getBoardTool = async (client: BrabrixClient, args: { projectId?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  const board = await client.getBoard(projectId);
  return {
    content: [{ type: 'text', text: JSON.stringify(board, null, 2) }],
  };
};
