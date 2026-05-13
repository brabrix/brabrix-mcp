"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTemplateGenerator = void 0;
const fs = require("fs");
const path = require("path");
const agentTemplate_1 = require("../models/agentTemplate");
const SOURCE_DESCRIPTORS = [
    {
        key: 'projectContext',
        title: 'Contexto do projeto',
        primaryRelativePath: path.join('.brabrix', 'context', 'project-context.md'),
        missingHint: 'Sincronize o projeto para gerar o contexto base.'
    },
    {
        key: 'currentTask',
        title: 'Tarefa atual',
        primaryRelativePath: path.join('.brabrix', 'context', 'current-task.md'),
        secondaryRelativePath: path.join('.brabrix', 'prompts', 'current-task.md'),
        missingHint: 'Selecione a tarefa atual e gere/sincronize os arquivos de contexto.'
    },
    {
        key: 'taskSpec',
        title: 'Spec da tarefa',
        primaryRelativePath: path.join('.brabrix', 'context', 'task-spec.md'),
        missingHint: 'Sincronize a spec da tarefa para incluir este arquivo.'
    },
    {
        key: 'prd',
        title: 'PRD',
        primaryRelativePath: path.join('.brabrix', 'context', 'prd.md'),
        missingHint: 'Sincronize o projeto para exportar o PRD.'
    },
    {
        key: 'technicalSpec',
        title: 'Spec técnica',
        primaryRelativePath: path.join('.brabrix', 'context', 'technical-spec.md'),
        missingHint: 'Sincronize o projeto para exportar a spec técnica.'
    },
    {
        key: 'technicalArchitecture',
        title: 'Arquitetura técnica',
        primaryRelativePath: path.join('.brabrix', 'context', 'technical-architecture.md'),
        missingHint: 'Sincronize o projeto para exportar a arquitetura técnica.'
    },
    {
        key: 'quickStarter',
        title: 'Quick Starter',
        primaryRelativePath: path.join('.brabrix', 'context', 'quick-starter.md'),
        missingHint: 'Sincronize o projeto para exportar o quick starter.'
    },
    {
        key: 'skills',
        title: 'Skills aplicadas',
        primaryRelativePath: path.join('.brabrix', 'context', 'skills.md'),
        secondaryRelativePath: path.join('.brabrix', 'skills', 'project-skills.md'),
        missingHint: 'Sincronize Skills & Rules do projeto.'
    },
    {
        key: 'rules',
        title: 'Rules obrigatórias',
        primaryRelativePath: path.join('.brabrix', 'context', 'rules.md'),
        secondaryRelativePath: path.join('.brabrix', 'skills', 'project-rules.md'),
        missingHint: 'Sincronize Skills & Rules do projeto.'
    }
];
class AgentTemplateGenerator {
    workspaceConfig;
    constructor(workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
    }
    previewTargetPaths(templateType, options) {
        const sourceMap = this.loadSourceMap(this.getWorkspaceRootPath(), false);
        return this.buildPlannedFiles(templateType, options, sourceMap).map(file => file.relativePath);
    }
    detectMissingSources(options) {
        const rootPath = this.getWorkspaceRootPath();
        const sourceMap = this.loadSourceMap(rootPath, false);
        const missing = [];
        for (const descriptor of SOURCE_DESCRIPTORS) {
            if (!this.isIncluded(descriptor.key, options)) {
                continue;
            }
            const source = sourceMap[descriptor.key];
            if (!source.content || !source.content.trim()) {
                missing.push(`${descriptor.title} (${this.toPosixPath(descriptor.primaryRelativePath)})`);
            }
        }
        return missing;
    }
    generate(options) {
        const rootPath = this.getWorkspaceRootPath();
        const sourceMap = this.loadSourceMap(rootPath, true);
        const plannedFiles = this.buildPlannedFiles(options.templateType, options, sourceMap);
        const result = {
            created: [],
            updated: [],
            skipped: [],
            backedUp: [],
            failed: []
        };
        const backupStamp = this.buildBackupStamp();
        for (const file of plannedFiles) {
            try {
                this.writePlannedFile(rootPath, file, options.overwriteMode, backupStamp, result);
            }
            catch (error) {
                result.failed.push({
                    path: this.toPosixPath(file.relativePath),
                    error: error?.message || 'Erro inesperado ao escrever arquivo.'
                });
            }
        }
        return result;
    }
    buildPlannedFiles(templateType, options, sourceMap) {
        switch (templateType) {
            case agentTemplate_1.AgentTemplateType.CLAUDE_CODE:
                return this.buildClaudeFiles(options, sourceMap);
            case agentTemplate_1.AgentTemplateType.CODEX:
                return this.buildCodexFiles(options, sourceMap);
            case agentTemplate_1.AgentTemplateType.VSCODE_COPILOT:
                return this.buildVsCodeFiles(options, sourceMap);
            case agentTemplate_1.AgentTemplateType.GEMINI_CLI:
                return this.buildGeminiFiles(options, sourceMap);
            case agentTemplate_1.AgentTemplateType.GENERIC:
                return this.buildGenericFiles(options, sourceMap);
            default:
                return [];
        }
    }
    buildClaudeFiles(options, sourceMap) {
        const files = [];
        files.push({
            relativePath: 'CLAUDE.md',
            content: [
                '# Claude Code — Brabrix Dev Context',
                '',
                'Este projeto está sincronizado com a Brabrix Dev.',
                '',
                '## Ordem obrigatória de leitura',
                '',
                'Antes de alterar código, leia:',
                '',
                '1. `.claude/context/current-task.md`',
                '2. `.claude/context/task-spec.md`',
                '3. `.claude/skills/project-rules.md`',
                '4. `.claude/skills/project-skills.md`',
                '5. `.claude/context/technical-architecture.md`',
                '',
                '## Regras obrigatórias',
                '',
                'As regras em `.claude/skills/project-rules.md` são obrigatórias.',
                '',
                '## Skills aplicadas',
                '',
                'As skills em `.claude/skills/project-skills.md` devem ser usadas como contexto técnico e padrões recomendados.',
                '',
                '## Comportamento esperado',
                '',
                '1. Primeiro entenda a tarefa.',
                '2. Depois apresente um plano curto.',
                '3. Só então altere arquivos.',
                '4. Não altere arquivos fora do escopo da tarefa.',
                '5. Não remova regras de negócio sem confirmação.',
                '6. Não crie migrations destrutivas sem aviso.',
                '7. Ao final, explique arquivos alterados e próximos passos.'
            ].join('\n')
        });
        this.pushContextFiles(files, '.claude/context', sourceMap, [
            'projectContext',
            'currentTask',
            'taskSpec',
            'prd',
            'technicalSpec',
            'technicalArchitecture',
            'quickStarter'
        ], options);
        this.pushSkillFiles(files, '.claude/skills', sourceMap, options);
        return files;
    }
    buildCodexFiles(options, sourceMap) {
        const files = [];
        files.push({
            relativePath: 'AGENTS.md',
            content: [
                '# AGENTS.md — Brabrix Dev',
                '',
                'Você está trabalhando em um projeto sincronizado pela Brabrix Dev.',
                '',
                '## Contexto principal',
                '',
                'Leia antes de implementar:',
                '',
                '- `.codex/context/current-task.md`',
                '- `.codex/context/task-spec.md`',
                '- `.codex/context/technical-architecture.md`',
                '- `.codex/skills/project-rules.md`',
                '- `.codex/skills/project-skills.md`',
                '',
                '## Rules obrigatórias',
                '',
                'As rules em `.codex/skills/project-rules.md` têm prioridade sobre sugestões genéricas.',
                '',
                '## Skills aplicadas',
                '',
                'Use as skills em `.codex/skills/project-skills.md` como padrões técnicos do projeto.',
                '',
                '## Execução',
                '',
                '- Primeiro apresente plano curto.',
                '- Implemente apenas o escopo da tarefa atual.',
                '- Preserve padrões do projeto.',
                '- Não altere contratos públicos sem avisar.',
                '- Não invente requisitos fora da spec.'
            ].join('\n')
        });
        this.pushContextFiles(files, '.codex/context', sourceMap, [
            'projectContext',
            'currentTask',
            'taskSpec',
            'prd',
            'technicalSpec',
            'technicalArchitecture',
            'quickStarter'
        ], options);
        this.pushSkillFiles(files, '.codex/skills', sourceMap, options);
        return files;
    }
    buildVsCodeFiles(options, sourceMap) {
        const files = [];
        files.push({
            relativePath: path.join('.github', 'copilot-instructions.md'),
            content: [
                '# GitHub Copilot Instructions — Brabrix Dev',
                '',
                'Este projeto usa contexto da Brabrix Dev.',
                '',
                'Antes de sugerir código, considere:',
                '',
                '- `.vscode/brabrix-context.md`',
                '- `.vscode/brabrix-rules.md`',
                '- `.brabrix/context/skills.md`',
                '- `.brabrix/context/rules.md`',
                '',
                '## Regras',
                '',
                'As rules do projeto são obrigatórias.',
                '',
                '## Padrões',
                '',
                'As skills do projeto definem padrões técnicos recomendados.',
                '',
                '## Comportamento',
                '',
                '- Priorize código simples e sustentável.',
                '- Respeite a arquitetura técnica.',
                '- Não ignore regras de multi-tenancy, segurança e testes.',
                '- Não altere APIs públicas sem indicação explícita.'
            ].join('\n')
        });
        const contextBlocks = [];
        const orderedContextKeys = [
            'projectContext',
            'currentTask',
            'taskSpec',
            'prd',
            'technicalSpec',
            'technicalArchitecture',
            'quickStarter',
            'skills'
        ];
        for (const key of orderedContextKeys) {
            if (!this.isIncluded(key, options)) {
                continue;
            }
            const source = sourceMap[key];
            contextBlocks.push(`## ${source.title}`);
            contextBlocks.push('');
            contextBlocks.push((source.content || '').trim());
            contextBlocks.push('');
        }
        files.push({
            relativePath: path.join('.vscode', 'brabrix-context.md'),
            content: contextBlocks.length > 0
                ? contextBlocks.join('\n').trim()
                : '# Brabrix Context\n\nNenhum contexto incluído.'
        });
        if (this.isIncluded('rules', options)) {
            files.push({
                relativePath: path.join('.vscode', 'brabrix-rules.md'),
                content: (sourceMap.rules.content || '').trim()
            });
            files.push({
                relativePath: path.join('.brabrix', 'context', 'rules.md'),
                content: (sourceMap.rules.content || '').trim()
            });
        }
        if (this.isIncluded('skills', options)) {
            files.push({
                relativePath: path.join('.brabrix', 'context', 'skills.md'),
                content: (sourceMap.skills.content || '').trim()
            });
        }
        return files;
    }
    buildGeminiFiles(options, sourceMap) {
        const files = [];
        files.push({
            relativePath: 'GEMINI.md',
            content: [
                '# Gemini CLI — Brabrix Dev Context',
                '',
                'Use este arquivo como ponto de entrada.',
                '',
                'Antes de modificar arquivos, leia:',
                '',
                '1. `.gemini/context/current-task.md`',
                '2. `.gemini/context/task-spec.md`',
                '3. `.gemini/skills/project-rules.md`',
                '4. `.gemini/skills/project-skills.md`',
                '',
                '## Regras de execução',
                '',
                '- Verifique as tools disponíveis antes de modificar arquivos.',
                '- Se tools de escrita não estiverem disponíveis, gere o conteúdo para aplicação manual.',
                '- Não invente tools.',
                '- Não tente burlar restrições do ambiente.',
                '- Primeiro apresente plano curto.',
                '- Só depois execute alterações, se o ambiente permitir.'
            ].join('\n')
        });
        this.pushContextFiles(files, '.gemini/context', sourceMap, [
            'projectContext',
            'currentTask',
            'taskSpec',
            'technicalArchitecture',
            'quickStarter'
        ], options);
        this.pushSkillFiles(files, '.gemini/skills', sourceMap, options);
        return files;
    }
    buildGenericFiles(options, sourceMap) {
        const files = [];
        const contextBase = path.join('.brabrix', 'context');
        const readingOrder = [];
        const contextMapping = [
            { key: 'projectContext', filename: 'project-context.md' },
            { key: 'currentTask', filename: 'current-task.md' },
            { key: 'taskSpec', filename: 'task-spec.md' },
            { key: 'prd', filename: 'prd.md' },
            { key: 'technicalSpec', filename: 'technical-spec.md' },
            { key: 'technicalArchitecture', filename: 'technical-architecture.md' },
            { key: 'quickStarter', filename: 'quick-starter.md' },
            { key: 'skills', filename: 'skills.md' },
            { key: 'rules', filename: 'rules.md' }
        ];
        for (const item of contextMapping) {
            if (!this.isIncluded(item.key, options)) {
                continue;
            }
            const source = sourceMap[item.key];
            const relativePath = path.join(contextBase, item.filename);
            files.push({
                relativePath,
                content: (source.content || '').trim()
            });
            readingOrder.push(`- \`${this.toPosixPath(relativePath)}\``);
        }
        files.push({
            relativePath: path.join(contextBase, 'index.md'),
            content: [
                '# Índice de Contexto Brabrix',
                '',
                'Este diretório concentra os arquivos usados por agentes de IA locais.',
                '',
                '## Ordem de leitura sugerida',
                '',
                ...(readingOrder.length > 0 ? readingOrder : ['- Nenhum arquivo selecionado.']),
                '',
                '## Observações',
                '',
                '- Se algum arquivo estiver com conteúdo parcial, rode a sincronização novamente.',
                '- Rules devem ser tratadas como obrigatórias.',
                '- Skills devem ser usadas como padrões técnicos recomendados.'
            ].join('\n')
        });
        const genericPrompt = this.buildGenericTaskPrompt(options, sourceMap);
        files.push({
            relativePath: path.join('.brabrix', 'prompts', 'current-task-prompt.md'),
            content: genericPrompt
        });
        return files;
    }
    buildGenericTaskPrompt(options, sourceMap) {
        const lines = [
            '# Brabrix Dev — Prompt Base da Tarefa',
            '',
            'Use este prompt como ponto de partida para execução local da tarefa.',
            ''
        ];
        const orderedKeys = [
            'currentTask',
            'taskSpec',
            'rules',
            'skills',
            'technicalArchitecture',
            'projectContext',
            'prd',
            'technicalSpec',
            'quickStarter'
        ];
        for (const key of orderedKeys) {
            if (!this.isIncluded(key, options)) {
                continue;
            }
            const source = sourceMap[key];
            lines.push(`## ${source.title}`);
            lines.push('');
            lines.push((source.content || '').trim());
            lines.push('');
        }
        lines.push('## Instruções');
        lines.push('');
        lines.push('- Leia as Rules antes de alterar arquivos.');
        lines.push('- Faça um plano curto antes de implementar.');
        lines.push('- Não altere arquivos fora do escopo.');
        lines.push('- Respeite arquitetura e multi-tenancy.');
        lines.push('- Ao final, descreva arquivos alterados e próximos passos.');
        lines.push('');
        return lines.join('\n');
    }
    pushContextFiles(files, folder, sourceMap, keys, options) {
        const contextFileNames = {
            projectContext: 'project-context.md',
            currentTask: 'current-task.md',
            taskSpec: 'task-spec.md',
            prd: 'prd.md',
            technicalSpec: 'technical-spec.md',
            technicalArchitecture: 'technical-architecture.md',
            quickStarter: 'quick-starter.md',
            skills: 'skills.md',
            rules: 'rules.md'
        };
        for (const key of keys) {
            if (!this.isIncluded(key, options)) {
                continue;
            }
            files.push({
                relativePath: path.join(folder, contextFileNames[key]),
                content: (sourceMap[key].content || '').trim()
            });
        }
    }
    pushSkillFiles(files, folder, sourceMap, options) {
        if (this.isIncluded('skills', options)) {
            files.push({
                relativePath: path.join(folder, 'project-skills.md'),
                content: (sourceMap.skills.content || '').trim()
            });
        }
        if (this.isIncluded('rules', options)) {
            files.push({
                relativePath: path.join(folder, 'project-rules.md'),
                content: (sourceMap.rules.content || '').trim()
            });
        }
    }
    loadSourceMap(rootPath, withPlaceholder) {
        const map = {};
        for (const descriptor of SOURCE_DESCRIPTORS) {
            map[descriptor.key] = this.loadSourceDocument(rootPath, descriptor, withPlaceholder);
        }
        return map;
    }
    loadSourceDocument(rootPath, descriptor, withPlaceholder) {
        const candidates = [descriptor.primaryRelativePath, descriptor.secondaryRelativePath]
            .filter((candidate) => Boolean(candidate));
        for (const relative of candidates) {
            const absolute = this.resolveSafeAbsolutePath(rootPath, relative);
            if (!fs.existsSync(absolute)) {
                continue;
            }
            const stat = fs.statSync(absolute);
            if (!stat.isFile()) {
                continue;
            }
            const content = fs.readFileSync(absolute, 'utf8');
            return {
                key: descriptor.key,
                title: descriptor.title,
                content,
                sourceRelativePath: this.toPosixPath(relative)
            };
        }
        if (!withPlaceholder) {
            return {
                key: descriptor.key,
                title: descriptor.title
            };
        }
        return {
            key: descriptor.key,
            title: descriptor.title,
            content: [
                `# ${descriptor.title}`,
                '',
                'Não sincronizado.',
                descriptor.missingHint,
                '',
                'Use os comandos da Brabrix Dev para sincronizar o projeto e regenerar este template.'
            ].join('\n')
        };
    }
    writePlannedFile(rootPath, file, overwriteMode, backupStamp, result) {
        const relativePath = this.toPosixPath(file.relativePath);
        const absolutePath = this.resolveSafeAbsolutePath(rootPath, file.relativePath);
        const alreadyExists = fs.existsSync(absolutePath);
        const normalizedMode = overwriteMode === 'ask' ? 'skip' : overwriteMode;
        if (alreadyExists) {
            if (normalizedMode === 'skip') {
                result.skipped.push(relativePath);
                return;
            }
            if (normalizedMode === 'backup') {
                const backupRelative = path.join('.brabrix', 'backups', 'agent-templates', backupStamp, file.relativePath);
                const backupAbsolute = this.resolveSafeAbsolutePath(rootPath, backupRelative);
                fs.mkdirSync(path.dirname(backupAbsolute), { recursive: true });
                fs.copyFileSync(absolutePath, backupAbsolute);
                result.backedUp.push(this.toPosixPath(backupRelative));
            }
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, file.content, 'utf8');
            result.updated.push(relativePath);
            return;
        }
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, file.content, 'utf8');
        result.created.push(relativePath);
    }
    isIncluded(key, options) {
        switch (key) {
            case 'projectContext':
                return options.includeProjectContext;
            case 'currentTask':
                return options.includeCurrentTask;
            case 'taskSpec':
                return options.includeTaskSpec;
            case 'prd':
                return options.includePrd;
            case 'technicalSpec':
                return options.includeTechnicalSpec;
            case 'technicalArchitecture':
                return options.includeTechnicalArchitecture;
            case 'quickStarter':
                return options.includeQuickStarter;
            case 'skills':
                return options.includeSkills;
            case 'rules':
                return options.includeRules;
            default:
                return false;
        }
    }
    getWorkspaceRootPath() {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) {
            throw new Error('Abra um workspace para gerar templates de agente.');
        }
        return root.fsPath;
    }
    resolveSafeAbsolutePath(rootPath, relativePath) {
        if (!relativePath || relativePath.trim().length === 0) {
            throw new Error('Caminho relativo inválido.');
        }
        if (path.isAbsolute(relativePath)) {
            throw new Error(`Caminho absoluto não permitido: ${relativePath}`);
        }
        const normalizedRelative = path.normalize(relativePath);
        const segments = normalizedRelative.split(path.sep).filter(Boolean);
        if (segments.includes('..')) {
            throw new Error(`Path traversal bloqueado: ${relativePath}`);
        }
        if (segments.includes('.git') || segments.includes('node_modules')) {
            throw new Error(`Destino não permitido: ${relativePath}`);
        }
        const absolute = path.resolve(rootPath, normalizedRelative);
        const rootResolved = path.resolve(rootPath);
        if (absolute !== rootResolved && !absolute.startsWith(`${rootResolved}${path.sep}`)) {
            throw new Error(`Escrita fora do workspace bloqueada: ${relativePath}`);
        }
        return absolute;
    }
    buildBackupStamp() {
        const now = new Date();
        const pad = (value) => `${value}`.padStart(2, '0');
        return [
            now.getFullYear(),
            pad(now.getMonth() + 1),
            pad(now.getDate()),
            '-',
            pad(now.getHours()),
            pad(now.getMinutes()),
            pad(now.getSeconds())
        ].join('');
    }
    toPosixPath(value) {
        return value.replace(/\\/g, '/');
    }
}
exports.AgentTemplateGenerator = AgentTemplateGenerator;
//# sourceMappingURL=agentTemplateGenerator.js.map