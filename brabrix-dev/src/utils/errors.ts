export class BrabrixError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BrabrixError';
    }
}