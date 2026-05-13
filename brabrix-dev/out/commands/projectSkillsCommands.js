"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openProjectSkillsCommand = openProjectSkillsCommand;
exports.openProjectRulesCommand = openProjectRulesCommand;
exports.listProjectSkillsCommand = listProjectSkillsCommand;
exports.openSkillInEditorCommand = openSkillInEditorCommand;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const projectSkillsSyncService_1 = require("../services/projectSkillsSyncService");
const markdown_1 = require("../utils/markdown");
const syncProjectSkillsCommand_1 = require("./syncProjectSkillsCommand");
const PROJECT_SKILLS_FILE = path.join('.brabrix', 'skills', 'project-skills.md');
const PROJECT_RULES_FILE = path.join('.brabrix', 'skills', 'project-rules.md');
async function openProjectSkillsCommand(workspaceConfig) {
    await openWorkspaceFile(workspaceConfig, PROJECT_SKILLS_FILE, 'Sincronize Skills & Rules para gerar o arquivo.');
}
async function openProjectRulesCommand(workspaceConfig) {
    await openWorkspaceFile(workspaceConfig, PROJECT_RULES_FILE, 'Sincronize Skills & Rules para gerar o arquivo.');
}
async function listProjectSkillsCommand(client, workspaceConfig, syncStateService, refreshAll) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage('Abra um workspace para listar Skills & Rules.');
        return;
    }
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage('Nenhum projeto vinculado ao workspace.');
        return;
    }
    let cache = new projectSkillsSyncService_1.ProjectSkillsSyncService(client, workspaceConfig).readCachedSkills();
    if (!cache || cache.projectId !== config.projectId) {
        const syncResult = await (0, syncProjectSkillsCommand_1.syncProjectSkillsCommand)(client, workspaceConfig, syncStateService, refreshAll, false);
        if (!syncResult) {
            vscode.window.showWarningMessage('Não foi possível carregar Skills & Rules do projeto.');
            return;
        }
        cache = new projectSkillsSyncService_1.ProjectSkillsSyncService(client, workspaceConfig).readCachedSkills();
    }
    if (!cache || cache.items.length === 0) {
        vscode.window.showInformationMessage('Nenhuma Skill ou Rule aplicada ao projeto.');
        return;
    }
    const quickPickItems = cache.items.map(item => ({
        label: `[${item.type}] ${item.title}`,
        description: `${originLabel(item)} • ${item.category || 'N/A'}`,
        detail: `${item.required ? 'Obrigatória' : 'Opcional'} • Prioridade ${item.priority ?? '-'}`,
        item
    }));
    const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Selecione uma Skill ou Rule para abrir no editor'
    });
    if (!selected) {
        return;
    }
    const filePath = buildSkillAbsolutePath(root.fsPath, selected.item);
    if (fs.existsSync(filePath)) {
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
        return;
    }
    const fallbackDoc = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: selected.item.content
    });
    await vscode.window.showTextDocument(fallbackDoc);
}
async function openSkillInEditorCommand(node) {
    if (!node?.filePath) {
        vscode.window.showWarningMessage('Skill/Rule sem arquivo local. Sincronize novamente.');
        return;
    }
    if (!fs.existsSync(node.filePath)) {
        vscode.window.showWarningMessage('Arquivo da Skill/Rule não encontrado localmente.');
        return;
    }
    const uri = vscode.Uri.file(node.filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
}
function buildSkillAbsolutePath(workspacePath, item) {
    const folder = item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'public' : 'private';
    const slug = (0, markdown_1.safeFileName)(item.title || item.id);
    const shortId = (0, markdown_1.safeFileName)(item.id).slice(0, 8) || 'item';
    return path.join(workspacePath, '.brabrix', 'skills', folder, `${slug}-${shortId}.md`);
}
async function openWorkspaceFile(workspaceConfig, relativePath, missingMessage) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage('Abra um workspace primeiro.');
        return;
    }
    const absolutePath = path.join(root.fsPath, relativePath);
    if (!fs.existsSync(absolutePath)) {
        vscode.window.showInformationMessage(missingMessage);
        return;
    }
    const uri = vscode.Uri.file(absolutePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
}
function originLabel(item) {
    return item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'Hub Público' : 'Minha Biblioteca';
}
//# sourceMappingURL=projectSkillsCommands.js.map