import { BrabrixError } from '../utils/errors.js';
import { jsonContent, parseString } from './shared.js';
export const getSkillTool = async (client, args = {}) => {
    const skillId = parseString(args.skillId);
    if (!skillId) {
        throw new BrabrixError('skillId é obrigatório para consultar Skill/Rule.');
    }
    const skill = await client.getSkill(skillId);
    return jsonContent({
        id: skill.id,
        title: skill.title,
        description: skill.description,
        type: skill.type,
        category: skill.category,
        content: skill.content,
        tags: skill.tags || [],
        origin: skill.origin,
        scope: skill.scope,
        status: skill.status || 'ACTIVE',
        featured: skill.featured || false,
        baseSkill: skill.baseSkill || false,
    });
};
