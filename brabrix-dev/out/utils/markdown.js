"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeFileName = safeFileName;
exports.writeMarkdownFile = writeMarkdownFile;
exports.buildFallbackExport = buildFallbackExport;
const fs = require("fs");
const path = require("path");
function safeFileName(name) {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
function writeMarkdownFile(uri, content) {
    const dir = path.dirname(uri.fsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(uri.fsPath, content, 'utf8');
}
function buildFallbackExport(project, backlog) {
    const projectContextMd = `# ${project.name}\n\nCliente: ${project.customerName || 'N/A'}\nStatus: ${project.status || 'N/A'}`;
    let backlogMd = `# Backlog - ${project.name}\n\n`;
    backlog.forEach(item => {
        backlogMd += `- **[${item.type}]** ${item.title} (${item.status})\n`;
    });
    const userStories = backlog.filter(i => i.type === 'USER_STORY');
    let userStoriesMd = `# User Stories\n\n`;
    userStories.forEach(us => {
        userStoriesMd += `## ${us.title}\nStatus: ${us.status}\n\n`;
    });
    return {
        projectContextMd,
        backlogMd,
        userStoriesMd,
    };
}
//# sourceMappingURL=markdown.js.map