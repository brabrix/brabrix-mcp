import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { AgentTemplateType, AGENT_TEMPLATE_LABELS } from '../models/agentTemplate';
import {
    AgentTemplateGenerationOptions,
    AgentTemplateGenerationResult,
    AgentTemplateGenerator
} from '../services/agentTemplateGenerator';
import { SyncStateService } from '../services/syncStateService';
import { syncWorkspaceCommand } from './syncWorkspaceCommand';

type OverwriteMode = AgentTemplateGenerationOptions['overwriteMode'];

type IncludeSelection = Omit<AgentTemplateGenerationOptions, 'templateType' | 'overwriteMode'>;

interface TemplatePickItem extends vscode.QuickPickItem {
    templateType: AgentTemplateType | 'ALL';
}

const INCLUDE_ITEMS: Array<{
    key: keyof IncludeSelection;
    label: string;
    detail: string;
}> = [
    {
        key: 'includeProjectContext',
        label: 'Contexto do projeto',
        detail: '.brabrix/context/project-context.md'
    },
    {
        key: 'includeCurrentTask',
        label: 'Tarefa atual',
        detail: '.brabrix/context/current-task.md'
    },
    {
        key: 'includeTaskSpec',
        label: 'Spec da tarefa',
        detail: '.brabrix/context/task-spec.md'
    },
    {
        key: 'includePrd',
        label: 'PRD',
        detail: '.brabrix/context/prd.md'
    },
    {
        key: 'includeTechnicalSpec',
        label: 'Spec técnica',
        detail: '.brabrix/context/technical-spec.md'
    },
    {
        key: 'includeTechnicalArchitecture',
        label: 'Arquitetura técnica',
        detail: '.brabrix/context/technical-architecture.md'
    },
    {
        key: 'includeQuickStarter',
        label: 'Quick Starter',
        detail: '.brabrix/context/quick-starter.md'
    },
    {
        key: 'includeSkills',
        label: 'Skills aplicadas',
        detail: '.brabrix/context/skills.md'
    },
    {
        key: 'includeRules',
        label: 'Rules obrigatórias',
        detail: '.brabrix/context/rules.md'
    }
];

const TEMPLATE_MAIN_FILE: Record<AgentTemplateType, string> = {
    [AgentTemplateType.CLAUDE_CODE]: 'CLAUDE.md',
    [AgentTemplateType.CODEX]: 'AGENTS.md',
    [AgentTemplateType.VSCODE_COPILOT]: path.join('.github', 'copilot-instructions.md'),
    [AgentTemplateType.GEMINI_CLI]: 'GEMINI.md',
    [AgentTemplateType.GENERIC]: path.join('.brabrix', 'context', 'index.md')
};

