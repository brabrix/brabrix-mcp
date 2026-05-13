"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrdCommand = generatePrdCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const prdPromptBuilder_1 = require("../services/prdPromptBuilder");
const cliCommandBuilder_1 = require("../services/cliCommandBuilder");
const terminalRunner_1 = require("../services/terminalRunner");
async function generatePrdCommand(client, workspaceConfig) {
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
        const builder = new prdPromptBuilder_1.PrdPromptBuilder();
        const promptContent = builder.buildPrompt(project);
        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        const promptFile = path.join(promptsFolder, 'generate-prd.md');
        fs.writeFileSync(promptFile, promptContent, 'utf8');
        const items = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Selecione qual CLI gerará o PRD'
        });
        if (!selection)
            return;
        const cliBuilder = new cliCommandBuilder_1.CliCommandBuilder();
        const input = {
            cli: selection.description,
            promptFile,
            workspaceFolder: root.fsPath,
            projectId: config.projectId,
            taskTitle: 'Gerar PRD'
        };
        const commandToRun = cliBuilder.buildCommand(input);
        const runner = new terminalRunner_1.TerminalRunner();
        runner.run(commandToRun);
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao gerar PRD: ${e.message}`);
    }
}
//# sourceMappingURL=generatePrdCommand.js.map