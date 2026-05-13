import { config } from '../config.js';
import { BrabrixError } from '../utils/errors.js';
const DEFAULT_DEMO_PROJECT_ID = 'demo-project';
const SKILL_PREVIEW_LIMIT = 400;
const RULE_CONTENT_LIMIT = 3_500;
const SKILL_CONTENT_LIMIT = 2_500;
const BACKLOG_PREVIEW_LIMIT = 20;
export class BrabrixClient {
    apiUrl;
    token;
    isDemo;
    constructor() {
        this.apiUrl = config.apiUrl;
        this.token = config.token;
        this.isDemo = config.isDemoMode;
    }
    async fetchApi(path, options = {}) {
        if (this.isDemo) {
            throw new Error('Not available in demo mode');
        }
        const url = `${this.apiUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (this.token) {
            if (this.token.startsWith('bbx_')) {
                headers['X-API-Key'] = this.token;
            }
            else {
                headers['Authorization'] = `Bearer ${this.token}`;
            }
        }
        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 401) {
                throw new BrabrixError('Token inválido ou expirado', 'AUTH_ERROR');
            }
            if (response.status === 403) {
                throw new BrabrixError('Sem permissão para acessar este recurso', 'FORBIDDEN');
            }
            if (response.status === 404) {
                throw new BrabrixError('Recurso não encontrado', 'NOT_FOUND');
            }
            if (!response.ok) {
                throw new BrabrixError(`Erro na API: ${response.statusText}`, 'API_ERROR');
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof BrabrixError)
                throw error;
            throw new BrabrixError(`Erro de rede: ${error instanceof Error ? error.message : String(error)}`, 'NETWORK_ERROR');
        }
    }
    async getProjectContext(projectId) {
        if (this.isDemo) {
            return {
                projectId,
                projectName: 'Sistema de Agendamento Online',
                customerName: 'Clínica Vida Plena',
                description: 'Plataforma para agendamentos online de consultas e procedimentos.',
                projectType: 'Web Application',
                status: 'ACTIVE',
                stack: 'Java 21, Spring Boot, React, PostgreSQL',
                summary: 'Reduzir atendimento manual e centralizar agenda.',
            };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/export/context`);
    }
    async getCurrentTask(projectId, taskId) {
        const id = taskId || config.currentTaskId;
        if (!id) {
            throw new BrabrixError('ID da tarefa não configurado e não fornecido.');
        }
        if (this.isDemo) {
            return {
                id,
                projectId,
                type: 'TASK',
                title: 'Criar endpoint de horários disponíveis',
                status: 'TODO',
                priority: 'HIGH',
                description: 'Como paciente, quero visualizar horários disponíveis para escolher uma consulta sem depender do WhatsApp.',
                acceptanceCriteria: '- Retornar slots livres\n- Considerar duração\n- Filtrar por profissional',
                estimatedHours: 4,
            };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/backlog/${id}`);
    }
    async getTaskSpec(projectId, taskId) {
        if (this.isDemo) {
            return {
                taskId,
                taskTitle: 'Criar endpoint de horários disponíveis',
                title: 'Spec: Criar endpoint de horários disponíveis',
                content: '# Spec: Criar endpoint de horários disponíveis\n\n## Objetivo\nAPI de horários livres.',
            };
        }
        const spec = await this.fetchApi(`/api/dev/projects/${projectId}/backlog/${taskId}/development-specs/export`);
        return {
            taskId,
            taskTitle: spec.taskTitle || '',
            specId: spec.id,
            version: spec.version,
            status: spec.status,
            title: spec.title || 'Development Spec',
            content: spec.content || spec.markdown || '',
        };
    }
    async getPrd(projectId) {
        if (this.isDemo) {
            return {
                projectId,
                title: 'PRD - Clínica Vida Plena',
                content: '# PRD\n\nVisão geral do sistema de agendamento.',
                status: 'APPROVED',
            };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/workflow?type=PRD`);
    }
    async getTechnicalSpec(projectId) {
        if (this.isDemo) {
            return {
                projectId,
                title: 'Especificação Técnica',
                content: '# Especificação Técnica\n\nArquitetura Modulith.',
                status: 'APPROVED',
            };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/workflow?type=TECH_SPEC`);
    }
    async getTechnicalArchitecture(projectId) {
        if (this.isDemo) {
            return {
                projectId,
                title: 'Arquitetura Técnica',
                content: '# Arquitetura Técnica\n\nSeparação por módulos e fronteiras claras entre contexto de negócio e infraestrutura.',
                status: 'APPROVED',
            };
        }
        try {
            return await this.fetchApi(`/api/dev/projects/${projectId}/workflow?type=TECHNICAL_ARCHITECTURE`);
        }
        catch (error) {
            if (error instanceof BrabrixError && error.code === 'NOT_FOUND') {
                return this.fetchApi(`/api/dev/projects/${projectId}/workflow?type=ARCHITECTURE`);
            }
            throw error;
        }
    }
    async getQuickStarter(projectId) {
        if (this.isDemo) {
            return {
                projectId,
                title: 'Quick Starter',
                content: '# Quick Starter\n\n1. Subir API local\n2. Configurar banco\n3. Executar testes críticos.',
                status: 'APPROVED',
            };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/workflow?type=QUICK_STARTER`);
    }
    async getBacklog(projectId) {
        if (this.isDemo) {
            return [
                { id: 'task-001', type: 'TASK', title: 'TASK Criar endpoint de horários disponíveis', status: 'TODO', priority: 'HIGH' },
                { id: 'task-002', type: 'TASK', title: 'TASK Criar service de disponibilidade', status: 'IN_PROGRESS', priority: 'HIGH' },
            ];
        }
        const data = await this.fetchApi(`/api/dev/projects/${projectId}/backlog`);
        return this.normalizeList(data);
    }
    async getBoard(projectId) {
        const backlog = await this.getBacklog(projectId);
        const board = {
            TODO: [], READY: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [], CANCELED: []
        };
        backlog.forEach(item => {
            if (board[item.status]) {
                board[item.status].push(item);
            }
        });
        return board;
    }
    async listPublicSkills(params = {}) {
        if (this.isDemo) {
            return this.getDemoPublicSkills(params);
        }
        const query = this.toQueryString({
            type: params.type,
            category: params.category,
            featured: params.featured,
            q: params.q,
        });
        const data = await this.fetchApi(`/api/dev/skills/hub${query}`);
        const items = this.normalizeList(data);
        return items
            .filter(item => this.getBoolean(item, 'published') !== false)
            .map(item => this.toDevSkillSummary(item, 'PUBLIC'))
            .filter(item => item.status !== 'INACTIVE');
    }
    async listMySkills(params = {}) {
        if (this.isDemo) {
            return this.getDemoPrivateSkills(params);
        }
        const query = this.toQueryString({
            type: params.type,
            category: params.category,
            status: params.status || 'ACTIVE',
            q: params.q,
        });
        const data = await this.fetchApi(`/api/dev/skills${query}`);
        const items = this.normalizeList(data);
        return items
            .map(item => this.toDevSkillSummary(item, 'PRIVATE'))
            .filter(item => (params.status ? true : item.status !== 'INACTIVE'));
    }
    async listProjectSkills(projectId, params = {}) {
        if (this.isDemo) {
            return this.getDemoProjectSkills(projectId, params);
        }
        const query = this.toQueryString({
            type: params.type,
        });
        const data = await this.fetchApi(`/api/dev/projects/${projectId}/skills${query}`);
        const items = this.normalizeList(data);
        return items
            .filter(item => this.getBoolean(item, 'published') !== false)
            .map(item => this.toProjectSkill(item))
            .filter(item => item.status !== 'INACTIVE')
            .map(item => ({
            ...item,
            content: undefined,
        }));
    }
    async getPublicSkill(skillId) {
        if (this.isDemo) {
            const match = [...this.getDemoPublicSkillDetails(), ...this.getDemoPrivateSkillDetails()]
                .find(skill => skill.id === skillId);
            if (!match) {
                throw new BrabrixError('Skill pública não encontrada', 'NOT_FOUND');
            }
            return match;
        }
        const data = await this.fetchApi(`/api/dev/skills/hub/${skillId}`);
        if (this.getBoolean(data, 'published') === false) {
            throw new BrabrixError('Skill pública não está publicada', 'FORBIDDEN');
        }
        const detail = this.toSkillDetail(data, 'PUBLIC');
        if (detail.status === 'INACTIVE') {
            throw new BrabrixError('Skill pública inativa', 'FORBIDDEN');
        }
        return detail;
    }
    async getSkill(skillId) {
        if (this.isDemo) {
            const match = [...this.getDemoPublicSkillDetails(), ...this.getDemoPrivateSkillDetails()]
                .find(skill => skill.id === skillId);
            if (!match) {
                throw new BrabrixError('Skill não encontrada', 'NOT_FOUND');
            }
            return match;
        }
        try {
            const data = await this.fetchApi(`/api/dev/skills/${skillId}`);
            const detail = this.toSkillDetail(data, 'PRIVATE');
            if (detail.status === 'INACTIVE') {
                throw new BrabrixError('Skill inativa não disponível para este contexto', 'FORBIDDEN');
            }
            return detail;
        }
        catch (error) {
            if (error instanceof BrabrixError && (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN')) {
                return this.getPublicSkill(skillId);
            }
            throw error;
        }
    }
    async getProjectRules(projectId, requiredOnly = false) {
        if (this.isDemo) {
            const rules = this.getDemoProjectRules(projectId);
            return requiredOnly ? rules.filter(rule => rule.required) : rules;
        }
        const rules = await this.listProjectSkills(projectId, { type: 'RULE' });
        const filtered = requiredOnly ? rules.filter(rule => rule.required) : rules;
        const withFullContent = await Promise.all(filtered.map(async (rule) => {
            try {
                const detail = await this.getSkill(rule.skillId || rule.id);
                return {
                    ...rule,
                    content: this.truncateContent(detail.content, RULE_CONTENT_LIMIT),
                };
            }
            catch {
                return rule;
            }
        }));
        return this.sortRules(withFullContent);
    }
    async getEffectiveProjectContext(projectId, taskId, options = {}) {
        if (this.isDemo) {
            return this.getDemoEffectiveProjectContext(projectId, taskId, options);
        }
        const includeSkills = options.includeSkills ?? true;
        const includeRules = options.includeRules ?? true;
        const includeBacklog = options.includeBacklog ?? true;
        const includeArtifacts = options.includeArtifacts ?? true;
        const warnings = [];
        const project = await this.getProjectContext(projectId).catch((error) => {
            warnings.push(`project: ${this.toErrorMessage(error)}`);
            return null;
        });
        const currentTask = await this.getCurrentTask(projectId, taskId).catch((error) => {
            warnings.push(`currentTask: ${this.toErrorMessage(error)}`);
            return null;
        });
        const taskSpec = currentTask
            ? await this.getTaskSpec(projectId, currentTask.id).catch((error) => {
                warnings.push(`taskSpec: ${this.toErrorMessage(error)}`);
                return null;
            })
            : null;
        const prd = includeArtifacts
            ? await this.getPrd(projectId).catch((error) => {
                warnings.push(`prd: ${this.toErrorMessage(error)}`);
                return null;
            })
            : null;
        const technicalSpec = includeArtifacts
            ? await this.getTechnicalSpec(projectId).catch((error) => {
                warnings.push(`technicalSpec: ${this.toErrorMessage(error)}`);
                return null;
            })
            : null;
        const technicalArchitecture = includeArtifacts
            ? await this.getTechnicalArchitecture(projectId).catch((error) => {
                warnings.push(`technicalArchitecture: ${this.toErrorMessage(error)}`);
                return null;
            })
            : null;
        const quickStarter = includeArtifacts
            ? await this.getQuickStarter(projectId).catch((error) => {
                warnings.push(`quickStarter: ${this.toErrorMessage(error)}`);
                return null;
            })
            : null;
        const backlog = includeBacklog
            ? await this.getBacklog(projectId).catch((error) => {
                warnings.push(`backlog: ${this.toErrorMessage(error)}`);
                return [];
            })
            : [];
        const skills = includeSkills
            ? await this.listProjectSkills(projectId, { type: 'SKILL' }).catch((error) => {
                warnings.push(`skills: ${this.toErrorMessage(error)}`);
                return [];
            })
            : [];
        const rules = includeRules
            ? await this.getProjectRules(projectId, false).catch((error) => {
                warnings.push(`rules: ${this.toErrorMessage(error)}`);
                return [];
            })
            : [];
        const normalizedSkills = this.sortSkills(skills).map(skill => ({
            ...skill,
            content: skill.content ? this.truncateContent(skill.content, SKILL_CONTENT_LIMIT) : undefined,
            contentPreview: skill.contentPreview || this.makeContentPreview(skill.content || ''),
        }));
        const normalizedRules = this.sortRules(rules).map(rule => ({
            ...rule,
            content: rule.content ? this.truncateContent(rule.content, RULE_CONTENT_LIMIT) : undefined,
            contentPreview: rule.contentPreview || this.makeContentPreview(rule.content || ''),
        }));
        return {
            project,
            currentTask,
            taskSpec,
            prd,
            technicalSpec,
            technicalArchitecture,
            quickStarter,
            skills: normalizedSkills,
            rules: normalizedRules,
            backlogSummary: includeBacklog ? this.buildBacklogSummary(backlog) : null,
            agentInstructions: this.buildAgentInstructions(normalizedRules, normalizedSkills),
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    async updateTaskStatus(projectId, taskId, status, comment) {
        if (this.isDemo) {
            return { success: true, status, taskId, comment };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/backlog/${taskId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, comment }),
        });
    }
    async addTaskComment(projectId, taskId, comment) {
        if (this.isDemo) {
            return { success: true, taskId, comment };
        }
        return this.fetchApi(`/api/dev/projects/${projectId}/backlog/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment }),
        });
    }
    toQueryString(params) {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                return;
            }
            search.set(key, String(value));
        });
        const query = search.toString();
        return query ? `?${query}` : '';
    }
    normalizeList(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && typeof data === 'object' && 'items' in data) {
            const items = data.items;
            if (Array.isArray(items)) {
                return items;
            }
        }
        return [];
    }
    toDevSkillSummary(raw, defaultOrigin) {
        const scope = this.getString(raw, 'scope');
        const origin = this.getString(raw, 'origin')
            || (scope === 'PLATFORM' || defaultOrigin === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
        const status = this.getString(raw, 'status') || 'ACTIVE';
        return {
            id: this.getString(raw, 'id') || this.getString(raw, 'skillId') || '',
            title: this.getString(raw, 'title') || 'Skill sem título',
            description: this.getString(raw, 'description') || undefined,
            type: this.getString(raw, 'type') || 'SKILL',
            category: this.getString(raw, 'category') || undefined,
            tags: this.getStringArray(raw, 'tags'),
            origin,
            scope,
            featured: this.getBoolean(raw, 'featured'),
            baseSkill: this.getBoolean(raw, 'baseSkill'),
            status,
        };
    }
    toProjectSkill(raw) {
        const scope = this.getString(raw, 'scope');
        const origin = this.getString(raw, 'origin')
            || (scope === 'PLATFORM' ? 'PUBLIC' : 'PRIVATE');
        const content = this.getString(raw, 'content') || '';
        return {
            id: this.getString(raw, 'id') || this.getString(raw, 'skillId') || '',
            skillId: this.getString(raw, 'skillId') || undefined,
            title: this.getString(raw, 'title') || 'Skill sem título',
            description: this.getString(raw, 'description') || undefined,
            type: this.getString(raw, 'type') || 'SKILL',
            category: this.getString(raw, 'category') || undefined,
            content: content || undefined,
            contentPreview: this.getString(raw, 'contentPreview') || this.makeContentPreview(content),
            origin,
            scope,
            required: this.getBoolean(raw, 'required') || false,
            priority: this.getNumber(raw, 'priority'),
            appliedAt: this.getString(raw, 'appliedAt') || undefined,
            status: this.getString(raw, 'status') || 'ACTIVE',
        };
    }
    toSkillDetail(raw, defaultOrigin) {
        const scope = this.getString(raw, 'scope');
        const origin = this.getString(raw, 'origin')
            || (scope === 'PLATFORM' || defaultOrigin === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
        return {
            id: this.getString(raw, 'id') || this.getString(raw, 'skillId') || '',
            title: this.getString(raw, 'title') || 'Skill sem título',
            description: this.getString(raw, 'description') || undefined,
            type: this.getString(raw, 'type') || 'SKILL',
            category: this.getString(raw, 'category') || undefined,
            content: this.getString(raw, 'content') || this.getString(raw, 'markdown') || '',
            tags: this.getStringArray(raw, 'tags'),
            origin,
            scope,
            status: this.getString(raw, 'status') || 'ACTIVE',
            featured: this.getBoolean(raw, 'featured'),
            baseSkill: this.getBoolean(raw, 'baseSkill'),
        };
    }
    buildBacklogSummary(backlog) {
        const byStatus = {};
        for (const item of backlog) {
            byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        }
        return {
            totalItems: backlog.length,
            byStatus,
            itemsPreview: backlog.slice(0, BACKLOG_PREVIEW_LIMIT).map(item => ({
                id: item.id,
                type: item.type,
                title: item.title,
                status: item.status,
                priority: item.priority,
            })),
        };
    }
    buildAgentInstructions(rules, skills) {
        const requiredRules = rules.filter(rule => rule.required);
        const requiredCount = requiredRules.length;
        const rulesCount = rules.length;
        const skillsCount = skills.length;
        return [
            'Use as Rules como restrições obrigatórias. Use as Skills como contexto técnico e padrões recomendados.',
            'Antes de alterar arquivos, leia as Rules obrigatórias do projeto.',
            `Rules carregadas: ${rulesCount} (obrigatórias: ${requiredCount}). Skills carregadas: ${skillsCount}.`,
        ].join(' ');
    }
    sortSkills(skills) {
        return [...skills].sort((a, b) => {
            const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER;
            const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER;
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            return a.title.localeCompare(b.title, 'pt-BR');
        });
    }
    sortRules(rules) {
        return [...rules].sort((a, b) => {
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
    makeContentPreview(content) {
        const clean = content.replace(/\s+/g, ' ').trim();
        if (!clean)
            return undefined;
        if (clean.length <= SKILL_PREVIEW_LIMIT) {
            return clean;
        }
        return `${clean.slice(0, SKILL_PREVIEW_LIMIT)}...`;
    }
    truncateContent(content, limit) {
        if (content.length <= limit) {
            return content;
        }
        return `${content.slice(0, limit)}\n\n[conteúdo truncado para manter resposta em tamanho seguro]`;
    }
    toErrorMessage(error) {
        if (error instanceof BrabrixError) {
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    getString(raw, key) {
        const value = raw[key];
        return typeof value === 'string' ? value : undefined;
    }
    getNumber(raw, key) {
        const value = raw[key];
        return typeof value === 'number' ? value : undefined;
    }
    getBoolean(raw, key) {
        const value = raw[key];
        return typeof value === 'boolean' ? value : undefined;
    }
    getStringArray(raw, key) {
        const value = raw[key];
        if (!Array.isArray(value))
            return undefined;
        return value.filter((item) => typeof item === 'string');
    }
    getDemoPublicSkills(params) {
        const items = [
            {
                id: 'public-skill-saas-multitenant',
                title: 'SaaS Multi-tenant Rules',
                description: 'Regras para isolamento de tenant, auditoria e segurança.',
                type: 'RULE',
                category: 'ARCHITECTURE',
                tags: ['multi-tenant', 'security', 'architecture'],
                origin: 'PUBLIC',
                scope: 'PLATFORM',
                featured: true,
                baseSkill: true,
                status: 'ACTIVE',
            },
        ];
        return this.filterDemoSummaries(items, params.type, params.category, params.q, undefined, params.featured);
    }
    getDemoPrivateSkills(params) {
        const items = [
            {
                id: 'private-skill-spring-modular',
                title: 'Spring Boot Modular Architecture',
                description: 'Padrões de módulos, packages e services para backend Java.',
                type: 'SKILL',
                category: 'BACKEND',
                tags: ['spring-boot', 'java', 'modular'],
                origin: 'PRIVATE',
                scope: 'TENANT',
                status: 'ACTIVE',
            },
        ];
        return this.filterDemoSummaries(items, params.type, params.category, params.q, params.status);
    }
    getDemoProjectSkills(projectId, params) {
        const items = [
            {
                id: 'project-rule-tenant-id',
                skillId: 'public-rule-never-accept-tenant-id',
                title: 'Nunca aceitar tenantId do frontend',
                description: 'Tenant deve vir sempre do contexto autenticado.',
                type: 'RULE',
                category: 'SECURITY',
                contentPreview: 'O tenant deve sempre ser resolvido pelo contexto autenticado do backend.',
                origin: 'PUBLIC',
                scope: 'PLATFORM',
                required: true,
                priority: 1,
                appliedAt: new Date().toISOString(),
                status: 'ACTIVE',
            },
            {
                id: 'project-rule-query-tenant',
                skillId: 'public-rule-query-must-respect-tenant',
                title: 'Toda query deve respeitar tenant',
                description: 'Consultas devem aplicar filtro tenant de forma obrigatória.',
                type: 'RULE',
                category: 'SECURITY',
                contentPreview: 'Sempre aplicar tenant_id nas queries de leitura e escrita.',
                origin: 'PUBLIC',
                scope: 'PLATFORM',
                required: true,
                priority: 2,
                appliedAt: new Date().toISOString(),
                status: 'ACTIVE',
            },
            {
                id: 'project-skill-spring-modular',
                skillId: 'private-skill-spring-modular',
                title: 'Spring Boot Modular Architecture',
                description: 'Padrões de módulos, packages e services para backend Java.',
                type: 'SKILL',
                category: 'BACKEND',
                contentPreview: 'Organize código por módulos, limites explícitos e baixo acoplamento.',
                origin: 'PRIVATE',
                scope: 'TENANT',
                required: false,
                priority: 3,
                appliedAt: new Date().toISOString(),
                status: 'ACTIVE',
            }
        ];
        return items.filter(item => !params.type || item.type === params.type);
    }
    getDemoPublicSkillDetails() {
        return [
            {
                id: 'public-skill-saas-multitenant',
                title: 'SaaS Multi-tenant Rules',
                description: 'Regras para isolamento de tenant, auditoria e segurança.',
                type: 'RULE',
                category: 'ARCHITECTURE',
                content: [
                    '# SaaS Multi-tenant Rules',
                    '',
                    '## Regra',
                    '- Nunca aceitar tenantId do frontend.',
                    '- Todo acesso a dados deve respeitar tenant_id.',
                    '- Operações críticas devem registrar auditoria.',
                ].join('\n'),
                tags: ['multi-tenant', 'security', 'architecture'],
                origin: 'PUBLIC',
                scope: 'PLATFORM',
                status: 'ACTIVE',
                featured: true,
                baseSkill: true,
            },
            {
                id: 'public-rule-never-accept-tenant-id',
                title: 'Nunca aceitar tenantId do frontend',
                description: 'Tenant deve vir sempre do contexto autenticado.',
                type: 'RULE',
                category: 'SECURITY',
                content: [
                    '# Nunca aceitar tenantId do frontend',
                    '',
                    '## Regra',
                    'O tenant deve ser resolvido do contexto autenticado no backend.',
                ].join('\n'),
                origin: 'PUBLIC',
                scope: 'PLATFORM',
                status: 'ACTIVE',
            },
            {
                id: 'public-rule-query-must-respect-tenant',
                title: 'Toda query deve respeitar tenant',
                description: 'Consultas devem aplicar filtro tenant de forma obrigatória.',
                type: 'RULE',
                category: 'SECURITY',
                content: [
                    '# Toda query deve respeitar tenant',
                    '',
                    '## Regra',
                    'Qualquer query de leitura/escrita deve aplicar o tenant correto.',
                ].join('\n'),
                origin: 'PUBLIC',
                scope: 'PLATFORM',
                status: 'ACTIVE',
            }
        ];
    }
    getDemoPrivateSkillDetails() {
        return [
            {
                id: 'private-skill-spring-modular',
                title: 'Spring Boot Modular Architecture',
                description: 'Padrões de módulos, packages e services para backend Java.',
                type: 'SKILL',
                category: 'BACKEND',
                content: [
                    '# Spring Boot Modular Architecture',
                    '',
                    '## Diretrizes',
                    '- Separar domínio, aplicação e infraestrutura por módulo.',
                    '- Evitar dependências cíclicas.',
                    '- Expor contratos explícitos.',
                ].join('\n'),
                tags: ['spring-boot', 'java', 'modular'],
                origin: 'PRIVATE',
                scope: 'TENANT',
                status: 'ACTIVE',
            }
        ];
    }
    getDemoProjectRules(projectId) {
        const rules = this.getDemoProjectSkills(projectId, { type: 'RULE' });
        const details = this.getDemoPublicSkillDetails();
        return rules.map(rule => {
            const detail = details.find(item => item.id === rule.skillId || item.id === rule.id);
            return {
                ...rule,
                content: detail?.content || rule.contentPreview || '',
            };
        });
    }
    getDemoEffectiveProjectContext(projectId, taskId, options = {}) {
        const effectiveProjectId = projectId || DEFAULT_DEMO_PROJECT_ID;
        const includeSkills = options.includeSkills ?? true;
        const includeRules = options.includeRules ?? true;
        const includeBacklog = options.includeBacklog ?? true;
        const includeArtifacts = options.includeArtifacts ?? true;
        const project = {
            projectId: effectiveProjectId,
            projectName: 'Sistema de Agendamento Online',
            customerName: 'Clínica Vida Plena',
            description: 'Plataforma para agendamentos online de consultas e procedimentos.',
            projectType: 'Web Application',
            status: 'ACTIVE',
            stack: 'Java 21, Spring Boot, React, PostgreSQL',
            summary: 'Reduzir atendimento manual e centralizar agenda.',
        };
        const currentTask = {
            id: taskId || 'task-001',
            projectId: effectiveProjectId,
            type: 'TASK',
            title: 'Criar endpoint de horários disponíveis',
            status: 'TODO',
            priority: 'HIGH',
            description: 'Expor API para horários disponíveis no agendamento.',
            acceptanceCriteria: '- Retornar slots livres\n- Filtrar por profissional',
        };
        const taskSpec = {
            taskId: currentTask.id,
            taskTitle: currentTask.title,
            title: 'Spec: endpoint de horários disponíveis',
            content: '# Spec\n\nCriar endpoint para listar horários livres.',
        };
        const skills = includeSkills ? this.getDemoProjectSkills(effectiveProjectId, { type: 'SKILL' }) : [];
        const rules = includeRules ? this.getDemoProjectRules(effectiveProjectId) : [];
        const backlog = includeBacklog ? [
            currentTask,
            {
                id: 'task-002',
                projectId: effectiveProjectId,
                type: 'TASK',
                title: 'Criar service de disponibilidade',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
            }
        ] : [];
        return {
            project,
            currentTask,
            taskSpec,
            prd: includeArtifacts ? {
                projectId: effectiveProjectId,
                title: 'PRD - Sistema de Agendamento Online',
                content: '# PRD\n\nObjetivo: facilitar agendamento online.',
                status: 'APPROVED',
            } : null,
            technicalSpec: includeArtifacts ? {
                projectId: effectiveProjectId,
                title: 'Especificação Técnica',
                content: '# Technical Spec\n\nArquitetura Spring Boot modular.',
                status: 'APPROVED',
            } : null,
            technicalArchitecture: includeArtifacts ? {
                projectId: effectiveProjectId,
                title: 'Arquitetura Técnica',
                content: '# Arquitetura\n\nMódulos: agendamento, disponibilidade e notificações.',
                status: 'APPROVED',
            } : null,
            quickStarter: includeArtifacts ? {
                projectId: effectiveProjectId,
                title: 'Quick Starter',
                content: '# Quick Starter\n\n1. Rodar API\n2. Rodar testes',
                status: 'APPROVED',
            } : null,
            skills,
            rules,
            backlogSummary: includeBacklog ? this.buildBacklogSummary(backlog) : null,
            agentInstructions: this.buildAgentInstructions(rules, skills),
        };
    }
    filterDemoSummaries(items, type, category, q, status, featured) {
        const qLower = q?.toLowerCase().trim();
        return items.filter(item => {
            if (type && item.type !== type)
                return false;
            if (category && item.category !== category)
                return false;
            if (status && item.status !== status)
                return false;
            if (featured !== undefined && item.featured !== featured)
                return false;
            if (!qLower)
                return true;
            const searchable = `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
            return searchable.includes(qLower);
        });
    }
}
