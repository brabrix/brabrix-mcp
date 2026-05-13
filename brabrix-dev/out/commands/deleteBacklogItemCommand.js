"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBacklogItemCommand = deleteBacklogItemCommand;
const vscode = require("vscode");
async function deleteBacklogItemCommand(client, workspaceConfig, refreshAll, node) {
    if (!node || !node.item) {
        vscode.window.showErrorMessage("Nenhum item selecionado para exclusão.");
        return;
    }
    const item = node.item;
    const config = await workspaceConfig.readConfig();
    if (!config)
        return;
    const confirm = await vscode.window.showWarningMessage(`Deseja realmente excluir o item "${item.title}"?`, { modal: true }, "Excluir");
    if (confirm !== "Excluir")
        return;
    try {
        await client.deleteBacklogItem(config.projectId, item.id);
        vscode.window.showInformationMessage("Item excluído com sucesso.");
        refreshAll();
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao excluir item: ${e.message}`);
    }
}
//# sourceMappingURL=deleteBacklogItemCommand.js.map