export async function generateAgentTemplatesCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void,
    forcedTemplate?: AgentTemplateType
): Promise<void> {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage('Abra um workspace para gerar templates de agente.');
        return;
    }

    const templateSelection = forcedTemplate
        ? { templates: [forcedTemplate], selectedLabel: AGENT_TEMPLATE_LABELS[forcedTemplate], all: false }
        : await askTemplateSelection();
    if (!templateSelection) {
        return;
    }

    const includeSelection = await askIncludeSelection();
    if (!includeSelection) {
        return;
    }

    const generator = new AgentTemplateGenerator(workspaceConfig);
    const missingSources = generator.detectMissingSources(includeSelection);
    if (missingSources.length > 0) {
        const choice = await vscode.window.showWarningMessage(
            `Alguns arquivos de contexto não foram encontrados (${missingSources.length}). Deseja sincronizar o projeto antes de gerar os templates?`,
            { modal: true },
            'Sincronizar agora',
            'Continuar mesmo assim',
            'Cancelar'
        );

        if (choice === 'Cancelar' || !choice) {
            return;
        }
        if (choice === 'Sincronizar agora') {
            await syncWorkspaceCommand(client, workspaceConfig, syncStateService, refreshAll, true);
        }
    }

    const allTargetPaths = new Set<string>();
    for (const templateType of templateSelection.templates) {
        const paths = generator.previewTargetPaths(templateType, includeSelection);
        for (const relativePath of paths) {
            allTargetPaths.add(relativePath);
        }
    }

    const existingPaths = [...allTargetPaths].filter(relativePath =>
        fs.existsSync(path.join(root.fsPath, relativePath))
    );
    const overwriteMode = await resolveOverwriteMode(existingPaths.length > 0);
    if (!overwriteMode) {
        return;
    }

    const mergedResult: AgentTemplateGenerationResult = {
        created: [],
        updated: [],
        skipped: [],
        backedUp: [],
        failed: []
    };

    for (const templateType of templateSelection.templates) {
        const result = generator.generate({
            templateType,
            overwriteMode,
            ...includeSelection
        });
        mergeResult(mergedResult, result);
    }

    const successCount = mergedResult.created.length + mergedResult.updated.length;
    const failCount = mergedResult.failed.length;

    if (successCount === 0 && mergedResult.skipped.length > 0 && failCount === 0) {
        vscode.window.showInformationMessage('Nenhum arquivo foi alterado. Arquivos existentes foram mantidos.');
        return;
    }

    const successMessage = templateSelection.all
        ? `Templates de agente gerados com sucesso. Criados: ${mergedResult.created.length}, atualizados: ${mergedResult.updated.length}.`
        : `Template ${templateSelection.selectedLabel} gerado com sucesso.`;

    if (templateSelection.templates.length === 1) {
        const templateType = templateSelection.templates[0];
        const primaryFile = TEMPLATE_MAIN_FILE[templateType];
        const openMainAction = `Abrir ${path.basename(primaryFile)}`;
        const selection = await vscode.window.showInformationMessage(
            failCount > 0
                ? `${successMessage} Falhas: ${failCount}.`
                : successMessage,
            openMainAction,
            'Abrir pasta',
            'Fechar'
        );

        if (selection === openMainAction) {
            await openGeneratedFile(root.fsPath, primaryFile);
        } else if (selection === 'Abrir pasta') {
            await vscode.env.openExternal(vscode.Uri.file(root.fsPath));
        }
    } else {
        const selection = await vscode.window.showInformationMessage(
            failCount > 0
                ? `${successMessage} Falhas: ${failCount}.`
                : successMessage,
            'Abrir pasta',
            'Fechar'
        );
        if (selection === 'Abrir pasta') {
            await vscode.env.openExternal(vscode.Uri.file(root.fsPath));
        }
    }

    refreshAll();
}

export async function generateClaudeTemplateCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
): Promise<void> {
    await generateAgentTemplatesCommand(
        client,
        workspaceConfig,
        syncStateService,
        refreshAll,
        AgentTemplateType.CLAUDE_CODE
    );
}

export async function generateCodexTemplateCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
): Promise<void> {
    await generateAgentTemplatesCommand(
        client,
        workspaceConfig,
        syncStateService,
        refreshAll,
        AgentTemplateType.CODEX
    );
}

export async function generateVsCodeTemplateCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
): Promise<void> {
    await generateAgentTemplatesCommand(
        client,
        workspaceConfig,
        syncStateService,
        refreshAll,
        AgentTemplateType.VSCODE_COPILOT
    );
}

export async function generateGeminiTemplateCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
): Promise<void> {
    await generateAgentTemplatesCommand(
        client,
        workspaceConfig,
        syncStateService,
        refreshAll,
        AgentTemplateType.GEMINI_CLI
    );
}

export async function generateGenericTemplateCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
): Promise<void> {
    await generateAgentTemplatesCommand(
        client,
        workspaceConfig,
        syncStateService,
        refreshAll,
        AgentTemplateType.GENERIC
    );
}

