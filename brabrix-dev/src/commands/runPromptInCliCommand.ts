import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { CliCommandBuilder, CliCommandInput } from '../services/cliCommandBuilder';
import { TerminalRunner } from '../services/terminalRunner';
import { generateTaskPromptCommand } from './generateTaskPromptCommand';
import { SyncStateService } from '../services/syncStateService';
import { syncWorkspaceCommand } from './syncWorkspaceCommand';

export async function runPromptInCliCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    cliName?: 'gemini' | 'claude' | 'codex' | 'custom',
    itemNode?: any
) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para usar a CLI.");
        return;
    }

    const state = syncStateService.readState();
    if (!state?.lastSyncAt && !itemNode) {
        const syncNow = await vscode.window.showWarningMessage(
            "O contexto local pode estar desatualizado. Deseja sincronizar antes?",
            "Sincronizar", "Continuar sem sincronizar"
        );
        if (syncNow === "Sincronizar") {
            await syncWorkspaceCommand(client, workspaceConfig, syncStateService, () => {}, true);
        }
    }

    let promptFile = path.join(root.fsPath, '.brabrix', 'prompts', 'current-task.md');
    
    // Check if we need to generate it first or if itemNode is passed
    if (itemNode || !fs.existsSync(promptFile)) {
        let msg = itemNode ? "Gerando prompt para a tarefa selecionada..." : "Nenhum prompt encontrado. Gerando um novo...";
        if (!itemNode && !fs.existsSync(promptFile)) {
            const answer = await vscode.window.showInformationMessage(
                "Nenhum prompt encontrado. Deseja gerar um prompt agora?",
                "Sim", "Não"
            );
            if (answer !== "Sim") return;
        }

        const generatedPath = await generateTaskPromptCommand(client, workspaceConfig, syncStateService, itemNode);
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
    
    // Determine taskId
    let taskId = itemNode?.item?.id;
    let taskTitle = itemNode?.item?.title;
    
    if (!taskId && state?.selectedTaskId) {
        taskId = state.selectedTaskId;
        taskTitle = state.selectedTaskTitle;
    }

    const agentConfig = vscode.workspace.getConfiguration('brabrix.agent');
    const executionProfile = agentConfig.get<string>('executionProfile', 'plan');
    const showWarning = agentConfig.get<boolean>('showExecutionProfileWarning', true);

    if (executionProfile === 'safe') {
        vscode.window.showInformationMessage("O perfil de execução está configurado como 'safe'. A execução do CLI foi cancelada. O prompt já foi gerado e salvo para cópia.");
        return;
    }

    const builder = new CliCommandBuilder();
    const input: CliCommandInput = {
        cli: selectedCli,
        promptFile,
        workspaceFolder: root.fsPath,
        projectId,
        taskId,
        taskTitle
    };

    const commandToRun = builder.buildCommand(input);

    // Confirmation dialog
    let modalMessage = `A Brabrix vai enviar o comando abaixo para o terminal integrado do VS Code. A execução ocorre localmente na sua máquina.\n\nComando:\n${commandToRun}`;
    
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
        vscode.window.showInformationMessage("Comando enviado para o terminal. Acompanhe a execução localmente.");
    }
}