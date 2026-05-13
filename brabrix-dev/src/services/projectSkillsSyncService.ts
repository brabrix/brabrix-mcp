import * as fs from 'fs';
import * as path from 'path';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BrabrixProjectSkill, BrabrixProjectSkillsExport, BrabrixProjectSkillType } from '../models/brabrixProjectSkill';
import { safeFileName } from '../utils/markdown';

export interface CachedProjectSkills {
    projectId: string;
    projectName: string;
    syncedAt: string;
    items: BrabrixProjectSkill[];
}

export interface ProjectSkillsSyncResult {
    projectId: string;
    projectName: string;
    syncedAt: string;
    skillsCount: number;
    rulesCount: number;
    allItems: BrabrixProjectSkill[];
    generatedFiles: string[];
}

const BRABRIX_ROOT = '.brabrix';
const SKILLS_DIR = path.join(BRABRIX_ROOT, 'skills');
const CONTEXT_DIR = path.join(BRABRIX_ROOT, 'context');
const CACHE_DIR = path.join(BRABRIX_ROOT, 'cache');
const SKILLS_CACHE_FILE = path.join(CACHE_DIR, 'project-skills.json');
const MAX_CONTENT_PREVIEW = 400;

export class ProjectSkillsSyncService {
    constructor(
        private client: BrabrixClient,
        private workspaceConfig: WorkspaceConfig
    ) {}

    async syncCurrentProject(): Promise<ProjectSkillsSyncResult> {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) {
            throw new Error('Abra um workspace para sincronizar Skills & Rules.');
        }

        const config = await this.workspaceConfig.readConfig();
        if (!config) {
            throw new Error('Nenhum projeto vinculado ao workspace.');
        }

        const now = new Date();
        const syncedAt = now.toISOString();
        const syncLabel = now.toLocaleString('pt-BR');

        const skillsPayload = await this.loadSkillsPayload(config.projectId);
        const allActiveItems = this.normalizeAndFilterActive(skillsPayload);
        const projectName = skillsPayload.projectName || config.projectName || 'Projeto sem nome';

        const sortedItems = this.sortItems(allActiveItems);
        const skills = sortedItems.filter(item => item.type === 'SKILL');
        const rules = sortedItems.filter(item => item.type === 'RULE');

        const basePath = root.fsPath;
        this.ensureFolders(basePath);
        this.clearGeneratedFiles(path.join(basePath, SKILLS_DIR, 'public'));
        this.clearGeneratedFiles(path.join(basePath, SKILLS_DIR, 'private'));

        const generatedFiles: string[] = [];

        for (const item of sortedItems) {
            const originFolder = this.getOriginFolder(item);
            const filename = this.buildSkillFilename(item);
            const relativePath = path.join(SKILLS_DIR, originFolder, filename);
            const content = this.buildIndividualSkillMarkdown(item);
            this.writeInsideWorkspace(basePath, relativePath, content);
            generatedFiles.push(this.toPosixPath(relativePath));
        }

        const projectSkillsMd = skillsPayload.consolidatedSkillsMarkdown?.trim()
            || this.buildProjectSkillsMarkdown(projectName, syncLabel, skills);
        const projectRulesMd = skillsPayload.consolidatedRulesMarkdown?.trim()
            || this.buildProjectRulesMarkdown(projectName, syncLabel, rules);
        const indexMd = this.buildIndexMarkdown(projectName, syncLabel, sortedItems);

        this.writeInsideWorkspace(basePath, path.join(SKILLS_DIR, 'project-skills.md'), projectSkillsMd);
        this.writeInsideWorkspace(basePath, path.join(SKILLS_DIR, 'project-rules.md'), projectRulesMd);
        this.writeInsideWorkspace(basePath, path.join(SKILLS_DIR, 'index.md'), indexMd);
        this.writeInsideWorkspace(basePath, path.join(CONTEXT_DIR, 'skills.md'), projectSkillsMd);
        this.writeInsideWorkspace(basePath, path.join(CONTEXT_DIR, 'rules.md'), projectRulesMd);

        generatedFiles.push(
            this.toPosixPath(path.join(SKILLS_DIR, 'project-skills.md')),
            this.toPosixPath(path.join(SKILLS_DIR, 'project-rules.md')),
            this.toPosixPath(path.join(SKILLS_DIR, 'index.md')),
            this.toPosixPath(path.join(CONTEXT_DIR, 'skills.md')),
            this.toPosixPath(path.join(CONTEXT_DIR, 'rules.md'))
        );

