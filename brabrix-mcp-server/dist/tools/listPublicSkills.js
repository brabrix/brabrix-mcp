import { jsonContent, parseBoolean, parseSkillType, parseString } from './shared.js';
export const listPublicSkillsTool = async (client, args = {}) => {
    const type = parseSkillType(args.type);
    const category = parseString(args.category);
    const featured = parseBoolean(args.featured);
    const q = parseString(args.q);
    const items = await client.listPublicSkills({
        type,
        category,
        featured,
        q,
    });
    const summaries = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        category: item.category,
        tags: item.tags || [],
        featured: item.featured || false,
        baseSkill: item.baseSkill || false,
        origin: 'PUBLIC',
    }));
    return jsonContent({
        total: summaries.length,
        filters: { type, category, featured, q },
        items: summaries,
        note: 'Conteúdo completo não é retornado nesta listagem. Use brabrix_get_skill para detalhes.',
    });
};
