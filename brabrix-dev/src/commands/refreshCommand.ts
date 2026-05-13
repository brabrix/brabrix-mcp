import * as vscode from 'vscode';

export async function refreshCommand(refreshAll: () => void) {
    refreshAll();
    vscode.window.setStatusBarMessage('Brabrix: Atualizado', 3000);
}