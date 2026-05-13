export class BrabrixError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BrabrixError';
  }
}
