import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';

export async function selectProjectCommand(
    client: BrabrixClient, 
    workspaceConfig: WorkspaceConfig, 
    refreshAll: () => void
) {
    try {
        let currentConfig = await workspaceConfig.readConfig();
        let tenantId = currentConfig?.tenantId;
        let tenantName = currentConfig?.tenantName;

        // Se não tem tenant selecionado, buscar e pedir para selecionar
        if (!tenantId) {
            const memberships = await client.listMemberships();
            if (memberships.length === 0) {
                vscode.window.showErrorMessage("Nenhuma licença Brabrix encontrada para seu usuário.");
                return;
            }

            if (memberships.length === 1) {
                tenantId = memberships[0].tenantId;
                tenantName = memberships[0].tenantName;
            } else {
                const tenantItems = memberships.map(m => ({
                    label: m.tenantName,
                    description: m.roleCode,
                    detail: m.tenantSlug,
                    membership: m
                }));

                const selectedTenant = await vscode.window.showQuickPick(tenantItems, {
                    placeHolder: 'Selecione a licença Brabrix'
                });

                if (!selectedTenant) return;
                tenantId = selectedTenant.membership.tenantId;
                tenantName = selectedTenant.membership.tenantName;
            }

            // Salva o tenant temporariamente no config para que as próximas chamadas usem o header correto
            await workspaceConfig.writeConfig({
                ...(currentConfig || { projectId: '', projectName: '' }),
                tenantId,
                tenantName
            });
        }

        const projects = await client.listProjects();
        if (projects.length === 0) {
            vscode.window.showInformationMessage(`Nenhum projeto encontrado para a licença ${tenantName}.`);
            return;
        }

        const items = projects.map(p => ({
            label: p.name,
            description: p.status,
            detail: p.customerName ? `Cliente: ${p.customerName}` : undefined,
            project: p
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Selecione um projeto de ${tenantName} para vincular ao workspace`
        });

        if (selected) {
            await workspaceConfig.writeConfig({
                projectId: selected.project.id,
                projectName: selected.project.name,
                tenantId,
                tenantName,
                lastSyncAt: new Date().toISOString()
            });
            vscode.window.showInformationMessage("Projeto Brabrix vinculado ao workspace.");
            refreshAll();
        }
    } catch (e: any) {
        vscode.window.showErrorMessage("Erro ao buscar projetos: " + e.message);
    }
}