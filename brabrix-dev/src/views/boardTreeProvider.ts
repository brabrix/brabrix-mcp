import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { SyncStateService } from '../services/syncStateService';

export class BoardTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private backlogItems: BrabrixBacklogItem[] = [];
    private currentUser: any = null;

    constructor(
        private client: BrabrixClient,
        private workspaceConfig: WorkspaceConfig,
        private syncStateService: SyncStateService,
        private hasToken: () => Promise<boolean>
    ) {}

    refresh(): void {
        this.currentUser = null; // Limpa cache do usuário para forçar busca nova se necessário
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        const config = await this.workspaceConfig.readConfig();
        if (!config) return [];

        const state = this.syncStateService.readState();
        const selectedId = state?.selectedTaskId;

        if (!element) {
            try {
                // Se for projeto na nuvem, buscar o usuário atual para filtrar
                let assignedUserId: string | undefined;
                if (!config.isLocal) {
                    if (!this.currentUser) {
                        this.currentUser = await this.client.getMe();
                    }
                    assignedUserId = this.currentUser?.id;
                }

                this.backlogItems = await this.client.listBacklog(config.projectId, { assignedUserId });
                
                // Group by status
                const statuses = ['TODO', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED'];
                return statuses.map(status => {
                    const count = this.backlogItems.filter(i => i.status === status).length;
                    return new BoardStatusTreeItem(status, count);
                });
            } catch (e) {
                return [new vscode.TreeItem("Erro ao carregar board", vscode.TreeItemCollapsibleState.None)];
            }
        } else if (element instanceof BoardStatusTreeItem) {
            const status = element.status;
            const items = this.backlogItems.filter(i => i.status === status);
            return items.map(item => new BoardItemTreeItem(item, item.id === selectedId));
        }

        return [];
    }
}

const statusLabels: Record<string, string> = {
    'TODO': 'A Fazer',
    'READY': 'Pronto',
    'IN_PROGRESS': 'Em Andamento',
    'IN_REVIEW': 'Em Revisão',
    'DONE': 'Concluído',
    'CANCELED': 'Cancelado'
};

class BoardStatusTreeItem extends vscode.TreeItem {
    constructor(public readonly status: string, count: number) {
        super(`${statusLabels[status] || status} (${count})`, vscode.TreeItemCollapsibleState.Expanded);
        this.contextValue = 'brabrixBoardStatus';
        this.iconPath = this.getIconForStatus(status);
    }

    private getIconForStatus(status: string): vscode.ThemeIcon {
        switch (status) {
            case 'TODO': return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('descriptionForeground'));
            case 'READY': return new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.blue'));
            case 'IN_PROGRESS': return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.yellow'));
            case 'IN_REVIEW': return new vscode.ThemeIcon('eye', new vscode.ThemeColor('charts.orange'));
            case 'DONE': return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
            case 'CANCELED': return new vscode.ThemeIcon('error', new vscode.ThemeColor('problemsErrorIcon.foreground'));
            default: return new vscode.ThemeIcon('circle-outline');
        }
    }
}

export class BoardItemTreeItem extends vscode.TreeItem {
    constructor(public readonly item: BrabrixBacklogItem, public readonly isSelected: boolean) {
        super(isSelected ? `▶ ${item.title}` : item.title, vscode.TreeItemCollapsibleState.None);
        this.description = isSelected ? `[TAREFA ATUAL] ${item.type}` : item.type;
        
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${item.title}**\n\n`);
        tooltip.appendMarkdown(`- **Tipo:** ${item.type}\n`);
        tooltip.appendMarkdown(`- **Status:** ${item.status}\n`);
        if (item.priority) tooltip.appendMarkdown(`- **Prioridade:** ${item.priority}\n`);
        if (item.estimatedHours) tooltip.appendMarkdown(`- **Estimativa:** ${item.estimatedHours}h\n`);
        if (item.description) tooltip.appendMarkdown(`\n---\n*${item.description}*`);
        this.tooltip = tooltip;

        this.iconPath = this.getIconForType(item.type);
        
        let ctx = 'brabrixBoardItem';
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