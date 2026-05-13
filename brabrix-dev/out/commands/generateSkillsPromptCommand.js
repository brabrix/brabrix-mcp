"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSkillsPromptCommand = generateSkillsPromptCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const skillsPromptBuilder_1 = require("../services/skillsPromptBuilder");
async function generateSkillsPromptCommand(client, workspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para gerar o prompt de skills.");
        return undefined;
    }
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Nenhum projeto selecionado. Selecione um projeto primeiro.");
        return undefined;
    }
    try {
        const project = await client.getProject(config.projectId);
        let exportContext = undefined;
        try {
            exportContext = await client.exportProjectContext(config.projectId);
        }
        catch (e) {
            console.warn("Não foi possível carregar o export context.", e);
        }
        const executionProfile = vscode.workspace.getConfiguration('brabrix.agent').get('executionProfile', 'plan');
        const builder = new skillsPromptBuilder_1.SkillsPromptBuilder();
        const promptContent = builder.buildSkillsPrompt(project, exportContext, executionProfile);
        // Save file
        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        const filePath = path.join(promptsFolder, 'generate-skills.md');
        fs.writeFileSync(filePath, promptContent, 'utf8');
        // Open in editor
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
        const action = await vscode.window.showInformationMessage("Prompt de Skills gerado com sucesso.", "Copiar Prompt");
        if (action === "Copiar Prompt") {
            await vscode.env.clipboard.writeText(promptContent);
            vscode.window.showInformationMessage("Prompt copiado para a área de transferência.");
        }
        return filePath;
    }
    catch (e) {
        vscode.window.showErrorMessage(`Erro ao gerar prompt de skills: ${e.message}`);
        return undefined;
    }
}
//# sourceMappingURL=generateSkillsPromptCommand.js.map