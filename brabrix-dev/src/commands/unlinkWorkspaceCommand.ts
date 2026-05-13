import * as vscode from 'vscode';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { SyncStateService } from '../services/syncStateService';
import { LocalDbService } from '../services/localDbService';

export async function unlinkWorkspaceCommand(
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showInformationMessage("Este workspace não está vinculado a nenhum projeto.");
        return;
    }

    const action = await vscode.window.showWarningMessage(
        `Desvincular workspace do projeto "${config.projectName}"?`,
        "Remover vínculo", "Cancelar"
    );

    if (action === "Remover vínculo") {
        await workspaceConfig.clearConfig();
        syncStateService.clearState();
        // Optional: clear local-db.json if it was a local project? We can keep it to not lose data.
        
        vscode.window.showInformationMessage("Workspace desvinculado da Brabrix.");
        refreshAll();
    }
}