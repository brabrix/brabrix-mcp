import * as vscode from 'vscode';
import { TokenStore } from './auth/tokenStore';
import { BrabrixClient } from './api/brabrixClient';
import { WorkspaceConfig } from './config/workspaceConfig';
import { ProjectsTreeProvider } from './views/projectsTreeProvider';
import { BacklogTreeProvider } from './views/backlogTreeProvider';
import { BoardTreeProvider, BoardItemTreeItem } from './views/boardTreeProvider';
import { SkillsTreeProvider } from './views/skillsTreeProvider';
import { loginCommand, logoutCommand } from './commands/loginCommand';
import { selectProjectCommand } from './commands/selectProjectCommand';
import { refreshCommand } from './commands/refreshCommand';
import { generateMarkdownDocsCommand } from './commands/generateMarkdownDocsCommand';
import { openProjectInBrowserCommand } from './commands/openProjectInBrowserCommand';
import { generateTaskPromptCommand, copyTaskPromptCommand, openTaskPromptCommand } from './commands/generateTaskPromptCommand';
import { runPromptInCliCommand } from './commands/runPromptInCliCommand';
import { generateSkillsPromptCommand } from './commands/generateSkillsPromptCommand';
import { runSkillsInCliCommand } from './commands/runSkillsInCliCommand';
import { breakdownStoryCommand } from './commands/breakdownStoryCommand';
import { copySpecCommand } from './commands/copySpecCommand';
import { codeReviewTaskCommand } from './commands/codeReviewTaskCommand';
import { generatePrdCommand } from './commands/generatePrdCommand';
import { reportBugCommand } from './commands/reportBugCommand';
import { finishTaskAndCommitCommand } from './commands/finishTaskAndCommitCommand';
import { createLocalProjectCommand } from './commands/createLocalProjectCommand';
import { editLocalProjectCommand } from './commands/editLocalProjectCommand';
import { createBacklogItemCommand } from './commands/createBacklogItemCommand';
import { deleteBacklogItemCommand } from './commands/deleteBacklogItemCommand';
import { editBacklogItemCommand } from './commands/editBacklogItemCommand';
import { showItemDetailsCommand } from './commands/showItemDetailsCommand';
import { showWorkflowArtifactCommand } from './commands/showWorkflowArtifactCommand';
import { exportWorkflowDocsCommand } from './commands/exportWorkflowDocsCommand';
import { linkWorkspaceCommand } from './commands/linkWorkspaceCommand';
import { unlinkWorkspaceCommand } from './commands/unlinkWorkspaceCommand';
import { syncWorkspaceCommand } from './commands/syncWorkspaceCommand';
import { syncProjectSkillsCommand } from './commands/syncProjectSkillsCommand';
import { openContextFolderCommand } from './commands/openContextFolderCommand';
import { listProjectSkillsCommand, openProjectRulesCommand, openProjectSkillsCommand, openSkillInEditorCommand } from './commands/projectSkillsCommands';
import { selectCurrentTaskCommand } from './commands/selectCurrentTaskCommand';
import { showSyncStatusCommand } from './commands/showSyncStatusCommand';
import { 
    showMcpSetupCommand, 
    copyGeminiConfigCommand, 
    copyClaudeCommandCommand, 
    openMcpDocsCommand,
    generateMcpConfigCommand
} from './commands/mcpSetupCommand';
import {
    generateAgentTemplatesCommand,
    generateClaudeTemplateCommand,
    generateCodexTemplateCommand,
    generateVsCodeTemplateCommand,
    generateGeminiTemplateCommand,
    generateGenericTemplateCommand
} from './commands/generateAgentTemplatesCommand';
import { LocalDbService } from './services/localDbService';
import { SyncStateService } from './services/syncStateService';

export const logger = vscode.window.createOutputChannel("Brabrix Dev");

