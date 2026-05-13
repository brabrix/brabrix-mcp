"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeReviewTaskCommand = codeReviewTaskCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const projectContextService_1 = require("../services/projectContextService");
const codeReviewPromptBuilder_1 = require("../services/codeReviewPromptBuilder");
const cliCommandBuilder_1 = require("../services/cliCommandBuilder");
const terminalRunner_1 = require("../services/terminalRunner");
async function codeReviewTaskCommand(client, workspaceConfig, itemNode) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para fazer o code review.");
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
        const builder = new codeReviewPromptBuilder_1.CodeReviewPromptBuilder();
        const promptContent = builder.buildPrompt(context);
        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        const promptFile = path.join(promptsFolder, 'code-review.md');
        fs.writeFileSync(promptFile, promptContent, 'utf8');
        // Ask which CLI to run
        const items = [
            { label: 'Gemini CLI', description: 'gemini' },
            { label: 'Claude Code', description: 'claude' }
        ];
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Selecione qual CLI fará o Code Review'
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
            taskTitle: 'Code Review'
        };
        const commandToRun = cliBuilder.buildCommand(input);
        const runner = new terminalRunner_1.TerminalRunner();
        runner.run(commandToRun);
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao gerar code review: ${e.message}`);
    }
}
//# sourceMappingURL=codeReviewTaskCommand.js.map