"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProjectSkillsCommand = syncProjectSkillsCommand;
const vscode = require("vscode");
const projectSkillsSyncService_1 = require("../services/projectSkillsSyncService");
async function syncProjectSkillsCommand(client, workspaceConfig, syncStateService, refreshAll, showMessages = true) {
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
        const syncService = new projectSkillsSyncService_1.ProjectSkillsSyncService(client, workspaceConfig);
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
            vscode.window.showInformationMessage(`Skills & Rules sincronizadas com sucesso. Skills: ${result.skillsCount}, Rules: ${result.rulesCount}.`);
        }
        refreshAll();
        return result;
    }
    catch (error) {
        if (showMessages) {
            vscode.window.showErrorMessage(`Erro ao sincronizar Skills & Rules: ${error.message}`);
        }
        return undefined;
    }
}
function mergeGeneratedFiles(existing, incoming) {
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
//# sourceMappingURL=syncProjectSkillsCommand.js.map