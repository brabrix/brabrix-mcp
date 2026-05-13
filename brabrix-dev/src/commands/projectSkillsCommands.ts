import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { SyncStateService } from '../services/syncStateService';
import { BrabrixProjectSkill } from '../models/brabrixProjectSkill';
import { ProjectSkillsSyncService } from '../services/projectSkillsSyncService';
import { safeFileName } from '../utils/markdown';
import { syncProjectSkillsCommand } from './syncProjectSkillsCommand';

const PROJECT_SKILLS_FILE = path.join('.brabrix', 'skills', 'project-skills.md');
const PROJECT_RULES_FILE = path.join('.brabrix', 'skills', 'project-rules.md');

interface SkillTreeNodeLike {
    item?: BrabrixProjectSkill;
    filePath?: string;
}

export async function openProjectSkillsCommand(workspaceConfig: WorkspaceConfig): Promise<void> {
    await openWorkspaceFile(workspaceConfig, PROJECT_SKILLS_FILE, 'Sincronize Skills & Rules para gerar o arquivo.');
}

export async function openProjectRulesCommand(workspaceConfig: WorkspaceConfig): Promise<void> {
    await openWorkspaceFile(workspaceConfig, PROJECT_RULES_FILE, 'Sincronize Skills & Rules para gerar o arquivo.');
}

export async function listProjectSkillsCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    refreshAll: () => void
): Promise<void> {
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

    let cache = new ProjectSkillsSyncService(client, workspaceConfig).readCachedSkills();
    if (!cache || cache.projectId !== config.projectId) {
        const syncResult = await syncProjectSkillsCommand(client, workspaceConfig, syncStateService, refreshAll, false);
        if (!syncResult) {
            vscode.window.showWarningMessage('Não foi possível carregar Skills & Rules do projeto.');
            return;
        }
        cache = new ProjectSkillsSyncService(client, workspaceConfig).readCachedSkills();
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

export async function openSkillInEditorCommand(node?: SkillTreeNodeLike): Promise<void> {
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

function buildSkillAbsolutePath(workspacePath: string, item: BrabrixProjectSkill): string {
    const folder = item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'public' : 'private';
    const slug = safeFileName(item.title || item.id);
    const shortId = safeFileName(item.id).slice(0, 8) || 'item';
    return path.join(workspacePath, '.brabrix', 'skills', folder, `${slug}-${shortId}.md`);
}

async function openWorkspaceFile(workspaceConfig: WorkspaceConfig, relativePath: string, missingMessage: string): Promise<void> {
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

function originLabel(item: BrabrixProjectSkill): string {
    return item.origin === 'PUBLIC' || item.scope === 'PLATFORM' ? 'Hub Público' : 'Minha Biblioteca';
}
