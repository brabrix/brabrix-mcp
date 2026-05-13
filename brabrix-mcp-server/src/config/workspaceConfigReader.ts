import fs from 'fs';
import path from 'path';

export interface WorkspaceConfig {
  projectId?: string;
  projectName?: string;
  tenantName?: string;
  currentTaskId?: string;
  lastSyncAt?: string;
  brabrixWebUrl?: string;
}

export interface WorkspaceConfigResult {
  workspaceRoot: string;
  hasConfig: boolean;
  config?: WorkspaceConfig;
  configPath?: string;
}

export function findWorkspaceConfig(): WorkspaceConfigResult {
  const startDir = process.env.BRABRIX_WORKSPACE_ROOT || process.cwd();
  let currentDir = startDir;
  const maxLevels = 5;

  for (let i = 0; i < maxLevels; i++) {
    const configPath = path.join(currentDir, '.brabrix', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as WorkspaceConfig;
        return {
          workspaceRoot: currentDir,
          hasConfig: true,
          config,
          configPath,
        };
      } catch (error) {
        console.error(`Erro ao ler ${configPath}:`, error);
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached root
    currentDir = parentDir;
  }

  return {
    workspaceRoot: startDir,
    hasConfig: false,
  };
}
