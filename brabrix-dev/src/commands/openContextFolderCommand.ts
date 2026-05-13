import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WorkspaceConfig } from '../config/workspaceConfig';

export async function openContextFolderCommand(workspaceConfig: WorkspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace primeiro.");
        return;
    }

    const contextFolder = path.join(root.fsPath, '.brabrix', 'context');
    if (!fs.existsSync(contextFolder)) {
        vscode.window.showInformationMessage("A pasta de contexto ainda não foi gerada. Sincronize o projeto primeiro.");
        return;
    }

    // Open file explorer revealing the folder
    vscode.env.openExternal(vscode.Uri.file(contextFolder));
}