import { BacklogItem } from './backlog.js';
import { ProjectContext } from './project.js';
import { TaskSpec, WorkflowArtifact } from './taskSpec.js';

export type DevSkillType = 'SKILL' | 'RULE';
export type DevSkillScope = 'PLATFORM' | 'TENANT';
export type DevSkillOrigin = 'PUBLIC' | 'PRIVATE';
export type DevSkillStatus = 'ACTIVE' | 'INACTIVE';

export interface DevSkillSummary {
  id: string;
  title: string;
  description?: string;
  type: DevSkillType;
  category?: string;
  tags?: string[];
  origin: DevSkillOrigin;
  scope?: DevSkillScope;
  featured?: boolean;
  baseSkill?: boolean;
  status?: DevSkillStatus;
}

export interface ProjectSkill {
  id: string;
  skillId?: string;
  title: string;
  description?: string;
  type: DevSkillType;
  category?: string;
  content?: string;
  contentPreview?: string;
  origin: DevSkillOrigin;
  scope?: DevSkillScope;
  required?: boolean;
  priority?: number;
  appliedAt?: string;
  status?: DevSkillStatus;
}

export interface SkillDetail {
  id: string;
  title: string;
  description?: string;
  type: DevSkillType;
  category?: string;
  content: string;
  tags?: string[];
  origin: DevSkillOrigin;
  scope?: DevSkillScope;
  status?: DevSkillStatus;
  featured?: boolean;
  baseSkill?: boolean;
}

export interface ListPublicSkillsParams {
  type?: DevSkillType;
  category?: string;
  featured?: boolean;
  q?: string;
}

export interface ListMySkillsParams {
  type?: DevSkillType;
  category?: string;
  status?: DevSkillStatus;
  q?: string;
}

export interface ListProjectSkillsParams {
  type?: DevSkillType;
}

export interface EffectiveProjectContextOptions {
  includeSkills?: boolean;
  includeRules?: boolean;
  includeBacklog?: boolean;
  includeArtifacts?: boolean;
}

export interface BacklogSummary {
  totalItems: number;
  byStatus: Record<string, number>;
  itemsPreview: Array<Pick<BacklogItem, 'id' | 'type' | 'title' | 'status' | 'priority'>>;
}

export interface EffectiveProjectContext {
  project: ProjectContext | null;
  currentTask: BacklogItem | null;
  taskSpec: TaskSpec | null;
  prd: WorkflowArtifact | null;
  technicalSpec: WorkflowArtifact | null;
  technicalArchitecture: WorkflowArtifact | null;
  quickStarter: WorkflowArtifact | null;
  skills: ProjectSkill[];
  rules: ProjectSkill[];
  backlogSummary: BacklogSummary | null;
  agentInstructions: string;
  warnings?: string[];
}
