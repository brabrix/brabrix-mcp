"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSkillsSyncService = void 0;
const fs = require("fs");
const path = require("path");
const markdown_1 = require("../utils/markdown");
const BRABRIX_ROOT = '.brabrix';
const SKILLS_DIR = path.join(BRABRIX_ROOT, 'skills');
const CONTEXT_DIR = path.join(BRABRIX_ROOT, 'context');
const CACHE_DIR = path.join(BRABRIX_ROOT, 'cache');
const SKILLS_CACHE_FILE = path.join(CACHE_DIR, 'project-skills.json');
const MAX_CONTENT_PREVIEW = 400;
class ProjectSkillsSyncService {
    client;
    workspaceConfig;
    constructor(client, workspaceConfig) {
        this.client = client;
        this.workspaceConfig = workspaceConfig;
    }
    async syncCurrentProject() {
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
        const generatedFiles = [];
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
        generatedFiles.push(this.toPosixPath(path.join(SKILLS_DIR, 'project-skills.md')), this.toPosixPath(path.join(SKILLS_DIR, 'project-rules.md')), this.toPosixPath(path.join(SKILLS_DIR, 'index.md')), this.toPosixPath(path.join(CONTEXT_DIR, 'skills.md')), this.toPosixPath(path.join(CONTEXT_DIR, 'rules.md')));
        const cachePayload = {
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
    readCachedSkills() {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) {
            return undefined;
        }
        const cachePath = path.join(root.fsPath, SKILLS_CACHE_FILE);
        if (!fs.existsSync(cachePath)) {
            return undefined;
        }
        try {
            return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
        catch {
            return undefined;
        }
    }
    async loadSkillsPayload(projectId) {
        try {
            return await this.client.exportProjectSkills(projectId);
        }
        catch {
            const listedItems = await this.client.listProjectSkills(projectId);
            return {
                projectId,
                skills: listedItems.filter(item => item.type === 'SKILL'),
                rules: listedItems.filter(item => item.type === 'RULE')
            };
        }
    }
    normalizeAndFilterActive(payload) {
        const allItems = [...(payload.skills || []), ...(payload.rules || [])];
        return allItems
            .filter(item => item && item.id && item.title)
            .map(item => ({
            ...item,
            type: (item.type === 'RULE' ? 'RULE' : 'SKILL'),
            status: item.status || 'ACTIVE',
            content: (item.content || '').trim() || this.buildFallbackContent(item)
        }))
            .filter(item => item.status === 'ACTIVE');
    }
    buildFallbackContent(item) {
        const title = item.title || 'Skill sem título';
        const description = item.description?.trim() || 'Conteúdo completo não disponível na API no momento.';
        return [
            `# ${title}`,
            '',
            description
        ].join('\n');
    }
    sortItems(items) {
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
    ensureFolders(basePath) {
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
    clearGeneratedFiles(dirPath) {
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
    buildSkillFilename(item) {
        const slug = (0, markdown_1.safeFileName)(item.title || item.id);
        const shortId = (0, markdown_1.safeFileName)(item.id).slice(0, 8) || 'item';
        return `${slug}-${shortId}.md`;
    }
    getOriginFolder(item) {
        if (item.origin === 'PUBLIC' || item.scope === 'PLATFORM') {
            return 'public';
        }
        return 'private';
    }
    getOriginLabel(item) {
        return this.getOriginFolder(item) === 'public' ? 'Hub Público' : 'Minha Biblioteca';
    }
    buildIndividualSkillMarkdown(item) {
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
    buildProjectSkillsMarkdown(projectName, syncLabel, skills) {
        const lines = [
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
    buildProjectRulesMarkdown(projectName, syncLabel, rules) {
        const lines = [
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
    buildIndexMarkdown(projectName, syncLabel, items) {
        const lines = [
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
            lines.push(`| ${item.type} | ${this.escapeTable(item.title)} | ${this.getOriginLabel(item)} | ${item.category || 'N/A'} | ${item.required ? 'Sim' : 'Não'} | ${item.priority ?? '-'} |`);
        }
        return lines.join('\n');
    }
    buildSkillPreview(item) {
        const clean = item.content.replace(/\s+/g, ' ').trim();
        if (clean.length <= MAX_CONTENT_PREVIEW) {
            return clean;
        }
        return `${clean.slice(0, MAX_CONTENT_PREVIEW)}...`;
    }
    writeInsideWorkspace(basePath, relativePath, content) {
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
    toPosixPath(value) {
        return value.split(path.sep).join('/');
    }
    escapeTable(value) {
        return value.replace(/\|/g, '\\|');
    }
}
exports.ProjectSkillsSyncService = ProjectSkillsSyncService;
//# sourceMappingURL=projectSkillsSyncService.js.map