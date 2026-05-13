"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliCommandBuilder = void 0;
const vscode = require("vscode");
class CliCommandBuilder {
    buildCommand(input) {
        const config = vscode.workspace.getConfiguration('brabrix.agent');
        let commandTemplate = '';
        switch (input.cli) {
            case 'gemini':
                commandTemplate = config.get('geminiCommand') || 'gemini < "{promptFile}"';
                break;
            case 'claude':
                commandTemplate = config.get('claudeCommand') || 'claude < "{promptFile}"';
                break;
            case 'codex':
                commandTemplate = config.get('codexCommand') || 'codex < "{promptFile}"';
                break;
            case 'custom':
                commandTemplate = config.get('customCommand') || '{command} < "{promptFile}"';
                break;
        }
        let command = commandTemplate
            .replace(/{promptFile}/g, input.promptFile)
            .replace(/{workspaceFolder}/g, input.workspaceFolder)
            .replace(/{projectId}/g, input.projectId || '')
            .replace(/{taskId}/g, input.taskId || '')
            .replace(/{taskTitle}/g, input.taskTitle || '');
        return command;
    }
}
exports.CliCommandBuilder = CliCommandBuilder;
//# sourceMappingURL=cliCommandBuilder.js.map