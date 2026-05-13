import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BrabrixProject } from '../models/brabrixProject';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { BrabrixExport } from '../models/brabrixExport';

export function safeFileName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

export function writeMarkdownFile(uri: vscode.Uri, content: string): void {
    const dir = path.dirname(uri.fsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(uri.fsPath, content, 'utf8');
}

export function buildFallbackExport(project: BrabrixProject, backlog: BrabrixBacklogItem[]): BrabrixExport {
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