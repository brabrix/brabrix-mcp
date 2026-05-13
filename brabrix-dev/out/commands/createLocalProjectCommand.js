"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalProjectCommand = createLocalProjectCommand;
const vscode = require("vscode");
async function createLocalProjectCommand(workspaceConfig, localDbService, refreshAll) {
    const name = await vscode.window.showInputBox({
        prompt: 'Qual o nome do Projeto Local?',
        placeHolder: 'Ex: Meu Projeto Secreto'
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
        placeHolder: 'Qual o tipo do projeto?'
    });
    const projectId = 'local-proj-' + Date.now();
    localDbService.writeDb({
        project: {
            id: projectId,
            name: name,
            projectType: typeSelection ? typeSelection.label : 'Outro',
            status: 'Local'
        },
        backlog: []
    });
    await workspaceConfig.writeConfig({
        projectId: projectId,
        projectName: name,
        isLocal: true
    });
    vscode.window.showInformationMessage("Projeto Local criado com sucesso!");
    refreshAll();
}
//# sourceMappingURL=createLocalProjectCommand.js.map