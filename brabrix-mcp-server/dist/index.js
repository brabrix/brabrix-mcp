import { BrabrixMcpServer } from './server.js';
const server = new BrabrixMcpServer();
server.run().catch((error) => {
    console.error('Fatal error in MCP server:', error);
    process.exit(1);
});
