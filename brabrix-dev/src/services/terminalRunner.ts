import * as vscode from 'vscode';

export class TerminalRunner {
    private terminalName: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('brabrix.agent');
        this.terminalName = config.get<string>('terminalName') || 'Brabrix Dev Agent';
    }

    private getOrCreateTerminal(): vscode.Terminal {
        const existing = vscode.window.terminals.find(t => t.name === this.terminalName);
        if (existing) {
            return existing;
        }
        return vscode.window.createTerminal(this.terminalName);
    }

    run(command: string): void {
        const terminal = this.getOrCreateTerminal();
        terminal.show(true);
        terminal.sendText(command);
    }
}