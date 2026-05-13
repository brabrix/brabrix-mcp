import { jsonContent, parseSkillStatus, parseSkillType, parseString } from './shared.js';
export const listMySkillsTool = async (client, args = {}) => {
    const type = parseSkillType(args.type);
    const category = parseString(args.category);
    const status = parseSkillStatus(args.status) || 'ACTIVE';
    const q = parseString(args.q);
    const items = await client.listMySkills({
        type,
        category,
        status,
        q,
    });
    const summaries = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        category: item.category,
        tags: item.tags || [],
        status: item.status || 'ACTIVE',
        origin: 'PRIVATE',
    }));
    return jsonContent({
        total: summaries.length,
        filters: { type, category, status, q },
        items: summaries,
        note: 'Conteúdo completo não é retornado nesta listagem. Use brabrix_get_skill para detalhes.',
    });
};
