"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardItemTreeItem = exports.BoardTreeProvider = void 0;
const vscode = require("vscode");
class BoardTreeProvider {
    client;
    workspaceConfig;
    syncStateService;
    hasToken;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    backlogItems = [];
    currentUser = null;
    constructor(client, workspaceConfig, syncStateService, hasToken) {
        this.client = client;
        this.workspaceConfig = workspaceConfig;
        this.syncStateService = syncStateService;
        this.hasToken = hasToken;
    }
    refresh() {
        this.currentUser = null; // Limpa cache do usuário para forçar busca nova se necessário
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        const config = await this.workspaceConfig.readConfig();
        if (!config)
            return [];
        const state = this.syncStateService.readState();
        const selectedId = state?.selectedTaskId;
        if (!element) {
            try {
                // Se for projeto na nuvem, buscar o usuário atual para filtrar
                let assignedUserId;
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
            }
            catch (e) {
                return [new vscode.TreeItem("Erro ao carregar board", vscode.TreeItemCollapsibleState.None)];
            }
        }
        else if (element instanceof BoardStatusTreeItem) {
            const status = element.status;
            const items = this.backlogItems.filter(i => i.status === status);
            return items.map(item => new BoardItemTreeItem(item, item.id === selectedId));
        }
        return [];
    }
}
exports.BoardTreeProvider = BoardTreeProvider;
const statusLabels = {
    'TODO': 'A Fazer',
    'READY': 'Pronto',
    'IN_PROGRESS': 'Em Andamento',
    'IN_REVIEW': 'Em Revisão',
    'DONE': 'Concluído',
    'CANCELED': 'Cancelado'
};
class BoardStatusTreeItem extends vscode.TreeItem {
    status;
    constructor(status, count) {
        super(`${statusLabels[status] || status} (${count})`, vscode.TreeItemCollapsibleState.Expanded);
        this.status = status;
        this.contextValue = 'brabrixBoardStatus';
        this.iconPath = this.getIconForStatus(status);
    }
    getIconForStatus(status) {
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
class BoardItemTreeItem extends vscode.TreeItem {
    item;
    isSelected;
    constructor(item, isSelected) {
        super(isSelected ? `▶ ${item.title}` : item.title, vscode.TreeItemCollapsibleState.None);
        this.item = item;
        this.isSelected = isSelected;
        this.description = isSelected ? `[TAREFA ATUAL] ${item.type}` : item.type;
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${item.title}**\n\n`);
        tooltip.appendMarkdown(`- **Tipo:** ${item.type}\n`);
        tooltip.appendMarkdown(`- **Status:** ${item.status}\n`);
        if (item.priority)
            tooltip.appendMarkdown(`- **Prioridade:** ${item.priority}\n`);
        if (item.estimatedHours)
            tooltip.appendMarkdown(`- **Estimativa:** ${item.estimatedHours}h\n`);
        if (item.description)
            tooltip.appendMarkdown(`\n---\n*${item.description}*`);
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
    getIconForType(type) {
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
exports.BoardItemTreeItem = BoardItemTreeItem;
//# sourceMappingURL=boardTreeProvider.js.map