"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportWorkflowDocsCommand = exportWorkflowDocsCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
async function exportWorkflowDocsCommand(client, workspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para exportar os documentos.");
        return;
    }
    const config = await workspaceConfig.readConfig();
    if (!config || config.isLocal) {
        vscode.window.showWarningMessage("A exportação de workflow está disponível apenas para projetos na nuvem.");
        return;
    }
    const contextFolder = path.join(root.fsPath, '.brabrix', 'context');
    if (!fs.existsSync(contextFolder)) {
        fs.mkdirSync(contextFolder, { recursive: true });
    }
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Brabrix: Exportando documentos do workflow...",
            cancellable: false
        }, async (progress) => {
            const workflow = await client.getWorkflowState(config.projectId);
            const stepsWithArtifacts = workflow.steps.filter((s) => s.currentArtifactId);
            for (const step of stepsWithArtifacts) {
                progress.report({ message: `Baixando ${step.label}...` });
                const artifact = await client.getWorkflowArtifact(config.projectId, step.currentArtifactId);
                const fileName = `${step.step.toLowerCase().replace(/_/g, '-')}.md`;
                const filePath = path.join(contextFolder, fileName);
                const content = `# ${step.label}\n\n${artifact.content}\n\n--- \n*Exportado da Brabrix em ${new Date().toLocaleString()}*`;
                fs.writeFileSync(filePath, content, 'utf8');
            }
        });
        vscode.window.showInformationMessage("Documentos do workflow exportados para .brabrix/context");
    }
    catch (e) {
        vscode.window.showErrorMessage("Erro ao exportar documentos: " + e.message);
    }
}
//# sourceMappingURL=exportWorkflowDocsCommand.js.map