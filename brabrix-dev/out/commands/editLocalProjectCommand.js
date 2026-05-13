"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editLocalProjectCommand = editLocalProjectCommand;
const vscode = require("vscode");
async function editLocalProjectCommand(workspaceConfig, localDbService, refreshAll) {
    const config = await workspaceConfig.readConfig();
    if (!config || !config.isLocal) {
        vscode.window.showErrorMessage("Este comando só está disponível para Projetos Locais.");
        return;
    }
    const db = localDbService.readDb();
    if (!db)
        return;
    const name = await vscode.window.showInputBox({
        prompt: 'Nome do Projeto',
        value: db.project.name
    });
    if (!name)
        return;
    const items = [
        { label: 'Web App' },
        { label: 'Mobile App' },
        { label: 'API / Backend' },
        { label: 'CLI Tool' },
        { label: 'Outro' }
    ];
    const typeSelection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Tipo do projeto',
    });
    const status = await vscode.window.showInputBox({
        prompt: 'Status',
        value: db.project.status
    });
    const customer = await vscode.window.showInputBox({
        prompt: 'Cliente (opcional)',
        value: db.project.customerName
    });
    db.project.name = name;
    db.project.projectType = typeSelection ? typeSelection.label : db.project.projectType;
    db.project.status = status || db.project.status;
    db.project.customerName = customer || undefined;
    localDbService.writeDb(db);
    await workspaceConfig.writeConfig({
        ...config,
        projectName: name
    });
    vscode.window.showInformationMessage("Projeto Local atualizado com sucesso!");
    refreshAll();
}
//# sourceMappingURL=editLocalProjectCommand.js.map