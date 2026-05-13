export interface ProjectContext {
  projectId: string;
  projectName: string;
  customerName: string;
  description: string;
  projectType: string;
  status: string;
  stack?: string;
  technologies?: string[];
  links?: Record<string, string>;
  summary?: string;
  observations?: string;
}
