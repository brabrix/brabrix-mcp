import * as vscode from 'vscode';

export class TokenStore {
    private readonly secretStorage: vscode.SecretStorage;
    private readonly tokenKey = 'brabrix_token';
    private readonly refreshTokenKey = 'brabrix_refresh_token';

    constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    async getToken(): Promise<string | undefined> {
        return this.secretStorage.get(this.tokenKey);
    }

    async getRefreshToken(): Promise<string | undefined> {
        return this.secretStorage.get(this.refreshTokenKey);
    }

    async saveToken(token: string, refreshToken?: string): Promise<void> {
        await this.secretStorage.store(this.tokenKey, token);
        if (refreshToken) {
            await this.secretStorage.store(this.refreshTokenKey, refreshToken);
        }
    }

    async clearToken(): Promise<void> {
        await this.secretStorage.delete(this.tokenKey);
        await this.secretStorage.delete(this.refreshTokenKey);
    }

    async hasToken(): Promise<boolean> {
        const token = await this.getToken();
        return !!token;
    }
}