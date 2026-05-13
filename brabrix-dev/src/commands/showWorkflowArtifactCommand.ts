import * as vscode from 'vscode';
import { BrabrixClient } from '../api/brabrixClient';

export async function showWorkflowArtifactCommand(
    client: BrabrixClient,
    args: { projectId: string, artifactId: string, label: string }
) {
    try {
        const artifact = await client.getWorkflowArtifact(args.projectId, args.artifactId);
        
        const panel = vscode.window.createWebviewPanel(
            'brabrixWorkflowArtifact',
            args.label,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = `<!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    padding: 30px; 
                    line-height: 1.6;
                    max-width: 900px;
                    margin: 0 auto;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                pre { 
                    background: var(--vscode-textBlockQuote-background); 
                    padding: 20px; 
                    border-radius: 8px; 
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    border: 1px solid var(--vscode-widget-border);
                }
                h1 { border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 10px; }
                .meta { color: var(--vscode-descriptionForeground); font-size: 0.9rem; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>${args.label}</h1>
            <div class="meta">Versão: ${artifact.version} | Última atualização: ${new Date(artifact.createdAt).toLocaleString()}</div>
            <pre>${artifact.content}</pre>
        </body>
        </html>`;
    } catch (e: any) {
        vscode.window.showErrorMessage("Erro ao carregar documento: " + e.message);
    }
}