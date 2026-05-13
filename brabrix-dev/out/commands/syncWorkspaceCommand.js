"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncWorkspaceCommand = syncWorkspaceCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const projectSkillsSyncService_1 = require("../services/projectSkillsSyncService");
async function syncWorkspaceCommand(client, workspaceConfig, syncStateService, refreshAll, showMessages = true) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root)
        return;
    const config = await workspaceConfig.readConfig();
    if (!config) {
        if (showMessages)
            vscode.window.showWarningMessage("Nenhum projeto vinculado para sincronizar.");
        return;
    }
    if (showMessages) {
        vscode.window.showInformationMessage("Sincronizando contexto da Brabrix...");
    }
    const cacheFolder = path.join(root.fsPath, '.brabrix', 'cache');
    const contextFolder = path.join(root.fsPath, '.brabrix', 'context');
    if (!fs.existsSync(cacheFolder))
        fs.mkdirSync(cacheFolder, { recursive: true });
    if (!fs.existsSync(contextFolder))
        fs.mkdirSync(contextFolder, { recursive: true });
    try {
        // 1. Fetch data
        const project = await client.getProject(config.projectId);
        const backlog = await client.listBacklog(config.projectId);
        let exportContext;
        try {
            exportContext = await client.exportProjectContext(config.projectId);
        }
        catch (e) {
            console.warn("Export context not available", e);
        }
        // Fetch workflow artifacts
        const workflowDocs = {};
        if (!config.isLocal) {
            try {
                const workflow = await client.getWorkflowState(config.projectId);
                for (const step of workflow.steps) {
                    if (step.currentArtifactId) {
                        const artifact = await client.getWorkflowArtifact(config.projectId, step.currentArtifactId);
                        workflowDocs[step.step] = artifact.content;
                    }
                }
            }
            catch (e) {
                console.warn("Workflow artifacts not available during sync", e);
            }
        }
        // 2. Save cache JSON
        fs.writeFileSync(path.join(cacheFolder, 'project.json'), JSON.stringify(project, null, 2));
        fs.writeFileSync(path.join(cacheFolder, 'backlog.json'), JSON.stringify(backlog, null, 2));
        if (exportContext) {
            fs.writeFileSync(path.join(cacheFolder, 'export-context.json'), JSON.stringify(exportContext, null, 2));
        }
        // 3. Generate Markdown Context Files
        const generatedFiles = [];
        const writeMd = (filename, content) => {
            const filepath = path.join(contextFolder, filename);
            fs.writeFileSync(filepath, content, 'utf8');
            generatedFiles.push(`.brabrix/context/${filename}`);
        };
        // project-context.md
        const syncDate = new Date().toLocaleString();
        let projContent = workflowDocs['BRIEFING'] || exportContext?.projectContextMd || `# ${project.name}\nStatus: ${project.status}\nCliente: ${project.customerName || 'N/A'}`;
        projContent += `\n\n> Última sincronização: ${syncDate}`;
        writeMd('project-context.md', projContent);
        // prd.md
        writeMd('prd.md', workflowDocs['PRD'] || exportContext?.prdMd || 'PRD não encontrado na Brabrix para este projeto.');
        // technical-spec.md
        writeMd('technical-spec.md', workflowDocs['TECHNICAL_SPEC'] || exportContext?.technicalSpecMd || 'Spec técnica não encontrada na Brabrix para este projeto.');
        // backlog.md
        let backlogMd = exportContext?.backlogMd;
        if (!backlogMd) {
            backlogMd = `# Backlog\n\n`;
            backlog.forEach(item => {
                backlogMd += `- **[${item.type}]** ${item.title} (${item.status})\n`;
            });
        }
        writeMd('backlog.md', backlogMd);
        // user-stories.md
        let userStoriesMd = exportContext?.userStoriesMd;
        if (!userStoriesMd) {
            userStoriesMd = `# User Stories\n\n`;
            backlog.filter(i => i.type === 'USER_STORY').forEach(us => {
                userStoriesMd += `## ${us.title}\nStatus: ${us.status}\n\n`;
            });
        }
        writeMd('user-stories.md', userStoriesMd);
        // acceptance-criteria.md
        let acMd = exportContext?.acceptanceCriteriaMd;
        if (!acMd) {
            acMd = `# Critérios de Aceitação\n\n`;
            backlog.filter(i => i.acceptanceCriteria).forEach(item => {
                acMd += `## ${item.title} (${item.type})\n${item.acceptanceCriteria}\n\n`;
            });
        }
        writeMd('acceptance-criteria.md', acMd);
        // board.md
        let boardMd = `# Board\n\n`;
        const statuses = ['TODO', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED'];
        statuses.forEach(status => {
            boardMd += `## ${status}\n`;
            const items = backlog.filter(i => i.status === status);
            if (items.length === 0)
                boardMd += `Nenhum item.\n`;
            items.forEach(item => {
                boardMd += `- [${item.type}] ${item.title}\n`;
            });
            boardMd += `\n`;
        });
        writeMd('board.md', boardMd);
        // ai-prompts.md
        writeMd('ai-prompts.md', exportContext?.aiPromptsMd || '# Instruções para IA\n\n- Analise o contexto local em .brabrix/context antes de atuar.\n- Respeite os critérios de aceite.');
        // 4. Sync Skills & Rules files
        let skillsSyncResult;
        try {
            const skillsSyncService = new projectSkillsSyncService_1.ProjectSkillsSyncService(client, workspaceConfig);
            skillsSyncResult = await skillsSyncService.syncCurrentProject();
            generatedFiles.push(...skillsSyncResult.generatedFiles);
        }
        catch (e) {
            console.warn("Skills & Rules not available during sync", e);
        }
        // Update sync state
        const now = new Date().toISOString();
        const uniqueGeneratedFiles = Array.from(new Set(generatedFiles));
        const syncStateUpdate = {
            lastSyncAt: now,
            generatedFiles: uniqueGeneratedFiles
        };
        if (skillsSyncResult) {
            syncStateUpdate.lastSkillsSyncAt = skillsSyncResult.syncedAt;
            syncStateUpdate.skillsCount = skillsSyncResult.skillsCount;
            syncStateUpdate.rulesCount = skillsSyncResult.rulesCount;
        }
        syncStateService.updateState(syncStateUpdate);
        // Update config lastSyncAt
        await workspaceConfig.writeConfig({
            ...config,
            lastSyncAt: now
        });
        if (showMessages) {
            vscode.window.showInformationMessage("Contexto Brabrix sincronizado com sucesso.");
        }
        refreshAll();
    }
    catch (e) {
        if (showMessages) {
            vscode.window.showWarningMessage(`Sincronização parcial ou falha: ${e.message}. Tentando usar cache local se existir.`);
        }
    }
}
//# sourceMappingURL=syncWorkspaceCommand.js.map