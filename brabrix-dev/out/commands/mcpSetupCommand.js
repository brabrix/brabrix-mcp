"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMcpConfigCommand = generateMcpConfigCommand;
exports.showMcpSetupCommand = showMcpSetupCommand;
exports.copyGeminiConfigCommand = copyGeminiConfigCommand;
exports.copyClaudeCommandCommand = copyClaudeCommandCommand;
exports.openMcpDocsCommand = openMcpDocsCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
async function generateMcpConfigCommand(workspaceConfig, syncStateService, tokenStore) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showErrorMessage("Não foi possível determinar a raiz do workspace.");
        return;
    }
    const config = await workspaceConfig.readConfig();
    const state = syncStateService.readState();
    const token = await tokenStore.getToken();
    if (!token) {
        vscode.window.showWarningMessage("Token da Brabrix não encontrado. Faça login na extensão primeiro para gerar a configuração completa.");
    }
    if (!config?.projectId) {
        vscode.window.showErrorMessage("Projeto não selecionado. Vincule o workspace a um projeto primeiro.");
        return;
    }
    const projectId = config.projectId;
    const taskId = state?.selectedTaskId || '';
    const workspaceRoot = root.fsPath;
    // Localiza o mcp-server no monorepo
    // Tentamos encontrar o caminho absoluto do servidor MCP
    let mcpServerPath = path.join(workspaceRoot, 'apps', 'brabrix-mcp-server', 'dist', 'index.js');
    if (!fs.existsSync(mcpServerPath)) {
        // Tenta procurar em subpastas caso o root não seja o monorepo root
        const possiblePath = path.join(workspaceRoot, 'micro-saas-core', 'apps', 'brabrix-mcp-server', 'dist', 'index.js');
        if (fs.existsSync(possiblePath)) {
            mcpServerPath = possiblePath;
        }
        else {
            vscode.window.showWarningMessage(`MCP Server não encontrado em: ${mcpServerPath}. Certifique-se de que o build foi executado.`);
        }
    }
    const apiBaseUrl = vscode.workspace.getConfiguration().get('brabrix.apiBaseUrl', 'https://api.brabrix.com');
    const geminiConfig = {
        "mcpServers": {
            "brabrix": {
                "command": "node",
                "args": [mcpServerPath],
                "env": {
                    "BRABRIX_API_URL": apiBaseUrl,
                    "BRABRIX_PROJECT_ID": projectId,
                    "BRABRIX_CURRENT_TASK_ID": taskId,
                    "BRABRIX_TOKEN": token || '',
                    "BRABRIX_WORKSPACE_ROOT": workspaceRoot
                }
            }
        }
    };
    const targetPath = path.join(workspaceRoot, 'gemini-settings.json');
    const geminiHomePath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.gemini', 'settings.json');
    try {
        fs.writeFileSync(targetPath, JSON.stringify(geminiConfig, null, 2), 'utf-8');
        const openFile = "Abrir Arquivo";
        const copyToGemini = "Copiar para ~/.gemini/";
        vscode.window.showInformationMessage(`Arquivo 'gemini-settings.json' gerado com sucesso na raiz do projeto!`, openFile, copyToGemini).then(async (selection) => {
            if (selection === openFile) {
                vscode.workspace.openTextDocument(targetPath).then(doc => vscode.window.showTextDocument(doc));
            }
            else if (selection === copyToGemini) {
                try {
                    const geminiDir = path.dirname(geminiHomePath);
                    if (!fs.existsSync(geminiDir)) {
                        fs.mkdirSync(geminiDir, { recursive: true });
                    }
                    // Se já existe, perguntar se quer mesclar ou substituir? 
                    // Por simplicidade, vamos apenas avisar e sugerir abrir o arquivo.
                    if (fs.existsSync(geminiHomePath)) {
                        const confirm = await vscode.window.showWarningMessage(`O arquivo ${geminiHomePath} já existe. Deseja substituí-lo?`, "Sim", "Não");
                        if (confirm !== "Sim")
                            return;
                    }
                    fs.writeFileSync(geminiHomePath, JSON.stringify(geminiConfig, null, 2), 'utf-8');
                    vscode.window.showInformationMessage(`Configuração instalada com sucesso em ${geminiHomePath}`);
                }
                catch (err) {
                    vscode.window.showErrorMessage(`Erro ao copiar: ${err.message}. Tente mover manualmente.`);
                }
            }
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Erro ao gerar configuração: ${error.message}`);
    }
}
async function showMcpSetupCommand(workspaceConfig, syncStateService) {
    const root = workspaceConfig.getWorkspaceRoot();
    const config = await workspaceConfig.readConfig();
    const state = syncStateService.readState();
    const projectId = config?.projectId || '...';
    const taskId = state?.selectedTaskId || '...';
    const workspaceRoot = root?.fsPath || '...';
    const mcpServerPath = root ? path.join(root.fsPath, 'apps', 'brabrix-mcp-server', 'dist', 'index.js') : '/CAMINHO/PARA/brabrix-mcp-server/dist/index.js';
    const setupMarkdown = `
# Configuração do MCP da Brabrix

O Model Context Protocol (MCP) permite que agentes como Gemini CLI e Claude Code acessem o contexto do seu projeto na Brabrix automaticamente.

## 🚀 Configuração Rápida
Use o botão **"Gerar Configuração MCP"** na barra de ferramentas da Brabrix para criar automaticamente o arquivo com seu Token e caminhos configurados.

## ⚠️ Segurança
O arquivo gerado contém seu Token de acesso. Não o envie para o Git.

## 1. Gemini CLI
Para configurar no Gemini, adicione o seguinte ao seu arquivo \`~/.gemini/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "brabrix": {
      "command": "node",
      "args": ["${mcpServerPath}"],
      "env": {
        "BRABRIX_API_URL": "https://api.brabrix.com",
        "BRABRIX_PROJECT_ID": "${projectId}",
        "BRABRIX_CURRENT_TASK_ID": "${taskId}",
        "BRABRIX_TOKEN": "SEU_TOKEN_AQUI",
        "BRABRIX_WORKSPACE_ROOT": "${workspaceRoot}"
      }
    }
  }
}
\`\`\`

## 2. Claude Code
Para configurar no Claude, execute:

\`\`\`bash
export BRABRIX_TOKEN="SEU_TOKEN_AQUI"
claude mcp add brabrix -- node ${mcpServerPath}
\`\`\`

---

### Prompt Recomendado
Sempre que iniciar uma tarefa com um agente de IA, comece com:
> *"Use as tools da Brabrix para buscar a tarefa atual e a spec de desenvolvimento antes de alterar arquivos."*
    `;
    const doc = await vscode.workspace.openTextDocument({
        content: setupMarkdown,
        language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
}
async function copyGeminiConfigCommand(workspaceConfig, syncStateService, tokenStore) {
    const root = workspaceConfig.getWorkspaceRoot();
    const config = await workspaceConfig.readConfig();
    const state = syncStateService.readState();
    const token = await tokenStore.getToken();
    const projectId = config?.projectId || '...';
    const taskId = state?.selectedTaskId || '...';
    const workspaceRoot = root?.fsPath || '...';
    const mcpServerPath = root ? path.join(root.fsPath, 'apps', 'brabrix-mcp-server', 'dist', 'index.js') : '/CAMINHO/PARA/brabrix-mcp-server/dist/index.js';
    const geminiConfig = {
        mcpServers: {
            brabrix: {
                command: "node",
                args: [mcpServerPath],
                env: {
                    BRABRIX_API_URL: "https://api.brabrix.com",
                    BRABRIX_PROJECT_ID: projectId,
                    BRABRIX_CURRENT_TASK_ID: taskId,
                    BRABRIX_TOKEN: token || 'SEU_TOKEN_AQUI',
                    BRABRIX_WORKSPACE_ROOT: workspaceRoot
                }
            }
        }
    };
    await vscode.env.clipboard.writeText(JSON.stringify(geminiConfig, null, 2));
    vscode.window.showInformationMessage("Configuração do Gemini copiada para a área de transferência.");
}
async function copyClaudeCommandCommand(workspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    const mcpServerPath = root ? path.join(root.fsPath, 'apps', 'brabrix-mcp-server', 'dist', 'index.js') : '/CAMINHO/PARA/brabrix-mcp-server/dist/index.js';
    const claudeCommand = `claude mcp add brabrix -- node ${mcpServerPath}`;
    await vscode.env.clipboard.writeText(claudeCommand);
    vscode.window.showInformationMessage("Comando do Claude copiado para a área de transferência.");
}
async function openMcpDocsCommand() {
    vscode.env.openExternal(vscode.Uri.parse('https://github.com/brabrix/brabrix-mcp-server#readme'));
}
//# sourceMappingURL=mcpSetupCommand.js.map