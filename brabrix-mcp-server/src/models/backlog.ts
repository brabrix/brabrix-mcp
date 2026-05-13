export type BacklogItemType = 'EPIC' | 'FEATURE' | 'USER_STORY' | 'TASK' | 'BUG' | 'IMPROVEMENT' | 'DOCUMENTATION';
export type BacklogItemStatus = 'TODO' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELED';

export interface BacklogItem {
  id: string;
  parentId?: string;
  type: BacklogItemType;
  title: string;
  description?: string;
  status: BacklogItemStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  acceptanceCriteria?: string;
  estimatedHours?: number;
  projectId?: string;
}

export interface BoardSummary {
  TODO: BacklogItem[];
  READY: BacklogItem[];
  IN_PROGRESS: BacklogItem[];
  IN_REVIEW: BacklogItem[];
  DONE: BacklogItem[];
  CANCELED: BacklogItem[];
}
