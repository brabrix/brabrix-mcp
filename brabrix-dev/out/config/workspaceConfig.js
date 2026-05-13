"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceConfig = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class WorkspaceConfig {
    getWorkspaceRoot() {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri;
        }
        return undefined;
    }
    getConfigPath() {
        const root = this.getWorkspaceRoot();
        if (!root)
            return undefined;
        const configFolder = path.join(root.fsPath, '.brabrix');
        if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder, { recursive: true });
        }
        return path.join(configFolder, 'config.json');
    }
    async readConfig() {
        const configPath = this.getConfigPath();
        if (!configPath || !fs.existsSync(configPath)) {
            return undefined;
        }
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(content);
        }
        catch (e) {
            return undefined;
        }
    }
    async writeConfig(config) {
        const configPath = this.getConfigPath();
        if (!configPath) {
            throw new Error("Nenhum workspace aberto.");
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    }
    async clearConfig() {
        const configPath = this.getConfigPath();
        if (configPath && fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
    }
}
exports.WorkspaceConfig = WorkspaceConfig;
//# sourceMappingURL=workspaceConfig.js.map