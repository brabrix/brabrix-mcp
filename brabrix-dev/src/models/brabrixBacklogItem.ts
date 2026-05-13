export interface BrabrixBacklogItem {
    id: string;
    projectId: string;
    parentId?: string;
    type: 'EPIC' | 'FEATURE' | 'USER_STORY' | 'TASK' | 'BUG' | 'IMPROVEMENT' | 'DOCUMENTATION';
    title: string;
    description?: string;
    status: 'TODO' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    acceptanceCriteria?: string;
    estimatedHours?: number;
    updatedAt?: string;
}