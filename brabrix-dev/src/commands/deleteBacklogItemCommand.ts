import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BacklogTreeProvider } from '../views/backlogTreeProvider';
import { BoardTreeProvider } from '../views/boardTreeProvider';

export async function deleteBacklogItemCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    refreshAll: () => void,
    node?: any
) {
    if (!node || !node.item) {
        vscode.window.showErrorMessage("Nenhum item selecionado para exclusão.");
        return;
    }

    const item = node.item;
    const config = await workspaceConfig.readConfig();
    if (!config) return;

    const confirm = await vscode.window.showWarningMessage(
        `Deseja realmente excluir o item "${item.title}"?`,
        { modal: true },
        "Excluir"
    );

    if (confirm !== "Excluir") return;

    try {
        await client.deleteBacklogItem(config.projectId, item.id);
        vscode.window.showInformationMessage("Item excluído com sucesso.");
        refreshAll();
    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao excluir item: ${e.message}`);
    }
}