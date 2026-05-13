import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';

export async function reportBugCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig
) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Selecione um projeto na Brabrix antes de reportar um bug.");
        return;
    }

    // Try to get selected text in active editor
    let selectedText = '';
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selection = editor.selection;
        if (!selection.isEmpty) {
            selectedText = editor.document.getText(selection);
        }
    }

    const title = await vscode.window.showInputBox({
        prompt: 'Qual o título / resumo do bug?',
        placeHolder: 'Ex: Erro 500 na rota de login'
    });

    if (!title) return;

    let description = 'Bug reportado via VS Code.\n';
    if (selectedText) {
        description += `\n**Contexto Selecionado:**\n\`\`\`\n${selectedText}\n\`\`\``;
    }

    // You could also ask for more description or let them edit later
    try {
        await client.createBacklogItem(config.projectId, {
            type: 'BUG',
            title: title,
            description: description
        });

        vscode.window.showInformationMessage("Bug reportado na Brabrix com sucesso!");
        vscode.commands.executeCommand('brabrix.refresh');
    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao reportar bug: ${e.message}`);
    }
}