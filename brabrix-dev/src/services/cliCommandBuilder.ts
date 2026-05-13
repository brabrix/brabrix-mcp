import * as vscode from 'vscode';
import * as path from 'path';

export interface CliCommandInput {
    cli: 'gemini' | 'claude' | 'codex' | 'custom';
    promptFile: string;
    workspaceFolder: string;
    projectId?: string;
    taskId?: string;
    taskTitle?: string;
}

export class CliCommandBuilder {
    buildCommand(input: CliCommandInput): string {
        const config = vscode.workspace.getConfiguration('brabrix.agent');
        let commandTemplate = '';

        switch (input.cli) {
            case 'gemini':
                commandTemplate = config.get<string>('geminiCommand') || 'gemini < "{promptFile}"';
                break;
            case 'claude':
                commandTemplate = config.get<string>('claudeCommand') || 'claude < "{promptFile}"';
                break;
            case 'codex':
                commandTemplate = config.get<string>('codexCommand') || 'codex < "{promptFile}"';
                break;
            case 'custom':
                commandTemplate = config.get<string>('customCommand') || '{command} < "{promptFile}"';
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