async function askTemplateSelection(): Promise<{
    templates: AgentTemplateType[];
    selectedLabel: string;
    all: boolean;
} | undefined> {
    const selected = await vscode.window.showQuickPick<TemplatePickItem>(
        [
            {
                label: AGENT_TEMPLATE_LABELS[AgentTemplateType.CLAUDE_CODE],
                description: 'Gera CLAUDE.md + .claude/context + .claude/skills',
                templateType: AgentTemplateType.CLAUDE_CODE
            },
            {
                label: AGENT_TEMPLATE_LABELS[AgentTemplateType.CODEX],
                description: 'Gera AGENTS.md + .codex/context + .codex/skills',
                templateType: AgentTemplateType.CODEX
            },
            {
                label: AGENT_TEMPLATE_LABELS[AgentTemplateType.VSCODE_COPILOT],
                description: 'Gera copilot-instructions e arquivos .vscode',
                templateType: AgentTemplateType.VSCODE_COPILOT
            },
            {
                label: AGENT_TEMPLATE_LABELS[AgentTemplateType.GEMINI_CLI],
                description: 'Gera GEMINI.md + .gemini/context + .gemini/skills',
                templateType: AgentTemplateType.GEMINI_CLI
            },
            {
                label: AGENT_TEMPLATE_LABELS[AgentTemplateType.GENERIC],
                description: 'Gera índice e prompt base em .brabrix/context',
                templateType: AgentTemplateType.GENERIC
            },
            {
                label: 'Todos',
                description: 'Gera todos os templates do MVP',
                templateType: 'ALL'
            }
        ],
        {
            placeHolder: 'Escolha o template de agente para gerar'
        }
    );

    if (!selected) {
        return undefined;
    }

    if (selected.templateType === 'ALL') {
        return {
            templates: [
                AgentTemplateType.CLAUDE_CODE,
                AgentTemplateType.CODEX,
                AgentTemplateType.VSCODE_COPILOT,
                AgentTemplateType.GEMINI_CLI,
                AgentTemplateType.GENERIC
            ],
            selectedLabel: 'Todos',
            all: true
        };
    }

    return {
        templates: [selected.templateType],
        selectedLabel: selected.label,
        all: false
    };
}

async function askIncludeSelection(): Promise<IncludeSelection | undefined> {
    const selected = await vscode.window.showQuickPick(
        INCLUDE_ITEMS.map(item => ({
            label: item.label,
            description: item.detail,
            key: item.key,
            picked: true
        })),
        {
            placeHolder: 'Selecione o que incluir nos arquivos gerados',
            canPickMany: true
        }
    );

    if (!selected || selected.length === 0) {
        vscode.window.showInformationMessage('Nenhuma seção selecionada. Operação cancelada.');
        return undefined;
    }

    const selectedKeys = new Set(selected.map(item => item.key));
    const result: IncludeSelection = {
        includeProjectContext: selectedKeys.has('includeProjectContext'),
        includeCurrentTask: selectedKeys.has('includeCurrentTask'),
        includeTaskSpec: selectedKeys.has('includeTaskSpec'),
        includePrd: selectedKeys.has('includePrd'),
        includeTechnicalSpec: selectedKeys.has('includeTechnicalSpec'),
        includeTechnicalArchitecture: selectedKeys.has('includeTechnicalArchitecture'),
        includeQuickStarter: selectedKeys.has('includeQuickStarter'),
        includeSkills: selectedKeys.has('includeSkills'),
        includeRules: selectedKeys.has('includeRules')
    };

    return result;
}

async function resolveOverwriteMode(hasExistingFiles: boolean): Promise<OverwriteMode | undefined> {
    if (!hasExistingFiles) {
        return 'overwrite';
    }

    const choice = await vscode.window.showWarningMessage(
        'Alguns arquivos já existem. Como deseja continuar?',
        { modal: true },
        'Criar backup e sobrescrever',
        'Sobrescrever',
        'Pular existentes',
        'Cancelar'
    );

    if (!choice || choice === 'Cancelar') {
        return undefined;
    }
    if (choice === 'Criar backup e sobrescrever') {
        return 'backup';
    }
    if (choice === 'Sobrescrever') {
        return 'overwrite';
    }
    return 'skip';
}

async function openGeneratedFile(workspacePath: string, relativePath: string): Promise<void> {
    const absolutePath = path.join(workspacePath, relativePath);
    if (!fs.existsSync(absolutePath)) {
        vscode.window.showWarningMessage(`Arquivo não encontrado: ${relativePath}`);
        return;
    }
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(absolutePath));
    await vscode.window.showTextDocument(doc);
}

function mergeResult(
    target: AgentTemplateGenerationResult,
    source: AgentTemplateGenerationResult
): void {
    target.created.push(...source.created);
    target.updated.push(...source.updated);
    target.skipped.push(...source.skipped);
    target.backedUp.push(...source.backedUp);
    target.failed.push(...source.failed);
}
