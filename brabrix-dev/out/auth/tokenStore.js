"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenStore = void 0;
class TokenStore {
    secretStorage;
    tokenKey = 'brabrix_token';
    refreshTokenKey = 'brabrix_refresh_token';
    constructor(context) {
        this.secretStorage = context.secrets;
    }
    async getToken() {
        return this.secretStorage.get(this.tokenKey);
    }
    async getRefreshToken() {
        return this.secretStorage.get(this.refreshTokenKey);
    }
    async saveToken(token, refreshToken) {
        await this.secretStorage.store(this.tokenKey, token);
        if (refreshToken) {
            await this.secretStorage.store(this.refreshTokenKey, refreshToken);
        }
    }
    async clearToken() {
        await this.secretStorage.delete(this.tokenKey);
        await this.secretStorage.delete(this.refreshTokenKey);
    }
    async hasToken() {
        const token = await this.getToken();
        return !!token;
    }
}
exports.TokenStore = TokenStore;
//# sourceMappingURL=tokenStore.js.map