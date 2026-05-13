"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectContextService = void 0;
class ProjectContextService {
    client;
    workspaceConfig;
    constructor(client, workspaceConfig) {
        this.client = client;
        this.workspaceConfig = workspaceConfig;
    }
    async getFullTaskContext(itemId) {
        const config = await this.workspaceConfig.readConfig();
        if (!config) {
            throw new Error("Nenhum projeto selecionado.");
        }
        const project = await this.client.getProject(config.projectId);
        const backlogItems = await this.client.listBacklog(config.projectId);
        const selectedItem = backlogItems.find(i => i.id === itemId);
        if (!selectedItem) {
            throw new Error("Item de backlog não encontrado.");
        }
        const parentChain = this.buildParentChain(selectedItem, backlogItems);
        let exportContext;
        try {
            exportContext = await this.client.exportProjectContext(config.projectId);
        }
        catch (e) {
            console.warn("Não foi possível carregar o export context.", e);
        }
        return {
            project,
            selectedItem,
            backlogItems,
            parentChain,
            exportContext
        };
    }
    buildParentChain(item, allItems) {
        const chain = [];
        let current = item;
        while (current.parentId) {
            const parent = allItems.find(i => i.id === current.parentId);
            if (parent) {
                chain.push(parent);
                current = parent;
            }
            else {
                break;
            }
        }
        return chain.reverse(); // Top-most parent first
    }
}
exports.ProjectContextService = ProjectContextService;
//# sourceMappingURL=projectContextService.js.map