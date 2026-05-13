"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSkillsInCliCommand = runSkillsInCliCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const cliCommandBuilder_1 = require("../services/cliCommandBuilder");
const terminalRunner_1 = require("../services/terminalRunner");
const generateSkillsPromptCommand_1 = require("./generateSkillsPromptCommand");
async function runSkillsInCliCommand(client, workspaceConfig, cliName) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para usar a CLI.");
        return;
    }
    let promptFile = path.join(root.fsPath, '.brabrix', 'prompts', 'generate-skills.md');
    // Check if we need to generate it first
    if (!fs.existsSync(promptFile)) {
        const answer = await vscode.window.showInformationMessage("Prompt de Skills não encontrado. Deseja gerá-lo agora?", "Sim", "Não");
        if (answer !== "Sim")
            return;
        const generatedPath = await (0, generateSkillsPromptCommand_1.generateSkillsPromptCommand)(client, workspaceConfig);
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
    const agentConfig = vscode.workspace.getConfiguration('brabrix.agent');
    const executionProfile = agentConfig.get('executionProfile', 'plan');
    const showWarning = agentConfig.get('showExecutionProfileWarning', true);
    if (executionProfile === 'safe') {
        vscode.window.showInformationMessage("O perfil de execução está configurado como 'safe'. A execução do CLI foi cancelada. O prompt de skills já foi gerado e salvo para cópia.");
        return;
    }
    const builder = new cliCommandBuilder_1.CliCommandBuilder();
    const input = {
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
    const confirmAction = await vscode.window.showInformationMessage(modalMessage, { modal: true }, "Executar", "Copiar comando");
    if (confirmAction === "Copiar comando") {
        await vscode.env.clipboard.writeText(commandToRun);
        vscode.window.showInformationMessage("Comando copiado para a área de transferência.");
        return;
    }
    if (confirmAction === "Executar") {
        const runner = new terminalRunner_1.TerminalRunner();
        runner.run(commandToRun);
        vscode.window.showInformationMessage("Comando enviado para o terminal. O agente iniciará a geração das skills.");
    }
}
//# sourceMappingURL=runSkillsInCliCommand.js.map