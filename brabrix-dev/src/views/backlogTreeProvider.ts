import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { SyncStateService } from '../services/syncStateService';

export class BacklogTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private backlogItems: BrabrixBacklogItem[] = [];

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
        const config = await this.workspaceConfig.readConfig();
        if (!config) {
            return [new vscode.TreeItem("Selecione ou crie um projeto.", vscode.TreeItemCollapsibleState.None)];
        }

        const state = this.syncStateService.readState();
        const selectedId = state?.selectedTaskId;

        if (!element) {
            try {
                this.backlogItems = await this.client.listBacklog(config.projectId);
                if (this.backlogItems.length === 0) {
                    return [new vscode.TreeItem("Nenhum item de backlog encontrado.", vscode.TreeItemCollapsibleState.None)];
                }

                // Show top-level items (those without parentId)
                const roots = this.backlogItems.filter(i => !i.parentId);
                return roots.map(item => this.createTreeItem(item, selectedId));
            } catch (e) {
                return [new vscode.TreeItem("Erro ao carregar backlog", vscode.TreeItemCollapsibleState.None)];
            }
        } else {
            // Find children
            const parentId = (element as BacklogItemTreeItem).item.id;
            const children = this.backlogItems.filter(i => i.parentId === parentId);
            return children.map(item => this.createTreeItem(item, selectedId));
        }
    }

    private createTreeItem(item: BrabrixBacklogItem, selectedId?: string): BacklogItemTreeItem {
        const hasChildren = this.backlogItems.some(i => i.parentId === item.id);
        const collapsibleState = hasChildren ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
        return new BacklogItemTreeItem(item, collapsibleState, item.id === selectedId);
    }
}

class BacklogItemTreeItem extends vscode.TreeItem {
    constructor(
        public readonly item: BrabrixBacklogItem,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isSelected: boolean
    ) {
        super(isSelected ? `▶ ${item.title}` : item.title, collapsibleState);
        
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${item.title}**\n\n`);
        tooltip.appendMarkdown(`- **Tipo:** ${item.type}\n`);
        tooltip.appendMarkdown(`- **Status:** ${item.status}\n`);
        if (item.priority) tooltip.appendMarkdown(`- **Prioridade:** ${item.priority}\n`);
        if (item.estimatedHours) tooltip.appendMarkdown(`- **Estimativa:** ${item.estimatedHours}h\n`);
        if (item.description) tooltip.appendMarkdown(`\n---\n*${item.description}*`);
        
        this.tooltip = tooltip;
        this.description = isSelected ? `[TAREFA ATUAL] ${item.status}` : item.status;
        this.iconPath = this.getIconForType(item.type);
        
        let ctx = 'brabrixBacklogItem';
        if (['USER_STORY', 'TASK', 'BUG', 'IMPROVEMENT', 'DOCUMENTATION'].includes(item.type)) {
            ctx = 'executableItem';
        }
        if (item.type === 'USER_STORY') {
            ctx += '_storyItem';
        }
        if (item.status === 'IN_REVIEW') {
            ctx += '_reviewItem';
        }
        if (item.status === 'IN_PROGRESS') {
            ctx += '_progressItem';
        }
        this.contextValue = ctx;
    }

    private getIconForType(type: string): vscode.ThemeIcon {
        switch (type) {
            case 'EPIC': return new vscode.ThemeIcon('layers', new vscode.ThemeColor('charts.purple'));
            case 'FEATURE': return new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue'));
            case 'USER_STORY': return new vscode.ThemeIcon('person', new vscode.ThemeColor('charts.green'));
            case 'TASK': return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.yellow'));
            case 'BUG': return new vscode.ThemeIcon('bug', new vscode.ThemeColor('problemsErrorIcon.foreground'));
            case 'IMPROVEMENT': return new vscode.ThemeIcon('wrench', new vscode.ThemeColor('charts.orange'));
            case 'DOCUMENTATION': return new vscode.ThemeIcon('book', new vscode.ThemeColor('descriptionForeground'));
            default: return new vscode.ThemeIcon('circle-outline');
        }
    }
}