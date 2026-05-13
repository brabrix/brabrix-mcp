"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPromptInCliCommand = runPromptInCliCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const cliCommandBuilder_1 = require("../services/cliCommandBuilder");
const terminalRunner_1 = require("../services/terminalRunner");
const generateTaskPromptCommand_1 = require("./generateTaskPromptCommand");
const syncWorkspaceCommand_1 = require("./syncWorkspaceCommand");
async function runPromptInCliCommand(client, workspaceConfig, syncStateService, cliName, itemNode) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para usar a CLI.");
        return;
    }
    const state = syncStateService.readState();
    if (!state?.lastSyncAt && !itemNode) {
        const syncNow = await vscode.window.showWarningMessage("O contexto local pode estar desatualizado. Deseja sincronizar antes?", "Sincronizar", "Continuar sem sincronizar");
        if (syncNow === "Sincronizar") {
            await (0, syncWorkspaceCommand_1.syncWorkspaceCommand)(client, workspaceConfig, syncStateService, () => { }, true);
        }
    }
    let promptFile = path.join(root.fsPath, '.brabrix', 'prompts', 'current-task.md');
    // Check if we need to generate it first or if itemNode is passed
    if (itemNode || !fs.existsSync(promptFile)) {
        let msg = itemNode ? "Gerando prompt para a tarefa selecionada..." : "Nenhum prompt encontrado. Gerando um novo...";
        if (!itemNode && !fs.existsSync(promptFile)) {
            const answer = await vscode.window.showInformationMessage("Nenhum prompt encontrado. Deseja gerar um prompt agora?", "Sim", "Não");
            if (answer !== "Sim")
                return;
        }
        const generatedPath = await (0, generateTaskPromptCommand_1.generateTaskPromptCommand)(client, workspaceConfig, syncStateService, itemNode);
        if (!generatedPath)
            return; // Cancelled or failed
        promptFile = generatedPath;
    }
    // Determine CLI
    let selectedCli = cliName;
    if (!selectedCli) {
        const defaultCli = vscode.workspace.getConfiguration('brabrix.agent').get('defaultCli', 'gemini');
        const items = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' },
            { label: 'Codex CLI', description: 'codex' },
            { label: 'Custom', description: 'custom' }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Selecione qual CLI local executar (Padrão: ${defaultCli})`
        });
        if (!selection)
            return;
        selectedCli = selection.description;
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
    const executionProfile = agentConfig.get('executionProfile', 'plan');
    const showWarning = agentConfig.get('showExecutionProfileWarning', true);
    if (executionProfile === 'safe') {
        vscode.window.showInformationMessage("O perfil de execução está configurado como 'safe'. A execução do CLI foi cancelada. O prompt já foi gerado e salvo para cópia.");
        return;
    }
    const builder = new cliCommandBuilder_1.CliCommandBuilder();
    const input = {
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
    const confirmAction = await vscode.window.showInformationMessage(modalMessage, { modal: true }, "Executar", "Copiar comando");
    if (confirmAction === "Copiar comando") {
        await vscode.env.clipboard.writeText(commandToRun);
        vscode.window.showInformationMessage("Comando copiado para a área de transferência.");
        return;
    }
    if (confirmAction === "Executar") {
        const runner = new terminalRunner_1.TerminalRunner();
        runner.run(commandToRun);
        vscode.window.showInformationMessage("Comando enviado para o terminal. Acompanhe a execução localmente.");
    }
}
//# sourceMappingURL=runPromptInCliCommand.js.map