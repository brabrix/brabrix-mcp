import * as vscode from 'vscode';
import { TokenStore } from '../auth/tokenStore';

export async function loginCommand(tokenStore: TokenStore, refreshAll: () => void) {
    const webBaseUrl = vscode.workspace.getConfiguration().get<string>('brabrix.webBaseUrl', 'https://app.brabrix.com');
    
    const action = await vscode.window.showInformationMessage(
        "Como deseja fazer login na Brabrix?",
        "Abrir no Navegador", "Inserir API Key"
    );

    if (action === "Abrir no Navegador") {
        // Redireciona para a página de login da Brabrix, passando o callback URI do VS Code
        const callbackUrl = encodeURIComponent(`vscode://brabrix.brabrix-dev/auth`);
        const loginUrl = `${webBaseUrl}/auth?callback=${callbackUrl}`;
        
        vscode.env.openExternal(vscode.Uri.parse(loginUrl));
        // O UriHandler registrado em extension.ts irá capturar o token quando a web retornar
        return;
    }

    if (action === "Inserir API Key") {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Insira sua API Key da Brabrix Dev (gerada no painel de desenvolvedor)',
            password: true,
            placeHolder: 'bbx_...'
        });

        if (!apiKey) {
            return;
        }

        await tokenStore.saveToken(apiKey);
        vscode.window.showInformationMessage('API Key configurada com sucesso!');
        refreshAll();
    }
}

export async function logoutCommand(tokenStore: TokenStore, refreshAll: () => void) {
    await tokenStore.clearToken();
    vscode.window.showInformationMessage('Logout da Brabrix efetuado com sucesso!');
    refreshAll();
}