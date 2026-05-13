import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { SyncStateService } from '../services/syncStateService';

export class ProjectsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(
        private client: BrabrixClient,
        private workspaceConfig: WorkspaceConfig,
        private syncStateService: SyncStateService,
        private hasToken: () => Promise<boolean>
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        // Se for um elemento interno, resolve os filhos dele
        if (element) {
            return this.resolveElementChildren(element);
        }

        // Se for a raiz (element === undefined), monta as seções principais
        const items: vscode.TreeItem[] = [];
        const config = await this.workspaceConfig.readConfig();
        const loggedIn = await this.hasToken();

        // 1. Seção do Projeto Atual (se houver)
        if (config) {
            try {
                const project = await this.client.getProject(config.projectId);
                const projectItem = new vscode.TreeItem(project.name, vscode.TreeItemCollapsibleState.Expanded);
                projectItem.contextValue = 'brabrixProject';
                projectItem.iconPath = new vscode.ThemeIcon('project');
                items.push(projectItem);
            } catch (e) {
                const errorItem = new vscode.TreeItem("Erro ao carregar projeto", vscode.TreeItemCollapsibleState.None);
                errorItem.description = "Tente atualizar ou verificar conexão";
                items.push(errorItem);
            }
        } else {
            const noProjectItem = new vscode.TreeItem("Nenhum projeto vinculado", vscode.TreeItemCollapsibleState.None);
            noProjectItem.description = "Selecione ou crie um projeto abaixo";
            items.push(noProjectItem);
        }

        // 2. Seção de Ações Globais
        const globalActionsItem = new vscode.TreeItem("Ações Globais", vscode.TreeItemCollapsibleState.Collapsed);
        globalActionsItem.iconPath = new vscode.ThemeIcon('tools');
        globalActionsItem.contextValue = 'brabrixGlobalActions';
        items.push(globalActionsItem);

        // 3. Seção de Configurações e Conta
        const accountItem = new vscode.TreeItem("Configurações & Conta", vscode.TreeItemCollapsibleState.Collapsed);
        accountItem.iconPath = new vscode.ThemeIcon('settings-gear');
        accountItem.contextValue = 'brabrixAccount';
        items.push(accountItem);

        return items;
    }

    private async resolveElementChildren(element: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        const config = await this.workspaceConfig.readConfig();
        const loggedIn = await this.hasToken();

        // Filhos do Projeto
        if (element.contextValue === 'brabrixProject' && config) {
            const items: vscode.TreeItem[] = [];
            try {
                const project = await this.client.getProject(config.projectId);
                
                const statusItem = new vscode.TreeItem(`Status: ${project.status || 'N/A'}`, vscode.TreeItemCollapsibleState.None);
                statusItem.iconPath = new vscode.ThemeIcon('info');
                items.push(statusItem);

                const customerItem = new vscode.TreeItem(`Cliente: ${project.customerName || 'N/A'}`, vscode.TreeItemCollapsibleState.None);
                customerItem.iconPath = new vscode.ThemeIcon('person');
                items.push(customerItem);

                // Workflow Documents
                if (!config.isLocal) {
                    try {
                        const workflow = await this.client.getWorkflowState(config.projectId);
                        const docsItem = new vscode.TreeItem("Documentos do Workflow", vscode.TreeItemCollapsibleState.Collapsed);
                        docsItem.iconPath = new vscode.ThemeIcon('library');
                        docsItem.contextValue = 'brabrixWorkflowDocs';
                        items.push(docsItem);
                    } catch (e) {}
                }

                const state = this.syncStateService.readState();
                const syncItem = new vscode.TreeItem(
                    `Sincronização: ${state?.lastSyncAt ? new Date(state.lastSyncAt).toLocaleString() : 'Nunca'}`, 
                    vscode.TreeItemCollapsibleState.None
                );
                syncItem.iconPath = new vscode.ThemeIcon('sync');
                syncItem.command = { command: 'brabrix.syncWorkspace', title: 'Sincronizar Agora' };
                items.push(syncItem);

            } catch (e) {}
            return items;
        }

        // Filhos de Ações Globais
        if (element.contextValue === 'brabrixGlobalActions') {
            const items: vscode.TreeItem[] = [];
            
            const linkItem = new vscode.TreeItem("Vincular Workspace (Cloud)", vscode.TreeItemCollapsibleState.None);
            linkItem.iconPath = new vscode.ThemeIcon('cloud-download');
            linkItem.command = { command: 'brabrix.linkWorkspace', title: 'Vincular Workspace' };
            items.push(linkItem);

            const localItem = new vscode.TreeItem("Criar Projeto Local (Offline)", vscode.TreeItemCollapsibleState.None);
            localItem.iconPath = new vscode.ThemeIcon('new-folder');
            localItem.command = { command: 'brabrix.createLocalProject', title: 'Criar Projeto Local' };
            items.push(localItem);

            const refreshItem = new vscode.TreeItem("Atualizar Views", vscode.TreeItemCollapsibleState.None);
            refreshItem.iconPath = new vscode.ThemeIcon('refresh');
            refreshItem.command = { command: 'brabrix.refresh', title: 'Atualizar' };
            items.push(refreshItem);

            const markdownItem = new vscode.TreeItem("Gerar arquivos .md do projeto", vscode.TreeItemCollapsibleState.None);
            markdownItem.iconPath = new vscode.ThemeIcon('markdown');
            markdownItem.command = { command: 'brabrix.generateMarkdownDocs', title: 'Gerar arquivos .md' };
            items.push(markdownItem);

            const syncSkillsItem = new vscode.TreeItem("Exportar Skills & Rules para o projeto", vscode.TreeItemCollapsibleState.None);
            syncSkillsItem.iconPath = new vscode.ThemeIcon('library');
            syncSkillsItem.command = { command: 'brabrix.skills.syncProjectSkills', title: 'Sincronizar Skills & Rules' };
            items.push(syncSkillsItem);

            const quickStartAgentsItem = new vscode.TreeItem("Gerar quick start para agentes de IA", vscode.TreeItemCollapsibleState.None);
            quickStartAgentsItem.iconPath = new vscode.ThemeIcon('rocket');
            quickStartAgentsItem.command = { command: 'brabrix.agentTemplates.generate', title: 'Gerar quick start de agentes' };
            items.push(quickStartAgentsItem);

            const exportWorkflowItem = new vscode.TreeItem("Exportar markdown do workflow de IA", vscode.TreeItemCollapsibleState.None);
            exportWorkflowItem.iconPath = new vscode.ThemeIcon('cloud-download');
            exportWorkflowItem.command = { command: 'brabrix.exportWorkflowDocs', title: 'Exportar workflow de IA' };
            items.push(exportWorkflowItem);

            return items;
        }

        // Filhos de Configurações & Conta
        if (element.contextValue === 'brabrixAccount') {
            const items: vscode.TreeItem[] = [];

            if (!loggedIn) {
                const loginItem = new vscode.TreeItem("Login na Brabrix", vscode.TreeItemCollapsibleState.None);
                loginItem.iconPath = new vscode.ThemeIcon('sign-in');
                loginItem.command = { command: 'brabrix.login', title: 'Login' };
                items.push(loginItem);
            } else {
                const logoutItem = new vscode.TreeItem("Logout", vscode.TreeItemCollapsibleState.None);
                logoutItem.iconPath = new vscode.ThemeIcon('sign-out');
                logoutItem.command = { command: 'brabrix.logout', title: 'Logout' };
                items.push(logoutItem);
            }

            const mcpItem = new vscode.TreeItem("Configurar MCP", vscode.TreeItemCollapsibleState.None);
            mcpItem.iconPath = new vscode.ThemeIcon('terminal');
            mcpItem.command = { command: 'brabrix.mcp.showSetup', title: 'Setup MCP' };
            items.push(mcpItem);

            const settingsItem = new vscode.TreeItem("Configurações da Extensão", vscode.TreeItemCollapsibleState.None);
            settingsItem.iconPath = new vscode.ThemeIcon('settings');
            settingsItem.command = { command: 'brabrix.configureCliCommands', title: 'Configurar' };
            items.push(settingsItem);

            const docsItem = new vscode.TreeItem("Documentação MCP", vscode.TreeItemCollapsibleState.None);
            docsItem.iconPath = new vscode.ThemeIcon('book');
            docsItem.command = { command: 'brabrix.mcp.openDocs', title: 'Docs' };
            items.push(docsItem);

            return items;
        }

        // Filhos de Workflow Docs
        if (element.contextValue === 'brabrixWorkflowDocs' && config) {
            try {
                const workflow = await this.client.getWorkflowState(config.projectId);
                return workflow.steps
                    .filter((s: any) => s.currentArtifactId)
                    .map((step: any) => {
                        const item = new vscode.TreeItem(step.label, vscode.TreeItemCollapsibleState.None);
                        item.description = step.status === 'APPROVED' ? '✓ Aprovado' : 'Gerado';
                        item.iconPath = new vscode.ThemeIcon('file-text');
                        item.contextValue = 'brabrixWorkflowArtifact';
                        item.command = {
                            command: 'brabrix.showWorkflowArtifact',
                            title: 'Ver Documento',
                            arguments: [{ 
                                projectId: config.projectId, 
                                artifactId: step.currentArtifactId,
                                label: step.label 
                            }]
                        };
                        return item;
                    });
            } catch (e) {}
        }

        return [];
    }
}
