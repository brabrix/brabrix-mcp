import * as vscode from 'vscode';
import { SyncStateService } from '../services/syncStateService';

export async function showSyncStatusCommand(syncStateService: SyncStateService) {
    const state = syncStateService.readState();
    
    if (!state) {
        vscode.window.showInformationMessage("Nenhum dado de sincronização encontrado.");
        return;
    }

    let msg = `Última sincronização: ${state.lastSyncAt ? new Date(state.lastSyncAt).toLocaleString() : 'N/A'}\n`;
    if (state.lastSkillsSyncAt) {
        msg += `Última sync de Skills: ${new Date(state.lastSkillsSyncAt).toLocaleString()}\n`;
    }
    if (state.skillsCount !== undefined || state.rulesCount !== undefined) {
        msg += `Skills: ${state.skillsCount ?? 0} | Rules: ${state.rulesCount ?? 0}\n`;
    }
    if (state.selectedTaskTitle) {
        msg += `Tarefa atual: ${state.selectedTaskTitle}\n`;
    }
    
    if (state.generatedFiles && state.generatedFiles.length > 0) {
        msg += `Arquivos gerados: ${state.generatedFiles.length}\n`;
    }

    vscode.window.showInformationMessage(msg, { modal: true });
}
