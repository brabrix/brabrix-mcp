import { BrabrixProject } from '../models/brabrixProject';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { BrabrixExport } from '../models/brabrixExport';
import { BrabrixProjectSkill, BrabrixProjectSkillsExport } from '../models/brabrixProjectSkill';
import { TokenStore } from '../auth/tokenStore';
import { LocalDbService } from '../services/localDbService';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { logger } from '../extension';

export class BrabrixClient {
    private baseUrl: string;
    private tokenStore: TokenStore;
    private workspaceConfig?: WorkspaceConfig;
    private localDbService?: LocalDbService;

    constructor(
        baseUrl: string, 
        tokenStore: TokenStore,
        workspaceConfig?: WorkspaceConfig,
        localDbService?: LocalDbService
    ) {
        this.baseUrl = baseUrl;
        this.tokenStore = tokenStore;
        this.workspaceConfig = workspaceConfig;
        this.localDbService = localDbService;
    }

    private async isLocalProject(projectId: string): Promise<boolean> {
        if (!this.workspaceConfig) return false;
        const config = await this.workspaceConfig.readConfig();
        return !!config?.isLocal && config.projectId === projectId;
    }

    private async getHeaders(url: string): Promise<Record<string, string>> {
        const token = await this.tokenStore.getToken();
        if (!token) {
            throw new Error("Não autenticado. Token ou API Key não encontrado.");
        }
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token.startsWith('bbx_')) {
            headers['X-API-Key'] = token;
        } else {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Apenas envia o X-Tenant-Id se a rota for dependente de tenant
        if (url.includes('/tenants/current/') && this.workspaceConfig) {
            const config = await this.workspaceConfig.readConfig();
            if (config?.tenantId) {
                headers['X-Tenant-Id'] = config.tenantId;
            }
        }

        return headers;
    }

    private async fetchWithRefresh(url: string, options: RequestInit = {}): Promise<Response> {
        logger.appendLine(`[Request] ${options.method || 'GET'} ${url}`);
        
        const token = await this.tokenStore.getToken();
        const headers = await this.getHeaders(url);
        let response = await fetch(url, {
            ...options,
            headers
        });

        logger.appendLine(`[Response] ${response.status} ${response.statusText}`);

        // Se for 401 e for API Key, não tentamos refresh
        if (response.status === 401 && token?.startsWith('bbx_')) {
            logger.appendLine("[Auth] API Key inválida ou expirada.");
            throw new Error("API Key inválida ou expirada. Por favor, gere uma nova no painel.");
        }

        if (response.status === 401) {
            logger.appendLine("[Auth] Token expirado, tentando refresh...");
            const refreshToken = await this.tokenStore.getRefreshToken();
            if (!refreshToken) {
                logger.appendLine("[Auth] Refresh token não disponível.");
                throw new Error("Não autenticado e sem refresh token disponível.");
            }

            // Attempt to refresh the token
            const refreshResponse = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!refreshResponse.ok) {
                logger.appendLine(`[Auth] Falha no refresh: ${refreshResponse.status}`);
                await this.tokenStore.clearToken();
                throw new Error("Sessão expirada. Por favor, faça login novamente.");
            }

            const data: any = await refreshResponse.json();
            if (data.accessToken) {
                logger.appendLine("[Auth] Token renovado com sucesso.");
                await this.tokenStore.saveToken(data.accessToken, data.refreshToken);
                
                logger.appendLine(`[Request Retry] ${options.method || 'GET'} ${url}`);
                response = await fetch(url, {
                    ...options,
                    headers: await this.getHeaders(url)
                });
                logger.appendLine(`[Response Retry] ${response.status}`);
            } else {
                logger.appendLine("[Auth] accessToken não encontrado na resposta de refresh.");
                await this.tokenStore.clearToken();
                throw new Error("Falha ao renovar o token.");
            }
        }