        const cachePayload: CachedProjectSkills = {
            projectId: config.projectId,
            projectName,
            syncedAt,
            items: sortedItems
        };
        this.writeInsideWorkspace(basePath, SKILLS_CACHE_FILE, JSON.stringify(cachePayload, null, 2));

        return {
            projectId: config.projectId,
            projectName,
            syncedAt,
            skillsCount: skills.length,
            rulesCount: rules.length,
            allItems: sortedItems,
            generatedFiles
        };
    }

    readCachedSkills(): CachedProjectSkills | undefined {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) {
            return undefined;
        }

        const cachePath = path.join(root.fsPath, SKILLS_CACHE_FILE);
        if (!fs.existsSync(cachePath)) {
            return undefined;
        }

        try {
            return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as CachedProjectSkills;
        } catch {
            return undefined;
        }
    }

    private async loadSkillsPayload(projectId: string): Promise<BrabrixProjectSkillsExport> {
        try {
            return await this.client.exportProjectSkills(projectId);
        } catch {
            const listedItems = await this.client.listProjectSkills(projectId);
            return {
                projectId,
                skills: listedItems.filter(item => item.type === 'SKILL'),
                rules: listedItems.filter(item => item.type === 'RULE')
            };
        }
    }

    private normalizeAndFilterActive(payload: BrabrixProjectSkillsExport): BrabrixProjectSkill[] {
        const allItems = [...(payload.skills || []), ...(payload.rules || [])];
        return allItems
            .filter(item => item && item.id && item.title)
            .map(item => ({
                ...item,
                type: (item.type === 'RULE' ? 'RULE' : 'SKILL') as BrabrixProjectSkillType,
                status: item.status || 'ACTIVE',
                content: (item.content || '').trim() || this.buildFallbackContent(item)
            }))
            .filter(item => item.status === 'ACTIVE');
    }

    private buildFallbackContent(item: BrabrixProjectSkill): string {
        const title = item.title || 'Skill sem título';
        const description = item.description?.trim() || 'Conteúdo completo não disponível na API no momento.';
        return [
            `# ${title}`,
            '',
            description
        ].join('\n');
    }

    private sortItems(items: BrabrixProjectSkill[]): BrabrixProjectSkill[] {
        return [...items].sort((a, b) => {
            const aRequired = a.required ? 1 : 0;
            const bRequired = b.required ? 1 : 0;
            if (aRequired !== bRequired) {
                return bRequired - aRequired;
            }

            const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER;
            const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER;
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            return a.title.localeCompare(b.title, 'pt-BR');
        });
    }

    private ensureFolders(basePath: string): void {
        const folders = [
            path.join(basePath, BRABRIX_ROOT),
            path.join(basePath, SKILLS_DIR),
            path.join(basePath, SKILLS_DIR, 'public'),
            path.join(basePath, SKILLS_DIR, 'private'),
            path.join(basePath, CONTEXT_DIR),
            path.join(basePath, CACHE_DIR)
        ];

        for (const folder of folders) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
        }
    }

    private clearGeneratedFiles(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            return;
        }

        const files = fs.readdirSync(dirPath);
        for (const filename of files) {
            if (!filename.toLowerCase().endsWith('.md')) {
                continue;
            }
            const filePath = path.join(dirPath, filename);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        }
    }

    private buildSkillFilename(item: BrabrixProjectSkill): string {
        const slug = safeFileName(item.title || item.id);
        const shortId = safeFileName(item.id).slice(0, 8) || 'item';
        return `${slug}-${shortId}.md`;
    }

    private getOriginFolder(item: BrabrixProjectSkill): 'public' | 'private' {
        if (item.origin === 'PUBLIC' || item.scope === 'PLATFORM') {
            return 'public';
        }
        return 'private';
    }

    private getOriginLabel(item: BrabrixProjectSkill): string {
        return this.getOriginFolder(item) === 'public' ? 'Hub Público' : 'Minha Biblioteca';
    }

    private buildIndividualSkillMarkdown(item: BrabrixProjectSkill): string {
        const required = item.required ? 'Sim' : 'Não';
        const priority = item.priority ?? '-';
        const description = item.description?.trim() || 'Sem descrição.';

        return [
            `# ${item.title}`,
            '',
            `Tipo: ${item.type}`,
            `Origem: ${this.getOriginLabel(item)}`,
            `Categoria: ${item.category || 'N/A'}`,
            `Obrigatória: ${required}`,
            `Prioridade: ${priority}`,
            '',
            '## Descrição',
            '',
            description,
            '',
            '## Conteúdo',
            '',
            item.content.trim()
        ].join('\n');
    }

    private buildProjectSkillsMarkdown(projectName: string, syncLabel: string, skills: BrabrixProjectSkill[]): string {
        const lines: string[] = [
            '# Skills aplicadas ao projeto',
            '',
            `Projeto: ${projectName}`,
            `Última sincronização: ${syncLabel}`,
            ''
        ];

        if (skills.length === 0) {
            lines.push('Nenhuma Skill aplicada ao projeto.');
            return lines.join('\n');
        }

        let index = 1;
        for (const skill of skills) {
            lines.push(`## Skill ${index} — ${skill.title}`);
            lines.push('');
            lines.push(`Origem: ${this.getOriginLabel(skill)}`);
            lines.push(`Categoria: ${skill.category || 'N/A'}`);
            lines.push(`Prioridade: ${skill.priority ?? '-'}`);
            lines.push('');
            lines.push((skill.content || '').trim());
            lines.push('');
            index += 1;
        }

        return lines.join('\n');
    }

    private buildProjectRulesMarkdown(projectName: string, syncLabel: string, rules: BrabrixProjectSkill[]): string {
        const lines: string[] = [
            '# Rules obrigatórias e aplicadas ao projeto',
            '',
            `Projeto: ${projectName}`,
            `Última sincronização: ${syncLabel}`,
            ''
        ];

        if (rules.length === 0) {
            lines.push('Nenhuma Rule aplicada ao projeto.');
            return lines.join('\n');
        }

        let index = 1;
        for (const rule of rules) {
            lines.push(`## Rule ${index} — ${rule.title}`);
            lines.push('');
            lines.push(`Origem: ${this.getOriginLabel(rule)}`);
            lines.push(`Categoria: ${rule.category || 'N/A'}`);
            lines.push(`Obrigatória: ${rule.required ? 'Sim' : 'Não'}`);
            lines.push(`Prioridade: ${rule.priority ?? '-'}`);
            lines.push('');
            lines.push((rule.content || '').trim());
            lines.push('');
            index += 1;
        }

        return lines.join('\n');
    }

    private buildIndexMarkdown(projectName: string, syncLabel: string, items: BrabrixProjectSkill[]): string {
        const lines: string[] = [
            '# Índice de Skills & Rules do Projeto',
            '',
            `Projeto: ${projectName}`,
            `Última sincronização: ${syncLabel}`,
            '',
            '| Tipo | Título | Origem | Categoria | Obrigatória | Prioridade |',
            '|---|---|---|---|---|---|'
        ];

        if (items.length === 0) {
            lines.push('| - | Nenhuma Skill/Rule aplicada | - | - | - | - |');
            return lines.join('\n');
        }

        for (const item of items) {
            lines.push(
                `| ${item.type} | ${this.escapeTable(item.title)} | ${this.getOriginLabel(item)} | ${item.category || 'N/A'} | ${item.required ? 'Sim' : 'Não'} | ${item.priority ?? '-'} |`
            );
        }

        return lines.join('\n');
    }

    buildSkillPreview(item: BrabrixProjectSkill): string {
        const clean = item.content.replace(/\s+/g, ' ').trim();
        if (clean.length <= MAX_CONTENT_PREVIEW) {
            return clean;
        }
        return `${clean.slice(0, MAX_CONTENT_PREVIEW)}...`;
    }

    private writeInsideWorkspace(basePath: string, relativePath: string, content: string): void {
        const absolutePath = path.resolve(basePath, relativePath);
        const workspacePath = path.resolve(basePath) + path.sep;
        if (!absolutePath.startsWith(workspacePath)) {
            throw new Error('Tentativa de escrita fora do workspace bloqueada.');
        }

        if (absolutePath.includes(`${path.sep}.git${path.sep}`) || absolutePath.includes(`${path.sep}node_modules${path.sep}`)) {
            throw new Error('Tentativa de escrita em caminho bloqueado.');
        }

        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(absolutePath, content, 'utf8');
    }

    private toPosixPath(value: string): string {
        return value.split(path.sep).join('/');
    }

    private escapeTable(value: string): string {
        return value.replace(/\|/g, '\\|');
    }
}
