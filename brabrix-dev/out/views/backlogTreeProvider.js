"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogTreeProvider = void 0;
const vscode = require("vscode");
class BacklogTreeProvider {
    client;
    workspaceConfig;
    syncStateService;
    hasToken;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    backlogItems = [];
    constructor(client, workspaceConfig, syncStateService, hasToken) {
        this.client = client;
        this.workspaceConfig = workspaceConfig;
        this.syncStateService = syncStateService;
        this.hasToken = hasToken;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
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
            }
            catch (e) {
                return [new vscode.TreeItem("Erro ao carregar backlog", vscode.TreeItemCollapsibleState.None)];
            }
        }
        else {
            // Find children
            const parentId = element.item.id;
            const children = this.backlogItems.filter(i => i.parentId === parentId);
            return children.map(item => this.createTreeItem(item, selectedId));
        }
    }
    createTreeItem(item, selectedId) {
        const hasChildren = this.backlogItems.some(i => i.parentId === item.id);
        const collapsibleState = hasChildren ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
        return new BacklogItemTreeItem(item, collapsibleState, item.id === selectedId);
    }
}
exports.BacklogTreeProvider = BacklogTreeProvider;
class BacklogItemTreeItem extends vscode.TreeItem {
    item;
    collapsibleState;
    isSelected;
    constructor(item, collapsibleState, isSelected) {
        super(isSelected ? `▶ ${item.title}` : item.title, collapsibleState);
        this.item = item;
        this.collapsibleState = collapsibleState;
        this.isSelected = isSelected;
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
//# sourceMappingURL=backlogTreeProvider.js.map