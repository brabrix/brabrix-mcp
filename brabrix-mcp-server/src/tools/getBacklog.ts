import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';

export const getBacklogTool = async (client: BrabrixClient, args: { projectId?: string, status?: string, type?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  let backlog = await client.getBacklog(projectId);

  if (args.status) {
    backlog = backlog.filter(item => item.status === args.status);
  }
  if (args.type) {
    backlog = backlog.filter(item => item.type === args.type);
  }

  const summary = {
    epics: backlog.filter(i => i.type === 'EPIC'),
    features: backlog.filter(i => i.type === 'FEATURE'),
    userStories: backlog.filter(i => i.type === 'USER_STORY'),
    tasks: backlog.filter(i => i.type === 'TASK'),
    bugs: backlog.filter(i => i.type === 'BUG'),
    improvements: backlog.filter(i => i.type === 'IMPROVEMENT'),
    documentation: backlog.filter(i => i.type === 'DOCUMENTATION'),
  };

  return {
    content: [{ type: 'text', text: JSON.stringify({ items: backlog, summary }, null, 2) }],
  };
};
