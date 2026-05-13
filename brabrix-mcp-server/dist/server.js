import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { BrabrixClient } from './api/brabrixClient.js';
import { config } from './config.js';
import * as tools from './tools/index.js';
export class BrabrixMcpServer {
    server;
    client;
    constructor() {
        this.server = new Server({
            name: 'brabrix-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.client = new BrabrixClient();
        this.setupTools();
        this.setupResources();
    }
    setupResources() {
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const projectId = config.projectId || 'default';
            return {
                resources: [
                    {
                        uri: `brabrix://project/prd`,
                        name: 'Documento de Requisitos de Produto (PRD)',
                        description: 'Visão geral e requisitos de negócio do projeto',
                        mimeType: 'text/markdown',
                    },
                    {
                        uri: `brabrix://project/tech-spec`,
                        name: 'Especificação Técnica Global',
                        description: 'Diretrizes de arquitetura e padrões técnicos do projeto',
                        mimeType: 'text/markdown',
                    },
                ],
            };
        });
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            const projectId = config.projectId;
            if (!projectId) {
                throw new Error('Project ID não configurado para leitura de recursos.');
            }
            if (uri === 'brabrix://project/prd') {
                const prd = await this.client.getPrd(projectId);
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/markdown',
                            text: prd.content,
                        },
                    ],
                };
            }
            if (uri === 'brabrix://project/tech-spec') {
                const spec = await this.client.getTechnicalSpec(projectId);
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/markdown',
                            text: spec.content,
                        },
                    ],
                };
            }
            throw new Error(`Recurso não encontrado: ${uri}`);
        });
    }
    setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'brabrix_get_workspace_config',
                    description: 'Obter configuração local detectada no workspace (.brabrix/config.json)',
                },
                {
                    name: 'brabrix_get_project_context',
                    description: 'Obter o contexto geral do projeto (nome, cliente, stack, objetivo)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string', description: 'ID do projeto (opcional)' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_current_task',
                    description: 'Obter a tarefa atual que está sendo executada',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            taskId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_task_spec',
                    description: 'Obter a especificação detalhada de uma tarefa em markdown',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            taskId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_prd',
                    description: 'Obter o Documento de Requisitos de Produto (PRD)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_technical_spec',
                    description: 'Obter a especificação técnica global do projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_backlog',
                    description: 'Obter a lista de itens do backlog',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            status: { type: 'string' },
                            type: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_board',
                    description: 'Obter os itens do board agrupados por status',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_related_context_for_task',
                    description: 'Retorna um pacote completo de contexto (projeto, task, spec, itens relacionados) para desenvolvimento',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            taskId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_suggest_git_metadata',
                    description: 'Sugere nome de branch e mensagem de commit baseada na tarefa atual',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            taskId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_alignment_prompt',
                    description: 'Gera um prompt de auto-revisão para garantir que o código está alinhado com os requisitos da Brabrix',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            taskId: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_list_public_skills',
                    description: 'Lista Skills & Rules públicas do Hub da Brabrix (somente resumo)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['SKILL', 'RULE'] },
                            category: { type: 'string' },
                            featured: { type: 'boolean' },
                            q: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_list_my_skills',
                    description: 'Lista Skills & Rules privadas do tenant autenticado (somente resumo)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['SKILL', 'RULE'] },
                            category: { type: 'string' },
                            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                            q: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'brabrix_list_project_skills',
                    description: 'Lista Skills & Rules aplicadas ao projeto (públicas e privadas)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            type: { type: 'string', enum: ['SKILL', 'RULE'] },
                        },
                    },
                },
                {
                    name: 'brabrix_get_skill',
                    description: 'Obtém o conteúdo completo de uma Skill ou Rule, respeitando permissões',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            skillId: { type: 'string', description: 'ID da Skill/Rule' },
                        },
                        required: ['skillId'],
                    },
                },
                {
                    name: 'brabrix_get_project_rules',
                    description: 'Retorna Rules aplicadas ao projeto com ordenação por obrigatoriedade e prioridade',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            requiredOnly: { type: 'boolean' },
                        },
                    },
                },
                {
                    name: 'brabrix_get_effective_project_context',
                    description: 'Retorna contexto efetivo para agentes incluindo Skills & Rules aplicadas',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectId: { type: 'string' },
                            taskId: { type: 'string' },
                            includeSkills: { type: 'boolean' },
                            includeRules: { type: 'boolean' },
                            includeBacklog: { type: 'boolean' },
                            includeArtifacts: { type: 'boolean' },
                        },
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'brabrix_get_workspace_config':
                        return await tools.getWorkspaceConfigTool();
                    case 'brabrix_get_project_context':
                        return await tools.getProjectContextTool(this.client, args || {});
                    case 'brabrix_get_current_task':
                        return await tools.getCurrentTaskTool(this.client, args || {});
                    case 'brabrix_get_task_spec':
                        return await tools.getTaskSpecTool(this.client, args || {});
                    case 'brabrix_get_prd':
                        return await tools.getPrdTool(this.client, args || {});
                    case 'brabrix_get_technical_spec':
                        return await tools.getTechnicalSpecTool(this.client, args || {});
                    case 'brabrix_get_backlog':
                        return await tools.getBacklogTool(this.client, args || {});
                    case 'brabrix_get_board':
                        return await tools.getBoardTool(this.client, args || {});
                    case 'brabrix_get_related_context_for_task':
                        return await tools.getRelatedContextForTaskTool(this.client, args || {});
                    case 'brabrix_suggest_git_metadata':
                        return await tools.suggestGitMetadataTool(this.client, args || {});
                    case 'brabrix_get_alignment_prompt':
                        return await tools.getAlignmentPromptTool(this.client, args || {});
                    case 'brabrix_list_public_skills':
                        return await tools.listPublicSkillsTool(this.client, args || {});
                    case 'brabrix_list_my_skills':
                        return await tools.listMySkillsTool(this.client, args || {});
                    case 'brabrix_list_project_skills':
                        return await tools.listProjectSkillsTool(this.client, args || {});
                    case 'brabrix_get_skill':
                        return await tools.getSkillTool(this.client, args || {});
                    case 'brabrix_get_project_rules':
                        return await tools.getProjectRulesTool(this.client, args || {});
                    case 'brabrix_get_effective_project_context':
                        return await tools.getEffectiveProjectContextTool(this.client, args || {});
                    default:
                        throw new Error(`Tool unknown: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Erro ao executar tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Brabrix MCP Server running on stdio');
    }
}
