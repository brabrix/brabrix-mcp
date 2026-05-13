import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { ProjectContextService } from '../services/projectContextService';
import { TaskPromptBuilder } from '../services/taskPromptBuilder';
import { SyncStateService } from '../services/syncStateService';
import { syncWorkspaceCommand } from './syncWorkspaceCommand';

export async function generateTaskPromptCommand(
    client: BrabrixClient,
    workspaceConfig: WorkspaceConfig,
    syncStateService: SyncStateService,
    itemNode?: any
) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace para gerar o prompt.");
        return undefined;
    }

    const projectContextService = new ProjectContextService(client, workspaceConfig);
    const taskPromptBuilder = new TaskPromptBuilder(workspaceConfig);

    let itemId = itemNode?.item?.id;

    if (!itemId) {
        const state = syncStateService.readState();
        if (state?.selectedTaskId) {
            itemId = state.selectedTaskId;
        }
    }

    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage("Nenhum projeto selecionado.");
        return undefined;
    }

    const state = syncStateService.readState();
    if (!state?.lastSyncAt) {
        const syncNow = await vscode.window.showInformationMessage(
            "O contexto local não está sincronizado. Deseja sincronizar antes de gerar o prompt?",
            "Sincronizar", "Continuar sem sincronizar"
        );
        if (syncNow === "Sincronizar") {
            await syncWorkspaceCommand(client, workspaceConfig, syncStateService, () => {}, true);
        }
    }

    if (!itemId) {
        // Quick pick
        try {
            const backlogItems = await client.listBacklog(config.projectId);
            const executableItems = backlogItems.filter(i => 
                ['USER_STORY', 'TASK', 'BUG', 'IMPROVEMENT', 'DOCUMENTATION'].includes(i.type)
            );

            if (executableItems.length === 0) {
                vscode.window.showInformationMessage("Nenhum item executável encontrado no backlog.");
                return undefined;
            }

            const items = executableItems.map(i => ({
                label: `[${i.type}] ${i.title}`,
                description: i.status,
                detail: i.priority ? `Prioridade: ${i.priority}` : undefined,
                item: i
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Selecione uma tarefa para gerar o prompt'
            });

            if (!selected) {
                return undefined; // Cancelled
            }
            itemId = selected.item.id;
            
            syncStateService.updateState({
                selectedTaskId: itemId,
                selectedTaskTitle: selected.item.title
            });
            vscode.commands.executeCommand('brabrix.refresh');

        } catch (e: any) {
            vscode.window.showErrorMessage(`Erro ao carregar backlog: ${e.message}`);
            return undefined;
        }
    }

    try {
        const fullContext = await projectContextService.getFullTaskContext(itemId);
        if (!fullContext) return undefined;

        const executionProfile = vscode.workspace.getConfiguration('brabrix.agent').get<string>('executionProfile', 'plan');
        const promptContent = taskPromptBuilder.buildTaskPrompt(fullContext, executionProfile);

        // Save file
        const promptsFolder = path.join(root.fsPath, '.brabrix', 'prompts');
        if (!fs.existsSync(promptsFolder)) {
            fs.mkdirSync(promptsFolder, { recursive: true });
        }
        
        const filePath = path.join(promptsFolder, 'current-task.md');
        fs.writeFileSync(filePath, promptContent, 'utf8');

        // Open in editor
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);

        const action = await vscode.window.showInformationMessage(
            "Prompt da tarefa gerado com sucesso.",
            "Copiar Prompt"
        );

        if (action === "Copiar Prompt") {
            await vscode.env.clipboard.writeText(promptContent);
            vscode.window.showInformationMessage("Prompt copiado para a área de transferência.");
        }

        return filePath;

    } catch (e: any) {
        vscode.window.showErrorMessage(`Erro ao gerar prompt: ${e.message}`);
        return undefined;
    }
}

export async function copyTaskPromptCommand(workspaceConfig: WorkspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) return;

    const filePath = path.join(root.fsPath, '.brabrix', 'prompts', 'current-task.md');
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        await vscode.env.clipboard.writeText(content);
        vscode.window.showInformationMessage("Prompt copiado para a área de transferência.");
    } else {
        vscode.window.showWarningMessage("Nenhum prompt gerado encontrado. Gere um prompt primeiro.");
    }
}

export async function openTaskPromptCommand(workspaceConfig: WorkspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) return;

    const filePath = path.join(root.fsPath, '.brabrix', 'prompts', 'current-task.md');
    if (fs.existsSync(filePath)) {
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    } else {
        vscode.window.showWarningMessage("Nenhum prompt gerado encontrado.");
    }
}