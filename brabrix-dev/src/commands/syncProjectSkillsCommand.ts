import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { SyncStateService } from '../services/syncStateService';
import { ProjectSkillsSyncResult, ProjectSkillsSyncService } from '../services/projectSkillsSyncService';

export async function syncProjectSkillsCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void,
    showMessages: boolean = true
): Promise<ProjectSkillsSyncResult | undefined> {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        if (showMessages) {
            vscode.window.showWarningMessage('Abra um workspace para sincronizar Skills & Rules.');
        }
        return undefined;
    }

    const config = await workspaceConfig.readConfig();
    if (!config) {
        if (showMessages) {
            vscode.window.showWarningMessage('Nenhum projeto vinculado para sincronizar Skills & Rules.');
        }
        return undefined;
    }

    if (showMessages) {
        vscode.window.showInformationMessage('Sincronizando Skills & Rules do projeto...');
    }

    try {
        const syncService = new ProjectSkillsSyncService(client, workspaceConfig);
        const result = await syncService.syncCurrentProject();

        const currentState = syncStateService.readState() || {};
        const mergedGeneratedFiles = mergeGeneratedFiles(currentState.generatedFiles || [], result.generatedFiles);

        syncStateService.updateState({
            lastSkillsSyncAt: result.syncedAt,
            skillsCount: result.skillsCount,
            rulesCount: result.rulesCount,
            generatedFiles: mergedGeneratedFiles
        });

        if (showMessages) {
            vscode.window.showInformationMessage(
                `Skills & Rules sincronizadas com sucesso. Skills: ${result.skillsCount}, Rules: ${result.rulesCount}.`
            );
        }

        refreshAll();
        return result;
    } catch (error: any) {
        if (showMessages) {
            vscode.window.showErrorMessage(`Erro ao sincronizar Skills & Rules: ${error.message}`);
        }
        return undefined;
    }
}

function mergeGeneratedFiles(existing: string[], incoming: string[]): string[] {
    const result = [...existing];
    const seen = new Set(existing);
    for (const file of incoming) {
        if (!seen.has(file)) {
            seen.add(file);
            result.push(file);
        }
    }
    return result;
}
