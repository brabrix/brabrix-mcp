import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { ProjectContextService } from '../services/projectContextService';
import { CodeReviewPromptBuilder } from '../services/codeReviewPromptBuilder';
import { CliCommandBuilder, CliCommandInput } from '../services/cliCommandBuilder';
import { TerminalRunner } from '../services/terminalRunner';

export async function codeReviewTaskCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    itemNode: any
) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para fazer o code review.");
        return;
    }

    const itemId = itemNode?.item?.id;
    if (!itemId) return;

    try {
        const projectContextService = new ProjectContextService(client, workspaceConfig);
        const context = await projectContextService.getFullTaskContext(itemId);
        if (!context) return;

        const builder = new CodeReviewPromptBuilder();
        const promptContent = builder.buildPrompt(context);

        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        
        const promptFile = path.join(promptsFolder, 'code-review.md');
        fs.writeFileSync(promptFile, promptContent, 'utf8');

        // Ask which CLI to run
        const items: vscode.QuickPickItem[] = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' }
        ];

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Selecione qual CLI fará o Code Review'
        });

        if (!selection) return;

        const config = await workspaceConfig.readConfig();
        const cliBuilder = new CliCommandBuilder();
        const input: CliCommandInput = {
            cli: selection.description as any,
            promptFile,
            workspaceFolder: root.fsPath,
            projectId: config?.projectId,
            taskId: itemId,
            taskTitle: 'Code Review'
        };

        const commandToRun = cliBuilder.buildCommand(input);
        const runner = new TerminalRunner();
        runner.run(commandToRun);

    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao gerar code review: ${e.message}`);
    }
}