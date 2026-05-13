"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.breakdownStoryCommand = breakdownStoryCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const projectContextService_1 = require("../services/projectContextService");
const breakdownPromptBuilder_1 = require("../services/breakdownPromptBuilder");
const cliCommandBuilder_1 = require("../services/cliCommandBuilder");
const terminalRunner_1 = require("../services/terminalRunner");
async function breakdownStoryCommand(client, workspaceConfig, itemNode) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para gerar o prompt.");
        return;
    }
    const itemId = itemNode?.item?.id;
    if (!itemId)
        return;
    try {
        const projectContextService = new projectContextService_1.ProjectContextService(client, workspaceConfig);
        const context = await projectContextService.getFullTaskContext(itemId);
        if (!context)
            return;
        const builder = new breakdownPromptBuilder_1.BreakdownPromptBuilder();
        const promptContent = builder.buildPrompt(context);
        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        const promptFile = path.join(promptsFolder, 'breakdown-story.md');
        fs.writeFileSync(promptFile, promptContent, 'utf8');
        // Ask which CLI to run
        const defaultCli = vscode.workspace.getConfiguration('brabrix.agent').get('defaultCli', 'gemini');
        const items = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' },
            { label: 'Codex CLI', description: 'codex' }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Selecione qual CLI usará para quebrar a história (Padrão: ${defaultCli})`
        });
        if (!selection)
            return;
        const config = await workspaceConfig.readConfig();
        const cliBuilder = new cliCommandBuilder_1.CliCommandBuilder();
        const input = {
            cli: selection.description,
            promptFile,
            workspaceFolder: root.fsPath,
            projectId: config?.projectId,
            taskId: itemId,
            taskTitle: 'Breakdown Story'
        };
        const commandToRun = cliBuilder.buildCommand(input);
        const runner = new terminalRunner_1.TerminalRunner();
        runner.run(commandToRun);
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao realizar breakdown: ${e.message}`);
    }
}
//# sourceMappingURL=breakdownStoryCommand.js.map