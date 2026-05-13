"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkWorkspaceCommand = linkWorkspaceCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const syncWorkspaceCommand_1 = require("./syncWorkspaceCommand");
async function linkWorkspaceCommand(client, workspaceConfig, syncStateService, refreshAll) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para vinculá-lo.");
        return;
    }
    const currentConfig = await workspaceConfig.readConfig();
    if (currentConfig) {
        const replace = await vscode.window.showWarningMessage("Este workspace já está vinculado a um projeto Brabrix. Deseja substituir o vínculo?", "Substituir", "Cancelar");
        if (replace !== "Substituir")
            return;
    }
    try {
        let currentConfig = await workspaceConfig.readConfig();
        let tenantId = currentConfig?.tenantId;
        let tenantName = currentConfig?.tenantName;
        // Se não tem tenant selecionado, buscar e pedir para selecionar
        if (!tenantId) {
            const memberships = await client.listMemberships();
            if (memberships.length === 0) {
                vscode.window.showErrorMessage("Nenhuma licença Brabrix encontrada para seu usuário.");
                return;
            }
            if (memberships.length === 1) {
                tenantId = memberships[0].tenantId;
                tenantName = memberships[0].tenantName;
            }
            else {
                const tenantItems = memberships.map(m => ({
                    label: m.tenantName,
                    description: m.roleCode,
                    detail: m.tenantSlug,
                    membership: m
                }));
                const selectedTenant = await vscode.window.showQuickPick(tenantItems, {
                    placeHolder: 'Selecione a licença Brabrix'
                });
                if (!selectedTenant)
                    return;
                tenantId = selectedTenant.membership.tenantId;
                tenantName = selectedTenant.membership.tenantName;
            }
            // Salva o tenant temporariamente no config para que as próximas chamadas usem o header correto
            await workspaceConfig.writeConfig({
                ...(currentConfig || { projectId: '', projectName: '' }),
                tenantId,
                tenantName
            });
        }
        const projects = await client.listProjects();
        if (projects.length === 0) {
            vscode.window.showInformationMessage(`Nenhum projeto encontrado para a licença ${tenantName}.`);
            return;
        }
        const items = projects.map(p => ({
            label: p.name,
            description: p.status,
            detail: p.customerName ? `Cliente: ${p.customerName}` : undefined,
            project: p
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Selecione um projeto de ${tenantName} para vincular ao workspace`
        });
        if (selected) {
            await workspaceConfig.writeConfig({
                projectId: selected.project.id,
                projectName: selected.project.name,
                tenantId,
                tenantName,
                isLocal: false,
                lastSyncAt: new Date().toISOString()
            });
            // Create base folders
            const brabrixFolder = path.join(root.fsPath, '.brabrix');
            ['context', 'prompts/history', 'cache'].forEach(folder => {
                const fullPath = path.join(brabrixFolder, folder);
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                }
            });
            vscode.window.showInformationMessage("Workspace vinculado ao projeto Brabrix. Iniciando sincronização...");
            await (0, syncWorkspaceCommand_1.syncWorkspaceCommand)(client, workspaceConfig, syncStateService, refreshAll, false);
        }
    }
    catch (e) {
        vscode.window.showErrorMessage("Erro ao buscar projetos: " + e.message);
    }
}
//# sourceMappingURL=linkWorkspaceCommand.js.map