export function activate(context: vscode.ExtensionContext) {
    logger.appendLine("Ativando extensão Brabrix Dev...");
    
    const tokenStore = new TokenStore(context);
    const workspaceConfig = new WorkspaceConfig();
    const localDbService = new LocalDbService(workspaceConfig);
    const syncStateService = new SyncStateService(workspaceConfig);
    
    const apiBaseUrl = vscode.workspace.getConfiguration().get<string>('brabrix.apiBaseUrl', 'https://api.brabrix.com');
    logger.appendLine(`Configuração: API Base URL = ${apiBaseUrl}`);
    
    const client = new BrabrixClient(apiBaseUrl, tokenStore, workspaceConfig, localDbService);

    const hasToken = () => tokenStore.hasToken();

    const projectsProvider = new ProjectsTreeProvider(client, workspaceConfig, syncStateService, hasToken);
    const backlogProvider = new BacklogTreeProvider(client, workspaceConfig, syncStateService, hasToken);
    const boardProvider = new BoardTreeProvider(client, workspaceConfig, syncStateService, hasToken);
    const skillsProvider = new SkillsTreeProvider(client, workspaceConfig);

    vscode.window.registerTreeDataProvider('brabrixProjects', projectsProvider);
    vscode.window.registerTreeDataProvider('brabrixBacklog', backlogProvider);
    vscode.window.registerTreeDataProvider('brabrixBoard', boardProvider);
    vscode.window.registerTreeDataProvider('brabrixSkills', skillsProvider);

    const refreshAll = () => {
        logger.appendLine("Atualizando todas as views...");
        projectsProvider.refresh();
        backlogProvider.refresh();
        boardProvider.refresh();
        skillsProvider.refresh();
    };

    // Registrar o UriHandler para interceptar vscode://brabrix.brabrix-dev/auth?token=...
    context.subscriptions.push(
        vscode.window.registerUriHandler({
            handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
                logger.appendLine(`URI recebida pelo Handler: ${uri.toString()}`);
                
                if (uri.path === '/auth') {
                    const query = new URLSearchParams(uri.query);
                    const token = query.get('token');
                    const refreshToken = query.get('refreshToken');
                    
                    if (token) {
                        logger.appendLine("Token encontrado na URI, salvando...");
                        tokenStore.saveToken(token, refreshToken || undefined).then(() => {
                            vscode.window.showInformationMessage('Login na Brabrix efetuado com sucesso via Web!');
                            refreshAll();
                        });
                    } else {
                        logger.appendLine("ERRO: Token não encontrado na query string da URI.");
                        vscode.window.showErrorMessage('Ocorreu um erro no retorno da Brabrix: Token não encontrado na URL.');
                    }
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('brabrix.login', () => loginCommand(tokenStore, refreshAll)),
        vscode.commands.registerCommand('brabrix.logout', () => logoutCommand(tokenStore, refreshAll)),
        vscode.commands.registerCommand('brabrix.selectProject', () => selectProjectCommand(client, workspaceConfig, refreshAll)),
        vscode.commands.registerCommand('brabrix.refresh', () => refreshCommand(refreshAll)),
        vscode.commands.registerCommand('brabrix.generateMarkdownDocs', () => generateMarkdownDocsCommand(client, workspaceConfig)),
        vscode.commands.registerCommand('brabrix.openProjectInBrowser', () => openProjectInBrowserCommand(workspaceConfig)),
        
        vscode.commands.registerCommand('brabrix.generateTaskPrompt', (node?: any) => generateTaskPromptCommand(client, workspaceConfig, syncStateService, node)),
        vscode.commands.registerCommand('brabrix.copyTaskPrompt', () => copyTaskPromptCommand(workspaceConfig)),
        vscode.commands.registerCommand('brabrix.saveTaskPrompt', (node?: any) => generateTaskPromptCommand(client, workspaceConfig, syncStateService, node)),
        vscode.commands.registerCommand('brabrix.openTaskPrompt', () => openTaskPromptCommand(workspaceConfig)),
        
        vscode.commands.registerCommand('brabrix.runPromptInCli', (node?: any) => runPromptInCliCommand(client, workspaceConfig, syncStateService, undefined, node)),
        vscode.commands.registerCommand('brabrix.runPromptWithGemini', (node?: any) => runPromptInCliCommand(client, workspaceConfig, syncStateService, 'gemini', node)),
        vscode.commands.registerCommand('brabrix.runPromptWithClaude', (node?: any) => runPromptInCliCommand(client, workspaceConfig, syncStateService, 'claude', node)),
        vscode.commands.registerCommand('brabrix.runPromptWithCodex', (node?: any) => runPromptInCliCommand(client, workspaceConfig, syncStateService, 'codex', node)),
        
        vscode.commands.registerCommand('brabrix.generateSkillsPrompt', () => generateSkillsPromptCommand(client, workspaceConfig)),
        vscode.commands.registerCommand('brabrix.runSkillsWithGemini', () => runSkillsInCliCommand(client, workspaceConfig, 'gemini')),
        vscode.commands.registerCommand('brabrix.runSkillsWithClaude', () => runSkillsInCliCommand(client, workspaceConfig, 'claude')),
        vscode.commands.registerCommand('brabrix.runSkillsWithCodex', () => runSkillsInCliCommand(client, workspaceConfig, 'codex')),

        vscode.commands.registerCommand('brabrix.breakdownStory', (node?: any) => breakdownStoryCommand(client, workspaceConfig, node)),
        vscode.commands.registerCommand('brabrix.copySpec', (node?: any) => copySpecCommand(client, workspaceConfig, node)),
        vscode.commands.registerCommand('brabrix.codeReviewTask', (node?: any) => codeReviewTaskCommand(client, workspaceConfig, node)),
        vscode.commands.registerCommand('brabrix.generatePrd', () => generatePrdCommand(client, workspaceConfig)),
        vscode.commands.registerCommand('brabrix.reportBug', () => reportBugCommand(client, workspaceConfig)),
        vscode.commands.registerCommand('brabrix.finishTaskAndCommit', (node?: any) => finishTaskAndCommitCommand(client, workspaceConfig, node)),
        
        vscode.commands.registerCommand('brabrix.createLocalProject', () => createLocalProjectCommand(workspaceConfig, localDbService, refreshAll)),
        vscode.commands.registerCommand('brabrix.editLocalProject', () => editLocalProjectCommand(workspaceConfig, localDbService, refreshAll)),
        vscode.commands.registerCommand('brabrix.createBacklogItem', () => createBacklogItemCommand(client, workspaceConfig, refreshAll)),
        vscode.commands.registerCommand('brabrix.deleteBacklogItem', (node?: any) => deleteBacklogItemCommand(client, workspaceConfig, refreshAll, node)),
        vscode.commands.registerCommand('brabrix.editBacklogItem', (node?: any) => editBacklogItemCommand(client, workspaceConfig, refreshAll, node)),
        vscode.commands.registerCommand('brabrix.showItemDetails', (node?: any) => showItemDetailsCommand(client, workspaceConfig, node)),
        vscode.commands.registerCommand('brabrix.showWorkflowArtifact', (args: any) => showWorkflowArtifactCommand(client, args)),
        vscode.commands.registerCommand('brabrix.exportWorkflowDocs', () => exportWorkflowDocsCommand(client, workspaceConfig)),

        vscode.commands.registerCommand('brabrix.linkWorkspace', () => linkWorkspaceCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.unlinkWorkspace', () => unlinkWorkspaceCommand(workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.syncWorkspace', () => syncWorkspaceCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.skills.syncProjectSkills', () => syncProjectSkillsCommand(client, workspaceConfig, syncStateService, refreshAll, true)),
        vscode.commands.registerCommand('brabrix.skills.openProjectSkills', () => openProjectSkillsCommand(workspaceConfig)),
        vscode.commands.registerCommand('brabrix.skills.openProjectRules', () => openProjectRulesCommand(workspaceConfig)),
        vscode.commands.registerCommand('brabrix.skills.listProjectSkills', () => listProjectSkillsCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.skills.refreshTree', () => skillsProvider.refresh()),
        vscode.commands.registerCommand('brabrix.skills.openSkillInEditor', (node?: any) => openSkillInEditorCommand(node)),
        vscode.commands.registerCommand('brabrix.openContextFolder', () => openContextFolderCommand(workspaceConfig)),
        vscode.commands.registerCommand('brabrix.selectCurrentTask', () => selectCurrentTaskCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.showSyncStatus', () => showSyncStatusCommand(syncStateService)),

        vscode.commands.registerCommand('brabrix.mcp.showSetup', () => showMcpSetupCommand(workspaceConfig, syncStateService)),
        vscode.commands.registerCommand('brabrix.mcp.copyGeminiConfig', () => copyGeminiConfigCommand(workspaceConfig, syncStateService, tokenStore)),
        vscode.commands.registerCommand('brabrix.mcp.copyClaudeCommand', () => copyClaudeCommandCommand(workspaceConfig)),
        vscode.commands.registerCommand('brabrix.mcp.openDocs', () => openMcpDocsCommand()),
        vscode.commands.registerCommand('brabrix.mcp.generateConfig', () => generateMcpConfigCommand(workspaceConfig, syncStateService, tokenStore)),

        vscode.commands.registerCommand('brabrix.agentTemplates.generate', () => generateAgentTemplatesCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.agentTemplates.generateClaude', () => generateClaudeTemplateCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.agentTemplates.generateCodex', () => generateCodexTemplateCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.agentTemplates.generateVsCode', () => generateVsCodeTemplateCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.agentTemplates.generateGemini', () => generateGeminiTemplateCommand(client, workspaceConfig, syncStateService, refreshAll)),
        vscode.commands.registerCommand('brabrix.agentTemplates.generateGeneric', () => generateGenericTemplateCommand(client, workspaceConfig, syncStateService, refreshAll)),

        vscode.commands.registerCommand('brabrix.configureCliCommands', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'brabrix.agent');
        }),

        vscode.commands.registerCommand('brabrix.updateBacklogItemStatus', async (node?: any) => {
            if (!node || !node.item) {
                vscode.window.showInformationMessage("Nenhum item selecionado.");
                return;
            }
            
            const config = await workspaceConfig.readConfig();
            if (!config) return;

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
                } catch (e: any) {
                    vscode.window.showErrorMessage(`Erro ao atualizar status: ${e.message}`);
                }
            }
        })
    );

    // Initial check
    hasToken().then(loggedIn => {
        if (!loggedIn) {
            vscode.window.showInformationMessage("Bem-vindo à Brabrix Dev! Faça login para começar.");
        }
    });
}

export function deactivate() {}
