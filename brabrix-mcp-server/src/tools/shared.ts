import { config } from '../config.js';
import { DevSkillStatus, DevSkillType } from '../models/skills.js';
import { BrabrixError } from '../utils/errors.js';

export const jsonContent = (payload: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
});

export const parseSkillType = (value: unknown): DevSkillType | undefined => {
  if (value !== 'SKILL' && value !== 'RULE') {
    return undefined;
  }
  return value;
};

export const parseSkillStatus = (value: unknown): DevSkillStatus | undefined => {
  if (value !== 'ACTIVE' && value !== 'INACTIVE') {
    return undefined;
  }
  return value;
};

export const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

export const parseString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export const resolveProjectIdOrThrow = (projectIdFromArgs?: unknown): string => {
  const projectId = parseString(projectIdFromArgs) || config.projectId;
  if (!projectId) {
    throw new BrabrixError('projectId não informado. Defina no input, em .brabrix/config.json ou BRABRIX_PROJECT_ID.');
  }
  return projectId;
};
