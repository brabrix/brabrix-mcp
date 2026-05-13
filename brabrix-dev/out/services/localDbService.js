"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDbService = void 0;
const fs = require("fs");
const path = require("path");
class LocalDbService {
    workspaceConfig;
    constructor(workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
    }
    getDbPath() {
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root)
            return undefined;
        const configFolder = path.join(root.fsPath, '.brabrix');
        if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder, { recursive: true });
        }
        return path.join(configFolder, 'local-db.json');
    }
    readDb() {
        const dbPath = this.getDbPath();
        if (!dbPath || !fs.existsSync(dbPath))
            return undefined;
        try {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
        catch {
            return undefined;
        }
    }
    writeDb(db) {
        const dbPath = this.getDbPath();
        if (dbPath) {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        }
    }
}
exports.LocalDbService = LocalDbService;
//# sourceMappingURL=localDbService.js.map