        return response;
    }

    async getMe(): Promise<any> {
        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/me`);
        if (!response.ok) throw new Error("Erro ao buscar usuário");
        return response.json();
    }

    async listMemberships(): Promise<any[]> {
        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/me/memberships?size=100`);
        if (!response.ok) throw new Error("Erro ao listar licenças");
        const data: any = await response.json();
        return data.items || [];
    }

    async listProjects(): Promise<BrabrixProject[]> {
        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects?size=100`);
        if (!response.ok) throw new Error("Erro ao listar projetos");
        const data: any = await response.json();
        return (data.items || []) as BrabrixProject[];
    }

    async getProject(projectId: string): Promise<BrabrixProject> {
        if (await this.isLocalProject(projectId) && this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) return db.project;
        }

        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}`);
        if (!response.ok) throw new Error("Erro ao buscar projeto");
        return (await response.json()) as BrabrixProject;
    }

    async listBacklog(projectId: string, filters: { assignedUserId?: string } = {}): Promise<BrabrixBacklogItem[]> {
        if (await this.isLocalProject(projectId) && this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) {
                let items = db.backlog;
                if (filters.assignedUserId) {
                    // Note: Local project items don't have assignedUserId implemented in the basic mock, 
                    // but we could support it if needed. For now, offline shows everything.
                }
                return items;
            }
        }

        let url = `${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/backlog`;
        if (filters.assignedUserId) {
            url += `?assignedUserId=${filters.assignedUserId}`;
        }

        const response = await this.fetchWithRefresh(url);
        if (!response.ok) throw new Error("Erro ao listar backlog");
        const data: any = await response.json();
        
        // O backlog retorna um Array direto do backend, diferente dos projetos que são paginados
        return (Array.isArray(data) ? data : data.items || []) as BrabrixBacklogItem[];
    }

    async getWorkflowState(projectId: string): Promise<any> {
        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/workflow`);
        if (!response.ok) throw new Error("Erro ao buscar estado do workflow");
        return response.json();
    }

    async getWorkflowArtifact(projectId: string, artifactId: string): Promise<any> {
        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/workflow/artifacts/${artifactId}`);
        if (!response.ok) throw new Error("Erro ao buscar artefato do workflow");
        return response.json();
    }

    async updateBacklogStatus(projectId: string, itemId: string, status: string): Promise<void> {
        if (await this.isLocalProject(projectId) && this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) {
                const item = db.backlog.find(i => i.id === itemId);
                if (item) {
                    item.status = status as any;
                    item.updatedAt = new Date().toISOString();
                    this.localDbService.writeDb(db);
                }
            }
            return;
        }

        const token = await this.tokenStore.getToken();
        if (token === 'demo') return; // Mock: não faz nada no backend

        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/backlog/${itemId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error("Erro ao atualizar status");
    }

    async createBacklogItem(projectId: string, payload: any): Promise<BrabrixBacklogItem> {
        if (await this.isLocalProject(projectId) && this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) {
                const newItem: BrabrixBacklogItem = {
                    id: 'local-' + Math.random().toString(36).substr(2, 9),
                    projectId,
                    parentId: payload.parentId,
                    type: payload.type || 'TASK',
                    title: payload.title,
                    description: payload.description,
                    status: payload.status || 'TODO',
                    priority: payload.priority || 'MEDIUM',
                    estimatedHours: payload.estimatedHours,
                    acceptanceCriteria: payload.acceptanceCriteria || '',
                    updatedAt: new Date().toISOString()
                };
                db.backlog.push(newItem);
                this.localDbService.writeDb(db);
                return newItem;
            }
            throw new Error("Local DB não encontrado");
        }

        const token = await this.tokenStore.getToken();
        if (token === 'demo') {
            return {
                id: 'demo-bug-' + Date.now(),
                projectId,
                type: payload.type || 'BUG',
                title: payload.title,
                description: payload.description,
                status: 'TODO'
            };
        }

        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/backlog`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Erro ao criar item no backlog");
        return (await response.json()) as BrabrixBacklogItem;
    }

    async deleteBacklogItem(projectId: string, itemId: string): Promise<void> {
        if (await this.isLocalProject(projectId) && this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) {
                db.backlog = db.backlog.filter(i => i.id !== itemId);
                this.localDbService.writeDb(db);
                return;
            }
            throw new Error("Local DB não encontrado");
        }

        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/backlog/${itemId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Erro ao excluir item do backlog");
    }

    async updateLocalBacklogItem(projectId: string, itemId: string, payload: any): Promise<void> {
        if (this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) {
                const index = db.backlog.findIndex(i => i.id === itemId);
                if (index !== -1) {
                    db.backlog[index] = {
                        ...db.backlog[index],
                        ...payload,
                        updatedAt: new Date().toISOString()
                    };
                    this.localDbService.writeDb(db);
                    return;
                }
            }
        }
        throw new Error("Local DB não encontrado ou item inexistente.");
    }

    async exportProjectContext(projectId: string): Promise<BrabrixExport> {
        if (await this.isLocalProject(projectId) && this.localDbService) {
            const db = this.localDbService.readDb();
            if (db) {
                return db.exportContext || {
                    projectContextMd: `# ${db.project.name}\nProjeto Offline`,
                    backlogMd: db.backlog.map(i => `- [${i.type}] ${i.title}`).join('\n')
                };
            }
        }

        const token = await this.tokenStore.getToken();
        if (token === 'demo') {
            return {
                projectContextMd: "# Sistema de Agendamento Online\nCliente: Clínica Vida Plena",
                backlogMd: "# Backlog\n- EPIC Agenda\n- FEATURE Agendamento online\n  - Paciente visualiza horários disponíveis",
                userStoriesMd: "# Histórias de Usuário\n- Paciente visualiza horários disponíveis",
                acceptanceCriteriaMd: "# Critérios de Aceitação\nNenhum definido",
                aiPromptsMd: "Você é um assistente do projeto..."
            };
        }

        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/export/context`);
        if (!response.ok) throw new Error("Erro ao exportar contexto");
        return (await response.json()) as BrabrixExport;
    }

    async listProjectSkills(projectId: string): Promise<BrabrixProjectSkill[]> {
        const token = await this.tokenStore.getToken();
        if (token === 'demo') {
            return this.buildDemoProjectSkills(projectId);
        }

        if (await this.isLocalProject(projectId)) {
            return [];
        }

        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/skills`);
        if (!response.ok) throw new Error("Erro ao listar skills do projeto");
        const data: unknown = await response.json();
        const items = this.normalizeList<Record<string, unknown>>(data);

        return items
            .map(item => this.toProjectSkill(item))
            .filter(item => Boolean(item.id) && (item.status ?? 'ACTIVE') !== 'INACTIVE');
    }

    async exportProjectSkills(projectId: string): Promise<BrabrixProjectSkillsExport> {
        const token = await this.tokenStore.getToken();
        if (token === 'demo') {
            return this.buildDemoProjectSkillsExport(projectId);
        }

        if (await this.isLocalProject(projectId)) {
            return {
                projectId,
                skills: [],
                rules: []
            };
        }

        try {
            const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/skills/export`);
            if (response.ok) {
                const payload = this.normalizeProjectSkillsExport(await response.json(), projectId);
                if (payload) {
                    const merged = [...payload.skills, ...payload.rules];
                    const hasMissingContent = merged.some(item => !item.content || !item.content.trim());
                    if (hasMissingContent) {
                        const enrichedItems = await this.enrichProjectSkillsWithContent(merged);
                        return {
                            ...payload,
                            skills: enrichedItems.filter(item => item.type === 'SKILL'),
                            rules: enrichedItems.filter(item => item.type === 'RULE')
                        };
                    }
                    return payload;
                }
            } else if (response.status !== 404) {
                throw new Error("Erro ao exportar skills do projeto");
            }
        } catch {
            // fallback para listagem padrão abaixo
        }

        const allSkills = await this.listProjectSkills(projectId);
        const activeSkills = allSkills.filter(s => (s.status ?? 'ACTIVE') === 'ACTIVE');
        const withContent = await this.enrichProjectSkillsWithContent(activeSkills);

        return {
            projectId,
            skills: withContent.filter(s => s.type === 'SKILL'),
            rules: withContent.filter(s => s.type === 'RULE')
        };
    }

    private normalizeProjectSkillsExport(data: unknown, fallbackProjectId: string): BrabrixProjectSkillsExport | undefined {
        if (!data || typeof data !== 'object') {
            return undefined;
        }

        const raw = data as Record<string, unknown>;
        const skills = this.normalizeList<Record<string, unknown>>(raw.skills).map(item => this.toProjectSkill(item));
        const rules = this.normalizeList<Record<string, unknown>>(raw.rules).map(item => this.toProjectSkill(item));

        if (skills.length > 0 || rules.length > 0) {
            return {
                projectId: this.getString(raw, 'projectId') || fallbackProjectId,
                projectName: this.getString(raw, 'projectName') || undefined,
                skills,
                rules,
                consolidatedSkillsMarkdown: this.getString(raw, 'consolidatedSkillsMarkdown') || undefined,
                consolidatedRulesMarkdown: this.getString(raw, 'consolidatedRulesMarkdown') || undefined
            };
        }

        const allItems = this.normalizeList<Record<string, unknown>>(data).map(item => this.toProjectSkill(item));
        if (allItems.length === 0) {
            return undefined;
        }

        return {
            projectId: fallbackProjectId,
            projectName: this.getString(raw, 'projectName') || undefined,
            skills: allItems.filter(item => item.type === 'SKILL'),
            rules: allItems.filter(item => item.type === 'RULE')
        };
    }

    private async enrichProjectSkillsWithContent(items: BrabrixProjectSkill[]): Promise<BrabrixProjectSkill[]> {
        return Promise.all(
            items.map(async item => {
                if (item.content && item.content.trim().length > 0) {
                    return item;
                }

                const detail = await this.getProjectSkillDetail(item.id, item.origin);
                if (!detail) {
                    return item;
                }

                return {
                    ...item,
                    ...detail,
                    id: item.id,
                    required: item.required ?? detail.required,
                    priority: item.priority ?? detail.priority,
                    appliedAt: item.appliedAt ?? detail.appliedAt
                };
            })
        );
    }

    private async getProjectSkillDetail(
        skillId: string,
        origin?: 'PUBLIC' | 'PRIVATE'
    ): Promise<BrabrixProjectSkill | undefined> {
        if (!skillId) {
            return undefined;
        }

        const endpoints = origin === 'PUBLIC'
            ? [
                `/api/v1/tenants/current/dev/skills/hub/${encodeURIComponent(skillId)}`,
                `/api/v1/tenants/current/dev/skills/${encodeURIComponent(skillId)}`
            ]
            : [
                `/api/v1/tenants/current/dev/skills/${encodeURIComponent(skillId)}`,
                `/api/v1/tenants/current/dev/skills/hub/${encodeURIComponent(skillId)}`
            ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.fetchWithRefresh(`${this.baseUrl}${endpoint}`);
                if (response.status === 404 || response.status === 403) {
                    continue;
                }
                if (!response.ok) {
                    continue;
                }

                const payload = await response.json() as Record<string, unknown>;
                const normalized = this.toProjectSkill(payload);
                if (!normalized.id) {
                    continue;
                }
                return normalized;
            } catch {
                continue;
            }
        }

        return undefined;
    }

    private toProjectSkill(raw: Record<string, unknown>): BrabrixProjectSkill {
        const scope = this.getString(raw, 'scope');
        const origin = this.getString(raw, 'origin') || this.getString(raw, 'visibility');
        const type = this.getString(raw, 'type');
        const status = this.getString(raw, 'status');

        const id = this.getString(raw, 'skillId')
            || this.getString(raw, 'id')
            || this.getString(raw, 'linkId');
        const content = this.getString(raw, 'content') || this.getString(raw, 'markdown') || '';

        return {
            id: id || '',
            title: this.getString(raw, 'title') || 'Skill sem título',
            description: this.getString(raw, 'description') || undefined,
            type: type === 'RULE' ? 'RULE' : 'SKILL',
            category: this.getString(raw, 'category') || undefined,
            content,
            status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            scope: scope === 'PLATFORM' ? 'PLATFORM' : 'TENANT',
            origin: origin === 'PUBLIC' || scope === 'PLATFORM' ? 'PUBLIC' : 'PRIVATE',
            required: this.getBoolean(raw, 'required'),
            priority: this.getNumber(raw, 'priority'),
            appliedAt: this.getString(raw, 'appliedAt') || undefined
        };
    }

    private normalizeList<T>(data: unknown): T[] {
        if (Array.isArray(data)) {
            return data as T[];
        }
        if (data && typeof data === 'object' && 'items' in data) {
            const items = (data as { items?: unknown }).items;
            if (Array.isArray(items)) {
                return items as T[];
            }
        }
        return [];
    }

    private getString(raw: Record<string, unknown>, field: string): string | undefined {
        const value = raw[field];
        return typeof value === 'string' ? value : undefined;
    }

    private getBoolean(raw: Record<string, unknown>, field: string): boolean | undefined {
        const value = raw[field];
        return typeof value === 'boolean' ? value : undefined;
    }

    private getNumber(raw: Record<string, unknown>, field: string): number | undefined {
        const value = raw[field];
        return typeof value === 'number' ? value : undefined;
    }

    async getLatestSpec(projectId: string, itemId: string): Promise<any> {
        const response = await this.fetchWithRefresh(`${this.baseUrl}/api/v1/tenants/current/dev/projects/${projectId}/backlog/${itemId}/development-specs/latest`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Erro ao buscar especificação técnica");
        return response.json();
    }

    private buildDemoProjectSkills(projectId: string): BrabrixProjectSkill[] {
        const now = new Date().toISOString();
        return [
            {
                id: `demo-skill-${projectId}-spring-modular`,
                title: 'Spring Boot Modular Architecture',
                description: 'Padrões de arquitetura modular para backend Java Spring Boot.',
                type: 'SKILL',
                category: 'BACKEND',
                content: [
                    '# Spring Boot Modular Architecture',
                    '',
                    '## Objetivo',
                    'Organizar o backend em módulos claros, com limites explícitos e baixo acoplamento.',
                    '',
                    '## Diretrizes',
                    '- Separar controllers, application services e infra por módulo.',
                    '- Evitar dependências cíclicas entre módulos.',
                    '- Expor apenas contratos necessários entre módulos.'
                ].join('\n'),
                status: 'ACTIVE',
                scope: 'TENANT',
                origin: 'PRIVATE',
                required: false,
                priority: 2,
                appliedAt: now
            },
            {
                id: `demo-rule-${projectId}-tenant-id`,
                title: 'Nunca aceitar tenantId do frontend',
                description: 'Tenant deve vir sempre do contexto autenticado no backend.',
                type: 'RULE',
                category: 'SECURITY',
                content: [
                    '# Nunca aceitar tenantId do frontend',
                    '',
                    '## Regra',
                    'O tenant deve sempre ser resolvido do contexto autenticado.',
                    '',
                    '## Como aplicar',
                    '- Ignorar tenantId enviado no body/query/header de requisições públicas.',
                    '- Aplicar filtros multi-tenant com tenant do contexto.',
                    '',
                    '## Critério de validação',
                    'Nenhuma query de dados de tenant deve usar valor vindo do cliente.'
                ].join('\n'),
                status: 'ACTIVE',
                scope: 'PLATFORM',
                origin: 'PUBLIC',
                required: true,
                priority: 1,
                appliedAt: now
            },
            {
                id: `demo-rule-${projectId}-tests-critical-services`,
                title: 'Sempre criar testes para services críticos',
                description: 'Fluxos de negócio e segurança precisam de cobertura de testes.',
                type: 'RULE',
                category: 'TESTING',
                content: [
                    '# Sempre criar testes para services críticos',
                    '',
                    '## Regra',
                    'Toda alteração em service crítico deve incluir testes automatizados.',
                    '',
                    '## Como aplicar',
                    '- Cobrir cenários felizes e de falha.',
                    '- Validar multi-tenancy e permissões quando aplicável.',
                    '',
                    '## Critério de validação',
                    'PR não deve ser finalizado sem testes atualizados para o service alterado.'
                ].join('\n'),
                status: 'ACTIVE',
                scope: 'PLATFORM',
                origin: 'PUBLIC',
                required: false,
                priority: 2,
                appliedAt: now
            }
        ];
    }

    private buildDemoProjectSkillsExport(projectId: string): BrabrixProjectSkillsExport {
        const allSkills = this.buildDemoProjectSkills(projectId);
        return {
            projectId,
            projectName: 'Projeto Demo Brabrix Dev',
            skills: allSkills.filter(skill => skill.type === 'SKILL'),
            rules: allSkills.filter(skill => skill.type === 'RULE')
        };
    }
}
