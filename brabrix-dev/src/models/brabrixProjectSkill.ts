export type BrabrixProjectSkillType = 'SKILL' | 'RULE';
export type BrabrixProjectSkillStatus = 'ACTIVE' | 'INACTIVE';
export type BrabrixProjectSkillScope = 'PLATFORM' | 'TENANT';
export type BrabrixProjectSkillOrigin = 'PUBLIC' | 'PRIVATE';

export interface BrabrixProjectSkill {
    id: string;
    title: string;
    description?: string;
    type: BrabrixProjectSkillType;
    category?: string;
    content: string;
    status?: BrabrixProjectSkillStatus;
    scope?: BrabrixProjectSkillScope;
    origin?: BrabrixProjectSkillOrigin;
    required?: boolean;
    priority?: number;
    appliedAt?: string;
}

export interface BrabrixProjectSkillsExport {
    projectId: string;
    projectName?: string;
    skills: BrabrixProjectSkill[];
    rules: BrabrixProjectSkill[];
    consolidatedSkillsMarkdown?: string;
    consolidatedRulesMarkdown?: string;
}
