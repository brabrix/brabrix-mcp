import * as vscode from 'vscode';
import { WorkspaceConfig } from '../config/workspaceConfig';

export async function openProjectInBrowserCommand(workspaceConfig: WorkspaceConfig) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage('Nenhum projeto selecionado. Selecione um projeto primeiro.');
        return;
    }

    const webBaseUrl = vscode.workspace.getConfiguration().get<string>('brabrix.webBaseUrl', 'https://app.brabrix.com');
    const url = `${webBaseUrl}/dev/projects/${config.projectId}`;
    
    vscode.env.openExternal(vscode.Uri.parse(url));
}