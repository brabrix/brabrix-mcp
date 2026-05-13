import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { ProjectContextService } from '../services/projectContextService';
import { FinishAndCommitPromptBuilder } from '../services/finishAndCommitPromptBuilder';
import { CliCommandBuilder, CliCommandInput } from '../services/cliCommandBuilder';
import { TerminalRunner } from '../services/terminalRunner';

export async function finishTaskAndCommitCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    itemNode: any
) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para finalizar a tarefa.");
        return;
    }

    const itemId = itemNode?.item?.id;
    if (!itemId) return;

    try {
        const confirm = await vscode.window.showInformationMessage(
            `Finalizar a tarefa '${itemNode.item.title}' e gerar commit?`,
            "Sim", "Não"
        );

        if (confirm !== "Sim") return;

        const config = await workspaceConfig.readConfig();
        if (!config) return;

        // Update status to DONE
        await client.updateBacklogStatus(config.projectId, itemId, 'DONE');
        vscode.window.showInformationMessage("Status atualizado para DONE. Gerando commit...");
        vscode.commands.executeCommand('brabrix.refresh');

        const projectContextService = new ProjectContextService(client, workspaceConfig);
        const context = await projectContextService.getFullTaskContext(itemId);
        if (!context) return;

        const builder = new FinishAndCommitPromptBuilder();
        const promptContent = builder.buildPrompt(context);

        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        
        const promptFile = path.join(promptsFolder, 'finish-commit.md');
        fs.writeFileSync(promptFile, promptContent, 'utf8');

        // Run CLI
        const cliBuilder = new CliCommandBuilder();
        const input: CliCommandInput = {
            cli: 'gemini', // Defaults to gemini or ask
            promptFile,
            workspaceFolder: root.fsPath,
            projectId: config.projectId,
            taskId: itemId,
            taskTitle: 'Finish and Commit'
        };

        const commandToRun = cliBuilder.buildCommand(input);
        const runner = new TerminalRunner();
        runner.run(commandToRun);

    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao finalizar tarefa: ${e.message}`);
    }
}