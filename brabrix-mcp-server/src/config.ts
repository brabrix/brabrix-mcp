import dotenv from 'dotenv';
import { findWorkspaceConfig } from './config/workspaceConfigReader.js';

dotenv.config();

const workspaceInfo = findWorkspaceConfig();

export const config = {
  apiUrl: process.env.BRABRIX_API_URL || 'https://api.brabrix.com',
  token: process.env.BRABRIX_TOKEN,
  projectId: process.env.BRABRIX_PROJECT_ID || workspaceInfo.config?.projectId,
  currentTaskId: process.env.BRABRIX_CURRENT_TASK_ID || workspaceInfo.config?.currentTaskId,
  isDemoMode: !process.env.BRABRIX_TOKEN,
  enableWriteTools: process.env.BRABRIX_MCP_ENABLE_WRITE_TOOLS === 'true',
  workspaceInfo,
};
