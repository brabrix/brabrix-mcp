import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface WorkspaceBrabrixConfig {
    projectId: string;
    projectName: string;
    tenantId?: string;
    tenantName?: string;
    lastSyncAt?: string;
    isLocal?: boolean;
}

export class WorkspaceConfig {
    getWorkspaceRoot(): vscode.Uri | undefined {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri;
        }
        return undefined;
    }

    private getConfigPath(): string | undefined {
        const root = this.getWorkspaceRoot();
        if (!root) return undefined;
        const configFolder = path.join(root.fsPath, '.brabrix');
        if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder, { recursive: true });
        }
        return path.join(configFolder, 'config.json');
    }

    async readConfig(): Promise<WorkspaceBrabrixConfig | undefined> {
        const configPath = this.getConfigPath();
        if (!configPath || !fs.existsSync(configPath)) {
            return undefined;
        }
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(content) as WorkspaceBrabrixConfig;
        } catch (e) {
            return undefined;
        }
    }

    async writeConfig(config: WorkspaceBrabrixConfig): Promise<void> {
        const configPath = this.getConfigPath();
        if (!configPath) {
            throw new Error("Nenhum workspace aberto.");
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    }

    async clearConfig(): Promise<void> {
        const configPath = this.getConfigPath();
        if (configPath && fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
    }
}