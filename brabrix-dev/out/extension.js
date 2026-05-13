"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const tokenStore_1 = require("./auth/tokenStore");
const brabrixClient_1 = require("./api/brabrixClient");
const workspaceConfig_1 = require("./config/workspaceConfig");
const projectsTreeProvider_1 = require("./views/projectsTreeProvider");
const backlogTreeProvider_1 = require("./views/backlogTreeProvider");
const boardTreeProvider_1 = require("./views/boardTreeProvider");
const skillsTreeProvider_1 = require("./views/skillsTreeProvider");
const loginCommand_1 = require("./commands/loginCommand");
const selectProjectCommand_1 = require("./commands/selectProjectCommand");
const refreshCommand_1 = require("./commands/refreshCommand");
const generateMarkdownDocsCommand_1 = require("./commands/generateMarkdownDocsCommand");
const openProjectInBrowserCommand_1 = require("./commands/openProjectInBrowserCommand");
const generateTaskPromptCommand_1 = require("./commands/generateTaskPromptCommand");
const runPromptInCliCommand_1 = require("./commands/runPromptInCliCommand");
const generateSkillsPromptCommand_1 = require("./commands/generateSkillsPromptCommand");
const runSkillsInCliCommand_1 = require("./commands/runSkillsInCliCommand");
const breakdownStoryCommand_1 = require("./commands/breakdownStoryCommand");
const copySpecCommand_1 = require("./commands/copySpecCommand");
const codeReviewTaskCommand_1 = require("./commands/codeReviewTaskCommand");
const generatePrdCommand_1 = require("./commands/generatePrdCommand");
const reportBugCommand_1 = require("./commands/reportBugCommand");
const finishTaskAndCommitCommand_1 = require("./commands/finishTaskAndCommitCommand");
const createLocalProjectCommand_1 = require("./commands/createLocalProjectCommand");
const editLocalProjectCommand_1 = require("./commands/editLocalProjectCommand");
const createBacklogItemCommand_1 = require("./commands/createBacklogItemCommand");
const deleteBacklogItemCommand_1 = require("./commands/deleteBacklogItemCommand");
const editBacklogItemCommand_1 = require("./commands/editBacklogItemCommand");
const showItemDetailsCommand_1 = require("./commands/showItemDetailsCommand");
const showWorkflowArtifactCommand_1 = require("./commands/showWorkflowArtifactCommand");
const exportWorkflowDocsCommand_1 = require("./commands/exportWorkflowDocsCommand");
const linkWorkspaceCommand_1 = require("./commands/linkWorkspaceCommand");
const unlinkWorkspaceCommand_1 = require("./commands/unlinkWorkspaceCommand");
const syncWorkspaceCommand_1 = require("./commands/syncWorkspaceCommand");
const syncProjectSkillsCommand_1 = require("./commands/syncProjectSkillsCommand");
const openContextFolderCommand_1 = require("./commands/openContextFolderCommand");
const projectSkillsCommands_1 = require("./commands/projectSkillsCommands");
const selectCurrentTaskCommand_1 = require("./commands/selectCurrentTaskCommand");
const showSyncStatusCommand_1 = require("./commands/showSyncStatusCommand");
const mcpSetupCommand_1 = require("./commands/mcpSetupCommand");
const generateAgentTemplatesCommand_1 = require("./commands/generateAgentTemplatesCommand");
const localDbService_1 = require("./services/localDbService");
const syncStateService_1 = require("./services/syncStateService");
exports.logger = vscode.window.createOutputChannel("Brabrix Dev");
function activate(context) {
    exports.logger.appendLine("Ativando extensão Brabrix Dev...");
    const tokenStore = new tokenStore_1.TokenStore(context);
    const workspaceConfig = new workspaceConfig_1.WorkspaceConfig();
    const localDbService = new localDbService_1.LocalDbService(workspaceConfig);
    const syncStateService = new syncStateService_1.SyncStateService(workspaceConfig);
    const apiBaseUrl = vscode.workspace.getConfiguration().get('brabrix.apiBaseUrl', 'https://api.brabrix.com');
    exports.logger.appendLine(`Configuração: API Base URL = ${apiBaseUrl}`);
    const client = new brabrixClient_1.BrabrixClient(apiBaseUrl, tokenStore, workspaceConfig, localDbService);
    const hasToken = () => tokenStore.hasToken();
    const projectsProvider = new projectsTreeProvider_1.ProjectsTreeProvider(client, workspaceConfig, syncStateService, hasToken);
    const backlogProvider = new backlogTreeProvider_1.BacklogTreeProvider(client, workspaceConfig, syncStateService, hasToken);
    const boardProvider = new boardTreeProvider_1.BoardTreeProvider(client, workspaceConfig, syncStateService, hasToken);
    const skillsProvider = new skillsTreeProvider_1.SkillsTreeProvider(client, workspaceConfig);
    vscode.window.registerTreeDataProvider('brabrixProjects', projectsProvider);
    vscode.window.registerTreeDataProvider('brabrixBacklog', backlogProvider);
    vscode.window.registerTreeDataProvider('brabrixBoard', boardProvider);
    vscode.window.registerTreeDataProvider('brabrixSkills', skillsProvider);
    const refreshAll = () => {
        exports.logger.appendLine("Atualizando todas as views...");
        projectsProvider.refresh();
        backlogProvider.refresh();
        boardProvider.refresh();
        skillsProvider.refresh();
    };
    // Registrar o UriHandler para interceptar vscode://brabrix.brabrix-dev/auth?token=...
    context.subscriptions.push(vscode.window.registerUriHandler({
        handleUri(uri) {
            exports.logger.appendLine(`URI recebida pelo Handler: ${uri.toString()}`);
            if (uri.path === '/auth') {
                const query = new URLSearchParams(uri.query);
                const token = query.get('token');
                const refreshToken = query.get('refreshToken');
                if (token) {
                    exports.logger.appendLine("Token encontrado na URI, salvando...");
                    tokenStore.saveToken(token, refreshToken || undefined).then(() => {
                        vscode.window.showInformationMessage('Login na Brabrix efetuado com sucesso via Web!');
                        refreshAll();
                    });
                }
                else {
                    exports.logger.appendLine("ERRO: Token não encontrado na query string da URI.");
                    vscode.window.showErrorMessage('Ocorreu um erro no retorno da Brabrix: Token não encontrado na URL.');
                }
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('brabrix.login', () => (0, loginCommand_1.loginCommand)(tokenStore, refreshAll)), vscode.commands.registerCommand('brabrix.logout', () => (0, loginCommand_1.logoutCommand)(tokenStore, refreshAll)), vscode.commands.registerCommand('brabrix.selectProject', () => (0, selectProjectCommand_1.selectProjectCommand)(client, workspaceConfig, refreshAll)), vscode.commands.registerCommand('brabrix.refresh', () => (0, refreshCommand_1.refreshCommand)(refreshAll)), vscode.commands.registerCommand('brabrix.generateMarkdownDocs', () => (0, generateMarkdownDocsCommand_1.generateMarkdownDocsCommand)(client, workspaceConfig)), vscode.commands.registerCommand('brabrix.openProjectInBrowser', () => (0, openProjectInBrowserCommand_1.openProjectInBrowserCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.generateTaskPrompt', (node) => (0, generateTaskPromptCommand_1.generateTaskPromptCommand)(client, workspaceConfig, syncStateService, node)), vscode.commands.registerCommand('brabrix.copyTaskPrompt', () => (0, generateTaskPromptCommand_1.copyTaskPromptCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.saveTaskPrompt', (node) => (0, generateTaskPromptCommand_1.generateTaskPromptCommand)(client, workspaceConfig, syncStateService, node)), vscode.commands.registerCommand('brabrix.openTaskPrompt', () => (0, generateTaskPromptCommand_1.openTaskPromptCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.runPromptInCli', (node) => (0, runPromptInCliCommand_1.runPromptInCliCommand)(client, workspaceConfig, syncStateService, undefined, node)), vscode.commands.registerCommand('brabrix.runPromptWithGemini', (node) => (0, runPromptInCliCommand_1.runPromptInCliCommand)(client, workspaceConfig, syncStateService, 'gemini', node)), vscode.commands.registerCommand('brabrix.runPromptWithClaude', (node) => (0, runPromptInCliCommand_1.runPromptInCliCommand)(client, workspaceConfig, syncStateService, 'claude', node)), vscode.commands.registerCommand('brabrix.runPromptWithCodex', (node) => (0, runPromptInCliCommand_1.runPromptInCliCommand)(client, workspaceConfig, syncStateService, 'codex', node)), vscode.commands.registerCommand('brabrix.generateSkillsPrompt', () => (0, generateSkillsPromptCommand_1.generateSkillsPromptCommand)(client, workspaceConfig)), vscode.commands.registerCommand('brabrix.runSkillsWithGemini', () => (0, runSkillsInCliCommand_1.runSkillsInCliCommand)(client, workspaceConfig, 'gemini')), vscode.commands.registerCommand('brabrix.runSkillsWithClaude', () => (0, runSkillsInCliCommand_1.runSkillsInCliCommand)(client, workspaceConfig, 'claude')), vscode.commands.registerCommand('brabrix.runSkillsWithCodex', () => (0, runSkillsInCliCommand_1.runSkillsInCliCommand)(client, workspaceConfig, 'codex')), vscode.commands.registerCommand('brabrix.breakdownStory', (node) => (0, breakdownStoryCommand_1.breakdownStoryCommand)(client, workspaceConfig, node)), vscode.commands.registerCommand('brabrix.copySpec', (node) => (0, copySpecCommand_1.copySpecCommand)(client, workspaceConfig, node)), vscode.commands.registerCommand('brabrix.codeReviewTask', (node) => (0, codeReviewTaskCommand_1.codeReviewTaskCommand)(client, workspaceConfig, node)), vscode.commands.registerCommand('brabrix.generatePrd', () => (0, generatePrdCommand_1.generatePrdCommand)(client, workspaceConfig)), vscode.commands.registerCommand('brabrix.reportBug', () => (0, reportBugCommand_1.reportBugCommand)(client, workspaceConfig)), vscode.commands.registerCommand('brabrix.finishTaskAndCommit', (node) => (0, finishTaskAndCommitCommand_1.finishTaskAndCommitCommand)(client, workspaceConfig, node)), vscode.commands.registerCommand('brabrix.createLocalProject', () => (0, createLocalProjectCommand_1.createLocalProjectCommand)(workspaceConfig, localDbService, refreshAll)), vscode.commands.registerCommand('brabrix.editLocalProject', () => (0, editLocalProjectCommand_1.editLocalProjectCommand)(workspaceConfig, localDbService, refreshAll)), vscode.commands.registerCommand('brabrix.createBacklogItem', () => (0, createBacklogItemCommand_1.createBacklogItemCommand)(client, workspaceConfig, refreshAll)), vscode.commands.registerCommand('brabrix.deleteBacklogItem', (node) => (0, deleteBacklogItemCommand_1.deleteBacklogItemCommand)(client, workspaceConfig, refreshAll, node)), vscode.commands.registerCommand('brabrix.editBacklogItem', (node) => (0, editBacklogItemCommand_1.editBacklogItemCommand)(client, workspaceConfig, refreshAll, node)), vscode.commands.registerCommand('brabrix.showItemDetails', (node) => (0, showItemDetailsCommand_1.showItemDetailsCommand)(client, workspaceConfig, node)), vscode.commands.registerCommand('brabrix.showWorkflowArtifact', (args) => (0, showWorkflowArtifactCommand_1.showWorkflowArtifactCommand)(client, args)), vscode.commands.registerCommand('brabrix.exportWorkflowDocs', () => (0, exportWorkflowDocsCommand_1.exportWorkflowDocsCommand)(client, workspaceConfig)), vscode.commands.registerCommand('brabrix.linkWorkspace', () => (0, linkWorkspaceCommand_1.linkWorkspaceCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.unlinkWorkspace', () => (0, unlinkWorkspaceCommand_1.unlinkWorkspaceCommand)(workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.syncWorkspace', () => (0, syncWorkspaceCommand_1.syncWorkspaceCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.skills.syncProjectSkills', () => (0, syncProjectSkillsCommand_1.syncProjectSkillsCommand)(client, workspaceConfig, syncStateService, refreshAll, true)), vscode.commands.registerCommand('brabrix.skills.openProjectSkills', () => (0, projectSkillsCommands_1.openProjectSkillsCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.skills.openProjectRules', () => (0, projectSkillsCommands_1.openProjectRulesCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.skills.listProjectSkills', () => (0, projectSkillsCommands_1.listProjectSkillsCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.skills.refreshTree', () => skillsProvider.refresh()), vscode.commands.registerCommand('brabrix.skills.openSkillInEditor', (node) => (0, projectSkillsCommands_1.openSkillInEditorCommand)(node)), vscode.commands.registerCommand('brabrix.openContextFolder', () => (0, openContextFolderCommand_1.openContextFolderCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.selectCurrentTask', () => (0, selectCurrentTaskCommand_1.selectCurrentTaskCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.showSyncStatus', () => (0, showSyncStatusCommand_1.showSyncStatusCommand)(syncStateService)), vscode.commands.registerCommand('brabrix.mcp.showSetup', () => (0, mcpSetupCommand_1.showMcpSetupCommand)(workspaceConfig, syncStateService)), vscode.commands.registerCommand('brabrix.mcp.copyGeminiConfig', () => (0, mcpSetupCommand_1.copyGeminiConfigCommand)(workspaceConfig, syncStateService, tokenStore)), vscode.commands.registerCommand('brabrix.mcp.copyClaudeCommand', () => (0, mcpSetupCommand_1.copyClaudeCommandCommand)(workspaceConfig)), vscode.commands.registerCommand('brabrix.mcp.openDocs', () => (0, mcpSetupCommand_1.openMcpDocsCommand)()), vscode.commands.registerCommand('brabrix.mcp.generateConfig', () => (0, mcpSetupCommand_1.generateMcpConfigCommand)(workspaceConfig, syncStateService, tokenStore)), vscode.commands.registerCommand('brabrix.agentTemplates.generate', () => (0, generateAgentTemplatesCommand_1.generateAgentTemplatesCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.agentTemplates.generateClaude', () => (0, generateAgentTemplatesCommand_1.generateClaudeTemplateCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.agentTemplates.generateCodex', () => (0, generateAgentTemplatesCommand_1.generateCodexTemplateCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.agentTemplates.generateVsCode', () => (0, generateAgentTemplatesCommand_1.generateVsCodeTemplateCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.agentTemplates.generateGemini', () => (0, generateAgentTemplatesCommand_1.generateGeminiTemplateCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.agentTemplates.generateGeneric', () => (0, generateAgentTemplatesCommand_1.generateGenericTemplateCommand)(client, workspaceConfig, syncStateService, refreshAll)), vscode.commands.registerCommand('brabrix.configureCliCommands', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'brabrix.agent');
    }), vscode.commands.registerCommand('brabrix.updateBacklogItemStatus', async (node) => {
        if (!node || !node.item) {
            vscode.window.showInformationMessage("Nenhum item selecionado.");
            return;
        }
        const config = await workspaceConfig.readConfig();
        if (!config)
            return;
        const statuses = [
            { label: 'TODO', description: 'A Fazer' },
            { label: 'READY', description: 'Pronto' },
            { label: 'IN_PROGRESS', description: 'Em Andamento' },
            { label: 'IN_REVIEW', description: 'Em Revisão' },
            { label: 'DONE', description: 'Concluído' },
            { label: 'CANCELED', description: 'Cancelado' }
        ];
        const selection = await vscode.window.showQuickPick(statuses, {
            placeHolder: `Mudar status de: ${node.item.title} (Atual: ${node.item.status})`
        });
        if (selection) {
            try {
                await client.updateBacklogStatus(config.projectId, node.item.id, selection.label);
                vscode.window.showInformationMessage(`Status atualizado para ${selection.description}.`);
                refreshAll();
            }
            catch (e) {
                vscode.window.showErrorMessage(`Erro ao atualizar status: ${e.message}`);
            }
        }
    }));
    // Initial check
    hasToken().then(loggedIn => {
        if (!loggedIn) {
            vscode.window.showInformationMessage("Bem-vindo à Brabrix Dev! Faça login para começar.");
        }
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map