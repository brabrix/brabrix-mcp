"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarkdownDocsCommand = generateMarkdownDocsCommand;
const vscode = require("vscode");
const path = require("path");
const projectSkillsSyncService_1 = require("../services/projectSkillsSyncService");
const markdown_1 = require("../utils/markdown");
async function generateMarkdownDocsCommand(client, workspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para gerar documentos.");
        return;
    }
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Nenhum projeto selecionado. Selecione um projeto primeiro.");
        return;
    }
    const docsFolderConfig = vscode.workspace.getConfiguration().get('brabrix.docsFolder', '.brabrix');
    const docsFolder = path.join(root.fsPath, docsFolderConfig);
    const syncSkillsAndRules = async () => {
        try {
            const result = await new projectSkillsSyncService_1.ProjectSkillsSyncService(client, workspaceConfig).syncCurrentProject();
            return `Skills & Rules geradas: ${result.skillsCount} skills e ${result.rulesCount} rules (.brabrix/skills).`;
        }
        catch (error) {
            vscode.window.showWarningMessage(`Não foi possível gerar Skills & Rules automaticamente: ${error.message}`);
            return undefined;
        }
    };
    try {
        const exportData = await client.exportProjectContext(config.projectId);
        const filesToGenerate = [
            { name: 'project-context.md', content: exportData.projectContextMd },
            { name: 'prd.md', content: exportData.prdMd },
            { name: 'technical-spec.md', content: exportData.technicalSpecMd },
            { name: 'backlog.md', content: exportData.backlogMd },
            { name: 'user-stories.md', content: exportData.userStoriesMd },
            { name: 'acceptance-criteria.md', content: exportData.acceptanceCriteriaMd },
            { name: 'ai-prompts.md', content: exportData.aiPromptsMd }
        ];
        let generatedCount = 0;
        for (const file of filesToGenerate) {
            if (file.content) {
                const uri = vscode.Uri.file(path.join(docsFolder, file.name));
                (0, markdown_1.writeMarkdownFile)(uri, file.content);
                generatedCount++;
            }
        }
        const skillsMessage = await syncSkillsAndRules();
        const summary = `${generatedCount} arquivos Markdown gerados em ${docsFolderConfig}/.`;
        vscode.window.showInformationMessage(skillsMessage ? `${summary} ${skillsMessage}` : summary);
    }
    catch (e) {
        vscode.window.showWarningMessage(`Erro ao exportar contexto, tentando gerar fallback localmente: ${e.message}`);
        try {
            const project = await client.getProject(config.projectId);
            const backlog = await client.listBacklog(config.projectId);
            const fallbackExport = (0, markdown_1.buildFallbackExport)(project, backlog);
            const filesToGenerate = [
                { name: 'project-context.md', content: fallbackExport.projectContextMd },
                { name: 'backlog.md', content: fallbackExport.backlogMd },
                { name: 'user-stories.md', content: fallbackExport.userStoriesMd }
            ];
            for (const file of filesToGenerate) {
                if (file.content) {
                    const uri = vscode.Uri.file(path.join(docsFolder, file.name));
                    (0, markdown_1.writeMarkdownFile)(uri, file.content);
                }
            }
            const skillsMessage = await syncSkillsAndRules();
            const summary = `Arquivos Markdown gerados (fallback) em ${docsFolderConfig}/.`;
            vscode.window.showInformationMessage(skillsMessage ? `${summary} ${skillsMessage}` : summary);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Falha na exportação fallback: ${err.message}`);
        }
    }
}
//# sourceMappingURL=generateMarkdownDocsCommand.js.map