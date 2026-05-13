import { config } from '../config.js';
export const getWorkspaceConfigTool = async () => {
    const info = config.workspaceInfo;
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    workspaceRoot: info.workspaceRoot,
                    hasConfig: info.hasConfig,
                    projectId: config.projectId,
                    projectName: info.config?.projectName,
                    currentTaskId: config.currentTaskId,
                    tenantName: info.config?.tenantName,
                    configPath: info.configPath,
                }, null, 2),
            },
        ],
    };
};
