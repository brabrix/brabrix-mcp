"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncStateService = void 0;
const fs = require("fs");
const path = require("path");
class SyncStateService {
    workspaceConfig;
    constructor(workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
    }
    getStatePath() {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root)
            return undefined;
        const configFolder = path.join(root.fsPath, '.brabrix');
        if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder, { recursive: true });
        }
        return path.join(configFolder, 'sync-state.json');
    }
    readState() {
        const statePath = this.getStatePath();
        if (!statePath || !fs.existsSync(statePath))
            return undefined;
        try {
            return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        }
        catch {
            return undefined;
        }
    }
    writeState(state) {
        const statePath = this.getStatePath();
        if (statePath) {
            fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
        }
    }
    updateState(partial) {
        const currentState = this.readState() || {};
        this.writeState({ ...currentState, ...partial });
    }
    clearState() {
        const statePath = this.getStatePath();
        if (statePath && fs.existsSync(statePath)) {
            fs.unlinkSync(statePath);
        }
    }
}
exports.SyncStateService = SyncStateService;
//# sourceMappingURL=syncStateService.js.map