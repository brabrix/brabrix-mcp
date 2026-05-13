import { jsonContent, parseBoolean, resolveProjectIdOrThrow } from './shared.js';
export const getProjectRulesTool = async (client, args = {}) => {
    const projectId = resolveProjectIdOrThrow(args.projectId);
    const requiredOnly = parseBoolean(args.requiredOnly) || false;
    const rules = await client.getProjectRules(projectId, requiredOnly);
    return jsonContent({
        projectId,
        requiredOnly,
        total: rules.length,
        rules: rules.map(rule => ({
            id: rule.id,
            skillId: rule.skillId || rule.id,
            title: rule.title,
            category: rule.category,
            content: rule.content || '',
            origin: rule.origin,
            required: rule.required || false,
            priority: rule.priority,
        })),
        message: rules.length === 0
            ? 'Nenhuma Rule aplicada ao projeto para este filtro.'
            : undefined,
    });
};
