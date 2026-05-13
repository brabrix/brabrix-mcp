"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsTreeProvider = exports.AppliedSkillTreeItem = void 0;
const path = require("path");
const vscode = require("vscode");
const projectSkillsSyncService_1 = require("../services/projectSkillsSyncService");
const markdown_1 = require("../utils/markdown");
class SkillsSectionTreeItem extends vscode.TreeItem {
    sectionType;
    count;
    constructor(sectionType, count) {
        super(sectionType === 'SKILL' ? `Skills aplicadas (${count})` : `Rules aplicadas (${count})`, vscode.TreeItemCollapsibleState.Expanded);
        this.sectionType = sectionType;
        this.count = count;
        this.contextValue = `brabrixSkillsSection_${sectionType.toLowerCase()}`;
        this.iconPath = sectionType === 'SKILL'
            ? new vscode.ThemeIcon('book')
            : new vscode.ThemeIcon('shield');
    }
}
class AppliedSkillTreeItem extends vscode.TreeItem {
    item;
    contextValue = 'brabrixSkillItem';
    filePath;
    constructor(item, workspacePath, preview) {
        super(item.title, vscode.TreeItemCollapsibleState.None);
        this.item = item;
        this.filePath = buildSkillAbsolutePath(workspacePath, item);
        this.description = buildDescription(item);
        this.iconPath = item.type === 'RULE'
            ? new vscode.ThemeIcon('shield')
            : new vscode.ThemeIcon('tools');
        this.tooltip = buildTooltip(item, preview);
        this.command = {
            command: 'brabrix.skills.openSkillInEditor',
            title: 'Abrir Skill ou Rule',
            arguments: [this]
        };
    }
}
exports.AppliedSkillTreeItem = AppliedSkillTreeItem;
class SkillsTreeProvider {
    client;
    workspaceConfig;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    syncService;
    autoSyncAttemptedProjects = new Set();
    constructor(client, workspaceConfig) {
        this.client = client;
        this.workspaceConfig = workspaceConfig;
        this.syncService = new projectSkillsSyncService_1.ProjectSkillsSyncService(client, workspaceConfig);
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
            return [new vscode.TreeItem('Selecione ou vincule um projeto primeiro.', vscode.TreeItemCollapsibleState.None)];
        }
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) {
            return [new vscode.TreeItem('Abra um workspace para usar Skills & Rules.', vscode.TreeItemCollapsibleState.None)];
        }
        const cache = await this.ensureCurrentProjectCache(config.projectId);
        const items = cache?.items || [];
        if (!element) {
            if (!cache || cache.projectId !== config.projectId) {
                return [new vscode.TreeItem('Sincronize Skills & Rules para visualizar itens.', vscode.TreeItemCollapsibleState.None)];
            }
            const skillsCount = items.filter(item => item.type === 'SKILL').length;
            const rulesCount = items.filter(item => item.type === 'RULE').length;
            return [
                new SkillsSectionTreeItem('SKILL', skillsCount),
                new SkillsSectionTreeItem('RULE', rulesCount)
            ];
        }
        if (element instanceof SkillsSectionTreeItem) {
            const filteredItems = items.filter(item => item.type === element.sectionType);
            if (filteredItems.length === 0) {
                const emptyLabel = element.sectionType === 'SKILL'
                    ? 'Nenhuma Skill aplicada ao projeto.'
                    : 'Nenhuma Rule aplicada ao projeto.';
                return [new vscode.TreeItem(emptyLabel, vscode.TreeItemCollapsibleState.None)];
            }
            return filteredItems.map(item => {
                const preview = this.syncService.buildSkillPreview(item);
                return new AppliedSkillTreeItem(item, root.fsPath, preview);
            });
        }
        return [];
    }
    async ensureCurrentProjectCache(projectId) {
        const cached = this.syncService.readCachedSkills();
        const cacheAlreadyValid = cached && cached.projectId === projectId && cached.items.length > 0;
        if (cacheAlreadyValid) {
            return cached;
        }
        const shouldTryAutoSync = !this.autoSyncAttemptedProjects.has(projectId);
        if (shouldTryAutoSync) {
            this.autoSyncAttemptedProjects.add(projectId);
            try {
                await this.syncService.syncCurrentProject();
            }
            catch {
                // fallback para cache existente ou mensagem de sincronização manual
            }
        }
        return this.syncService.readCachedSkills();
    }
}
exports.SkillsTreeProvider = SkillsTreeProvider;
function buildSkillAbsolutePath(workspacePath, item) {
    const folder = item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'public' : 'private';
    const slug = (0, markdown_1.safeFileName)(item.title || item.id);
    const shortId = (0, markdown_1.safeFileName)(item.id).slice(0, 8) || 'item';
    return path.join(workspacePath, '.brabrix', 'skills', folder, `${slug}-${shortId}.md`);
}
function buildDescription(item) {
    const parts = [];
    parts.push(item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'Público' : 'Privado');
    if (item.category) {
        parts.push(item.category);
    }
    if (item.required) {
        parts.push('Obrigatória');
    }
    if (item.priority !== undefined && item.priority !== null) {
        parts.push(`P${item.priority}`);
    }
    return parts.join(' • ');
}
function buildTooltip(item, preview) {
    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**${item.title}**\n\n`);
    tooltip.appendMarkdown(`- **Tipo:** ${item.type}\n`);
    tooltip.appendMarkdown(`- **Origem:** ${item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'Hub Público' : 'Minha Biblioteca'}\n`);
    tooltip.appendMarkdown(`- **Categoria:** ${item.category || 'N/A'}\n`);
    tooltip.appendMarkdown(`- **Obrigatória:** ${item.required ? 'Sim' : 'Não'}\n`);
    tooltip.appendMarkdown(`- **Prioridade:** ${item.priority ?? '-'}\n`);
    tooltip.appendMarkdown('\n---\n');
    tooltip.appendMarkdown(preview || 'Sem conteúdo');
    return tooltip;
}
//# sourceMappingURL=skillsTreeProvider.js.map