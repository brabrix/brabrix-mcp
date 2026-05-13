import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { CliCommandBuilder, CliCommandInput } from '../services/cliCommandBuilder';
import { TerminalRunner } from '../services/terminalRunner';
import { generateSkillsPromptCommand } from './generateSkillsPromptCommand';

export async function runSkillsInCliCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    cliName?: 'gemini' | 'claude' | 'codex' | 'custom'
) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para usar a CLI.");
        return;
    }

    let promptFile = path.join(root.fsPath, '.brabrix', 'prompts', 'generate-skills.md');
    
    // Check if we need to generate it first
    if (!fs.existsSync(promptFile)) {
        const answer = await vscode.window.showInformationMessage(
            "Prompt de Skills não encontrado. Deseja gerá-lo agora?",
            "Sim", "Não"
        );
        if (answer !== "Sim") return;

        const generatedPath = await generateSkillsPromptCommand(client, workspaceConfig);
        if (!generatedPath) return; // Cancelled or failed
        promptFile = generatedPath;
    }

    // Determine CLI
    let selectedCli = cliName;
    if (!selectedCli) {
        const defaultCli = vscode.workspace.getConfiguration('brabrix.agent').get<string>('defaultCli', 'gemini');
        
        const items: vscode.QuickPickItem[] = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' },
            { label: 'Codex CLI', description: 'codex' },
            { label: 'Custom', description: 'custom' }
        ];

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Selecione qual CLI local executar (Padrão: ${defaultCli})`
        });

        if (!selection) return;
        selectedCli = selection.description as 'gemini' | 'claude' | 'codex' | 'custom';
    }

    const config = await workspaceConfig.readConfig();
    const projectId = config?.projectId;

    const agentConfig = vscode.workspace.getConfiguration('brabrix.agent');
    const executionProfile = agentConfig.get<string>('executionProfile', 'plan');
    const showWarning = agentConfig.get<boolean>('showExecutionProfileWarning', true);

    if (executionProfile === 'safe') {
        vscode.window.showInformationMessage("O perfil de execução está configurado como 'safe'. A execução do CLI foi cancelada. O prompt de skills já foi gerado e salvo para cópia.");
        return;
    }

    const builder = new CliCommandBuilder();
    const input: CliCommandInput = {
        cli: selectedCli,
        promptFile,
        workspaceFolder: root.fsPath,
        projectId,
        taskTitle: 'Gerar Skills'
    };

    const commandToRun = builder.buildCommand(input);

    // Confirmation dialog
    let modalMessage = `A Brabrix vai enviar o comando abaixo para o terminal integrado do VS Code para GERAR AS SKILLS localmente.\n\nComando:\n${commandToRun}`;
    
    if (showWarning) {
        modalMessage = `[Perfil: ${executionProfile.toUpperCase()}]\n${modalMessage}`;
    }
    
    const confirmAction = await vscode.window.showInformationMessage(
        modalMessage,
        { modal: true },
        "Executar", "Copiar comando"
    );

    if (confirmAction === "Copiar comando") {
        await vscode.env.clipboard.writeText(commandToRun);
        vscode.window.showInformationMessage("Comando copiado para a área de transferência.");
        return;
    }

    if (confirmAction === "Executar") {
        const runner = new TerminalRunner();
        runner.run(commandToRun);
        vscode.window.showInformationMessage("Comando enviado para o terminal. O agente iniciará a geração das skills.");
    }
}