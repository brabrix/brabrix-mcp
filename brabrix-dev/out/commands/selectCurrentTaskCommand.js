"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCurrentTaskCommand = selectCurrentTaskCommand;
const vscode = require("vscode");
async function selectCurrentTaskCommand(client, workspaceConfig, syncStateService, refreshAll) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Vincule um projeto primeiro.");
        return;
    }
    try {
        const backlog = await client.listBacklog(config.projectId);
        const executableItems = backlog.filter(i => ['USER_STORY', 'TASK', 'BUG', 'IMPROVEMENT', 'DOCUMENTATION'].includes(i.type));
        if (executableItems.length === 0) {
            vscode.window.showInformationMessage("Nenhum item executável encontrado.");
            return;
        }
        const items = executableItems.map(i => ({
            label: `[${i.type}] ${i.title}`,
            description: i.status,
            detail: i.priority ? `Prioridade: ${i.priority}` : undefined,
            item: i
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Selecione a tarefa atual'
        });
        if (selected) {
            syncStateService.updateState({
                selectedTaskId: selected.item.id,
                selectedTaskTitle: selected.item.title
            });
            vscode.window.showInformationMessage(`Tarefa atual definida: ${selected.item.title}`);
            refreshAll();
            const action = await vscode.window.showInformationMessage("Deseja gerar o prompt para esta tarefa?", "Sim", "Não");
            if (action === "Sim") {
                vscode.commands.executeCommand('brabrix.generateTaskPrompt', { item: selected.item });
            }
        }
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao carregar backlog: ${e.message}`);
    }
}
//# sourceMappingURL=selectCurrentTaskCommand.js.map