import * as vscode from 'vscode';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { LocalDbService } from '../services/localDbService';

export async function createLocalProjectCommand(
    workspaceConfig: WorkspaceConfig,
    localDbService: LocalDbService,
    refreshAll: () => void
) {
    const name = await vscode.window.showInputBox({
        prompt: 'Qual o nome do Projeto Local?',
        placeHolder: 'Ex: Meu Projeto Secreto'
    });

    if (!name) return;

    const items: vscode.QuickPickItem[] = [
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