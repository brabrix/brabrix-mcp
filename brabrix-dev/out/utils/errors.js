"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrabrixError = void 0;
class BrabrixError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BrabrixError';
    }
}
exports.BrabrixError = BrabrixError;
//# sourceMappingURL=errors.js.map