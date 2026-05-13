"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copySpecCommand = copySpecCommand;
const vscode = require("vscode");
async function copySpecCommand(client, workspaceConfig, node) {
    if (!node || !node.item) {
        vscode.window.showInformationMessage("Selecione um item no backlog ou board para copiar a spec.");
        return;
    }
    const config = await workspaceConfig.readConfig();
    if (!config)
        return;
    try {
        const spec = await client.getLatestSpec(config.projectId, node.item.id);
        if (!spec || !spec.content) {
            vscode.window.showWarningMessage(`Nenhuma spec técnica encontrada para: ${node.item.title}`);
            return;
        }
        await vscode.env.clipboard.writeText(spec.content);
        vscode.window.showInformationMessage(`Spec técnica de "${node.item.title}" copiada para o clipboard!`);
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao buscar spec: ${e.message}`);
    }
}
//# sourceMappingURL=copySpecCommand.js.map