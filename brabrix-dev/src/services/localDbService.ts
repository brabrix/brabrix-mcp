import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BrabrixProject } from '../models/brabrixProject';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { BrabrixExport } from '../models/brabrixExport';

export interface LocalDb {
    project: BrabrixProject;
    backlog: BrabrixBacklogItem[];
    exportContext?: BrabrixExport;
}

export class LocalDbService {
    constructor(private workspaceConfig: WorkspaceConfig) {}

    private getDbPath(): string | undefined {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root) return undefined;
        const configFolder = path.join(root.fsPath, '.brabrix');
        if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder, { recursive: true });
        }
        return path.join(configFolder, 'local-db.json');
    }

    readDb(): LocalDb | undefined {
        const dbPath = this.getDbPath();
        if (!dbPath || !fs.existsSync(dbPath)) return undefined;
        try {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch {
            return undefined;
        }
    }

    writeDb(db: LocalDb): void {
        const dbPath = this.getDbPath();
        if (dbPath) {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        }
    }
}