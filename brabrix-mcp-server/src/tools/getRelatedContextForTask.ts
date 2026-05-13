import { BrabrixClient } from '../api/brabrixClient.js';
import { config } from '../config.js';

export const getRelatedContextForTaskTool = async (client: BrabrixClient, args: { projectId?: string, taskId?: string }) => {
  const projectId = args.projectId || config.projectId || 'demo-project';
  const taskId = args.taskId || config.currentTaskId;

  if (!taskId) {
    return {
      content: [{ type: 'text', text: 'Nenhum taskId fornecido ou configurado.' }],
      isError: true,
    };
  }

  try {
    const [projectContext, currentTask, taskSpec, backlog] = await Promise.all([
      client.getProjectContext(projectId),
      client.getCurrentTask(projectId, taskId),
      client.getTaskSpec(projectId, taskId).catch(() => null),
      client.getBacklog(projectId),
    ]);

    const relatedItems = backlog.filter(item => item.parentId === currentTask.parentId || item.parentId === currentTask.id);

    const context = `
# Contexto de Desenvolvimento: ${currentTask.title}

## Projeto: ${projectContext.projectName} (${projectContext.customerName})
${projectContext.description}

### Stack Técnica
${projectContext.stack || 'Não especificada'}

## Tarefa Atual: ${currentTask.title}
**Status:** ${currentTask.status} | **Prioridade:** ${currentTask.priority}
**Descrição:** ${currentTask.description}

### Critérios de Aceite
${currentTask.acceptanceCriteria || 'Nenhum critério definido'}

## Spec de Desenvolvimento
${taskSpec?.content || 'Nenhuma spec detalhada disponível.'}

## Itens Relacionados no Backlog
${relatedItems.map(item => `- [${item.type}] ${item.title} (${item.status})`).join('\n')}

---
*Gerado via Brabrix MCP Server*
    `.trim();

    return {
      content: [{ type: 'text', text: context }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Erro ao montar contexto: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
};
