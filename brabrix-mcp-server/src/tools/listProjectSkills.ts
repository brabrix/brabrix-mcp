import { BrabrixClient } from '../api/brabrixClient.js';
import { jsonContent, parseSkillType, resolveProjectIdOrThrow } from './shared.js';

interface ListProjectSkillsArgs {
  projectId?: unknown;
  type?: unknown;
}

export const listProjectSkillsTool = async (client: BrabrixClient, args: ListProjectSkillsArgs = {}) => {
  const projectId = resolveProjectIdOrThrow(args.projectId);
  const type = parseSkillType(args.type);

  const items = await client.listProjectSkills(projectId, { type });

  const summaries = items.map(item => ({
    id: item.id,
    skillId: item.skillId || item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    category: item.category,
    contentPreview: item.contentPreview,
    origin: item.origin,
    scope: item.scope,
    required: item.required || false,
    priority: item.priority,
    appliedAt: item.appliedAt,
  }));

  return jsonContent({
    projectId,
    total: summaries.length,
    filters: { type: type || null },
    items: summaries,
  });
};
