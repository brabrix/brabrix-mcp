import * as vscode from 'vscode';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';

export async function showItemDetailsCommand(client: BrabrixClient, workspaceConfig: WorkspaceConfig, node?: any) {
    if (!node || !node.item) {
        vscode.window.showInformationMessage("Nenhum item selecionado.");
        return;
    }

    const item: BrabrixBacklogItem = node.item;
    const config = await workspaceConfig.readConfig();
    
    let spec: any = null;
    if (config) {
        try {
            spec = await client.getLatestSpec(config.projectId, item.id);
        } catch (e) {
            console.error("Erro ao buscar spec para detalhes:", e);
        }
    }

    const panel = vscode.window.createWebviewPanel(
        'brabrixItemDetails',
        `Detalhes: ${item.title}`,
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(item, spec);
}

function getWebviewContent(item: BrabrixBacklogItem, spec?: any) {
    const priorityColor = {
        'LOW': '#2ecc71',
        'MEDIUM': '#f1c40f',
        'HIGH': '#e67e22',
        'URGENT': '#e74c3c'
    }[item.priority || 'LOW'];

    const statusLabel = {
        'TODO': 'A Fazer',
        'READY': 'Pronto',
        'IN_PROGRESS': 'Em Andamento',
        'IN_REVIEW': 'Em Revisão',
        'DONE': 'Concluído',
        'CANCELED': 'Cancelado'
    }[item.status] || item.status;

    const acceptanceCriteriaHtml = item.acceptanceCriteria 
        ? item.acceptanceCriteria.split('\n').map(line => `<li>${line.trim()}</li>`).join('')
        : '<li>Nenhum critério definido.</li>';

    return `<!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .header { border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 1.5rem; color: var(--vscode-editor-foreground); }
            .badge-row { display: flex; gap: 10px; margin-top: 10px; }
            .badge { 
                padding: 4px 10px; 
                border-radius: 12px; 
                font-size: 0.75rem; 
                font-weight: bold; 
                text-transform: uppercase;
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
            }
            .priority-badge { background-color: ${priorityColor}; color: white; }
            .section { margin-top: 25px; }
            .section-title { 
                font-size: 0.9rem; 
                font-weight: bold; 
                color: var(--vscode-descriptionForeground); 
                text-transform: uppercase; 
                margin-bottom: 8px;
                display: block;
            }
            .content-box { 
                background: var(--vscode-textBlockQuote-background); 
                padding: 15px; 
                border-radius: 8px; 
                white-space: pre-wrap;
            }
            .spec-box {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-widget-border);
                padding: 15px;
                border-radius: 8px;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
                white-space: pre-wrap;
                overflow-x: auto;
            }
            ul { padding-left: 20px; margin: 0; }
            li { margin-bottom: 8px; }
            .meta-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                margin-top: 30px; 
                font-size: 0.85rem;
                padding-top: 15px;
                border-top: 1px solid var(--vscode-widget-border);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${item.title}</h1>
            <div class="badge-row">
                <span class="badge">${item.type}</span>
                <span class="badge">${statusLabel}</span>
                ${item.priority ? `<span class="badge priority-badge">${item.priority}</span>` : ''}
            </div>
        </div>

        <div class="section">
            <span class="section-title">Descrição</span>
            <div class="content-box">${item.description || 'Sem descrição disponível.'}</div>
        </div>

        <div class="section">
            <span class="section-title">Critérios de Aceite</span>
            <div class="content-box">
                <ul>${acceptanceCriteriaHtml}</ul>
            </div>
        </div>

        ${spec ? `
        <div class="section">
            <span class="section-title">Especificação Técnica (v${spec.version})</span>
            <div class="spec-box">${spec.content}</div>
        </div>
        ` : ''}

        <div class="meta-grid">
            <div>
                <span class="section-title">Estimativa</span>
                ${item.estimatedHours ? `${item.estimatedHours} horas` : 'Não estimada'}
            </div>
            <div>
                <span class="section-title">ID</span>
                <code>${item.id}</code>
            </div>
        </div>
    </body>
    </html>`;
}