export interface WorkflowArtifact {
  projectId: string;
  title: string;
  content: string;
  status: string;
  version?: string;
}

export interface TaskSpec {
  taskId: string;
  taskTitle: string;
  specId?: string;
  version?: string;
  status?: string;
  title: string;
  content: string;
}
