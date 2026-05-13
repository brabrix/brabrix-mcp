import { config } from '../config.js';
import { jsonContent, parseBoolean, parseString, resolveProjectIdOrThrow } from './shared.js';
export const getEffectiveProjectContextTool = async (client, args = {}) => {
    const projectId = resolveProjectIdOrThrow(args.projectId);
    const taskId = parseString(args.taskId) || config.currentTaskId;
    const includeSkills = parseBoolean(args.includeSkills) ?? true;
    const includeRules = parseBoolean(args.includeRules) ?? true;
    const includeBacklog = parseBoolean(args.includeBacklog) ?? true;
    const includeArtifacts = parseBoolean(args.includeArtifacts) ?? true;
    const context = await client.getEffectiveProjectContext(projectId, taskId, {
        includeSkills,
        includeRules,
        includeBacklog,
        includeArtifacts,
    });
    return jsonContent({
        projectId,
        taskId: taskId || null,
        options: {
            includeSkills,
            includeRules,
            includeBacklog,
            includeArtifacts,
        },
        project: context.project,
        currentTask: context.currentTask,
        taskSpec: context.taskSpec,
        prd: context.prd,
        technicalSpec: context.technicalSpec,
        technicalArchitecture: context.technicalArchitecture,
        quickStarter: context.quickStarter,
        skills: context.skills,
        rules: context.rules,
        backlogSummary: context.backlogSummary,
        agentInstructions: context.agentInstructions,
        warnings: context.warnings || [],
    });
};
