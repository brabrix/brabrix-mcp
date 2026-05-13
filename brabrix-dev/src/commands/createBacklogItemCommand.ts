import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';

export async function createBacklogItemCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    refreshAll: () => void
) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Selecione ou crie um projeto primeiro.");
        return;
    }

    // 1. Selecionar Tipo
    const types: vscode.QuickPickItem[] = [
        { label: 'EPIC', description: 'Épico / Grande Tema' },
        { label: 'FEATURE', description: 'Funcionalidade Maior' },
        { label: 'USER_STORY', description: 'História de Usuário' },
        { label: 'TASK', description: 'Tarefa Técnica' },
        { label: 'BUG', description: 'Correção de Bug' },
        { label: 'IMPROVEMENT', description: 'Melhoria' },
        { label: 'DOCUMENTATION', description: 'Documentação' },
    ];

    const typeSelection = await vscode.window.showQuickPick(types, {
        placeHolder: 'Qual o tipo do item?'
    });

    if (!typeSelection) return;

    // 2. Título
    const title = await vscode.window.showInputBox({
        prompt: 'Qual o título do item?',
        placeHolder: 'Ex: Criar formulário de login'
    });

    if (!title) return;

    // 3. Descrição (opcional)
    const description = await vscode.window.showInputBox({
        prompt: 'Descrição (opcional)',
        placeHolder: 'Ex: O formulário deve validar campos de email e senha.'
    });

    // 4. Selecionar Item Pai (opcional)
    let parentId: string | undefined;
    const backlog = await client.listBacklog(config.projectId);
    if (backlog.length > 0) {
        const parentItems = [
            { label: '$(dash) Sem pai (Raiz)', id: undefined },
            ...backlog.filter(i => i.type === 'EPIC' || i.type === 'FEATURE' || i.type === 'USER_STORY').map(i => ({
                label: `$(${getIconName(i.type)}) ${i.title}`,
                description: i.type,
                id: i.id
            }))
        ];

        const parentSelection = await vscode.window.showQuickPick(parentItems, {
            placeHolder: 'Vincular a qual item pai? (Opcional)'
        });

        if (parentSelection) {
            parentId = parentSelection.id;
        }
    }

    try {
        await client.createBacklogItem(config.projectId, {
            type: typeSelection.label,
            title: title,
            description: description || 'Item criado pelo VS Code.',
            parentId: parentId
        });

        vscode.window.showInformationMessage("Item criado com sucesso!");
        refreshAll();
    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao criar item: ${e.message}`);
    }
}

function getIconName(type: string): string {
    switch (type) {
        case 'EPIC': return 'layers';
        case 'FEATURE': return 'symbol-method';
        case 'USER_STORY': return 'person';
        default: return 'circle-outline';
    }
}