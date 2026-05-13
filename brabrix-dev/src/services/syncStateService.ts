import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceConfig } from '../config/workspaceConfig';

export interface SyncState {
    lastSyncAt?: string;
    lastSkillsSyncAt?: string;
    lastProjectUpdatedAt?: string;
    lastBacklogUpdatedAt?: string;
    lastWorkflowUpdatedAt?: string;
    skillsCount?: number;
    rulesCount?: number;
    generatedFiles?: string[];
    selectedTaskId?: string;
    selectedTaskTitle?: string;
}

export class SyncStateService {
    constructor(private workspaceConfig: WorkspaceConfig) {}

    private getStatePath(): string | undefined {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) return undefined;
        const configFolder = path.join(root.fsPath, '.brabrix');
        if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder, { recursive: true });
        }
        return path.join(configFolder, 'sync-state.json');
    }

    readState(): SyncState | undefined {
        const statePath = this.getStatePath();
        if (!statePath || !fs.existsSync(statePath)) return undefined;
        try {
            return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        } catch {
            return undefined;
        }
    }

    writeState(state: SyncState): void {
        const statePath = this.getStatePath();
        if (statePath) {
            fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
        }
    }

    updateState(partial: Partial<SyncState>): void {
        const currentState = this.readState() || {};
        this.writeState({ ...currentState, ...partial });
    }

    clearState(): void {
        const statePath = this.getStatePath();
        if (statePath && fs.existsSync(statePath)) {
            fs.unlinkSync(statePath);
        }
    }
}
