import * as path from 'path';
import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BrabrixProjectSkill } from '../models/brabrixProjectSkill';
import { ProjectSkillsSyncService } from '../services/projectSkillsSyncService';
import { safeFileName } from '../utils/markdown';

class SkillsSectionTreeItem extends vscode.TreeItem {
    constructor(
        public readonly sectionType: 'SKILL' | 'RULE',
        public readonly count: number
    ) {
        super(
            sectionType === 'SKILL' ? `Skills aplicadas (${count})` : `Rules aplicadas (${count})`,
            vscode.TreeItemCollapsibleState.Expanded
        );
        this.contextValue = `brabrixSkillsSection_${sectionType.toLowerCase()}`;
        this.iconPath = sectionType === 'SKILL'
            ? new vscode.ThemeIcon('book')
            : new vscode.ThemeIcon('shield');
    }
}

export class AppliedSkillTreeItem extends vscode.TreeItem {
    public readonly contextValue = 'brabrixSkillItem';
    public readonly filePath: string;

    constructor(
        public readonly item: BrabrixProjectSkill,
        workspacePath: string,
        preview: string
    ) {
        super(item.title, vscode.TreeItemCollapsibleState.None);
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

export class SkillsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> =
        new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> =
        this._onDidChangeTreeData.event;

    private syncService: ProjectSkillsSyncService;
    private autoSyncAttemptedProjects = new Set<string>();

    constructor(
        private client: BrabrixClient,
        private workspaceConfig: WorkspaceConfig
    ) {
        this.syncService = new ProjectSkillsSyncService(client, workspaceConfig);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
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

    private async ensureCurrentProjectCache(projectId: string) {
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
            } catch {
                // fallback para cache existente ou mensagem de sincronização manual
            }
        }

        return this.syncService.readCachedSkills();
    }
}

function buildSkillAbsolutePath(workspacePath: string, item: BrabrixProjectSkill): string {
    const folder = item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'public' : 'private';
    const slug = safeFileName(item.title || item.id);
    const shortId = safeFileName(item.id).slice(0, 8) || 'item';
    return path.join(workspacePath, '.brabrix', 'skills', folder, `${slug}-${shortId}.md`);
}

function buildDescription(item: BrabrixProjectSkill): string {
    const parts: string[] = [];
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

function buildTooltip(item: BrabrixProjectSkill, preview: string): vscode.MarkdownString {
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
