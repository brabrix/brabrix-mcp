import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { PrdPromptBuilder } from '../services/prdPromptBuilder';
import { CliCommandBuilder, CliCommandInput } from '../services/cliCommandBuilder';
import { TerminalRunner } from '../services/terminalRunner';

export async function generatePrdCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig
) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para gerar o PRD.");
        return;
    }

    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Nenhum projeto selecionado.");
        return;
    }

    try {
        const project = await client.getProject(config.projectId);
        const builder = new PrdPromptBuilder();
        const promptContent = builder.buildPrompt(project);

        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        
        const promptFile = path.join(promptsFolder, 'generate-prd.md');
        fs.writeFileSync(promptFile, promptContent, 'utf8');

        const items: vscode.QuickPickItem[] = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' }
        ];

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Selecione qual CLI gerará o PRD'
        });

        if (!selection) return;

        const cliBuilder = new CliCommandBuilder();
        const input: CliCommandInput = {
            cli: selection.description as any,
            promptFile,
            workspaceFolder: root.fsPath,
            projectId: config.projectId,
            taskTitle: 'Gerar PRD'
        };

        const commandToRun = cliBuilder.buildCommand(input);
        const runner = new TerminalRunner();
        runner.run(commandToRun);

    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao gerar PRD: ${e.message}`);
    }
}