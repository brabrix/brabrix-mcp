"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editBacklogItemCommand = editBacklogItemCommand;
const vscode = require("vscode");
async function editBacklogItemCommand(client, workspaceConfig, refreshAll, node) {
    if (!node || !node.item) {
        vscode.window.showErrorMessage("Nenhum item selecionado para edição.");
        return;
    }
    const item = node.item;
    const config = await workspaceConfig.readConfig();
    if (!config)
        return;
    if (!config.isLocal) {
        vscode.window.showInformationMessage("A edição completa de itens na nuvem deve ser feita pelo navegador.");
        // We could implement this, but for now let's focus on making local mode better as requested.
        return;
    }
    // Edit Title
    const title = await vscode.window.showInputBox({
        prompt: 'Título do item',
        value: item.title
    });
    if (!title)
        return;
    // Edit Description
    const description = await vscode.window.showInputBox({
        prompt: 'Descrição',
        value: item.description
    });
    // Edit Estimated Hours
    const hours = await vscode.window.showInputBox({
        prompt: 'Estimativa (horas)',
        value: item.estimatedHours ? String(item.estimatedHours) : ''
    });
    // Save to Local DB (we need to add updateBacklogItem to Client/LocalDb)
    try {
        // I will implement a general 'updateLocalBacklogItem' logic in Client
        await client.updateLocalBacklogItem(config.projectId, item.id, {
            title,
            description,
            estimatedHours: hours ? parseFloat(hours) : undefined
        });
        vscode.window.showInformationMessage("Item atualizado com sucesso!");
        refreshAll();
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao atualizar item: ${e.message}`);
    }
}
//# sourceMappingURL=editBacklogItemCommand.js.map