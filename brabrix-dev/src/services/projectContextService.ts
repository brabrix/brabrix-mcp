import { BrabrixClient } from '../api/brabrixClient';
import { WorkspaceConfig } from '../config/workspaceConfig';
import { BrabrixProject } from '../models/brabrixProject';
import { BrabrixBacklogItem } from '../models/brabrixBacklogItem';
import { BrabrixExport } from '../models/brabrixExport';

export interface FullTaskContext {
    project: BrabrixProject;
    selectedItem: BrabrixBacklogItem;
    backlogItems: BrabrixBacklogItem[];
    parentChain: BrabrixBacklogItem[];
    exportContext?: BrabrixExport;
}

export class ProjectContextService {
    constructor(
        private client: BrabrixClient,
        private workspaceConfig: WorkspaceConfig
    ) {}

    async getFullTaskContext(itemId: string): Promise<FullTaskContext | undefined> {
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
        
        let exportContext: BrabrixExport | undefined;
        try {
            exportContext = await this.client.exportProjectContext(config.projectId);
        } catch (e) {
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

    private buildParentChain(item: BrabrixBacklogItem, allItems: BrabrixBacklogItem[]): BrabrixBacklogItem[] {
        const chain: BrabrixBacklogItem[] = [];
        let current = item;
        
        while (current.parentId) {
            const parent = allItems.find(i => i.id === current.parentId);
            if (parent) {
                chain.push(parent);
                current = parent;
            } else {
                break;
            }
        }
        
        return chain.reverse(); // Top-most parent first
    }
}