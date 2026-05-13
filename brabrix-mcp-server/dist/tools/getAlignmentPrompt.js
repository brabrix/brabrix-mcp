import { config } from '../config.js';
export async function getAlignmentPromptTool(client, args) {
    const projectId = args.projectId || config.projectId;
    const taskId = args.taskId || config.currentTaskId;
    if (!projectId || !taskId) {
        throw new Error('Project ID e Task ID são necessários.');
    }
    const [task, spec] = await Promise.all([
        client.getCurrentTask(projectId, taskId),
        client.getTaskSpec(projectId, taskId)
    ]);
    const prompt = `
# Instrução de Compliance e Alinhamento (Brabrix Dev)

Você está finalizando a tarefa: **${task.title}** (${taskId}).
Antes de considerar o trabalho concluído, você DEVE realizar uma auto-revisão rigorosa comparando o código implementado com os requisitos abaixo.

## 1. Critérios de Aceite (Business Rules)
${task.acceptanceCriteria || 'Nenhum critério de aceite definido explicitamente.'}

## 2. Especificação Técnica (Implementation Details)
${spec.content}

## Checklist de Verificação:
1. O código atende a TODOS os critérios de aceite acima?
2. A implementação segue os padrões de arquitetura definidos na Spec Técnica?
3. Foram adicionados testes unitários ou de integração para validar a lógica?
4. Alguma regra de negócio foi ignorada ou alterada sem justificativa?

**Ação:** Analise seu código atual. Se encontrar alguma lacuna, corrija-a. Se estiver tudo OK, gere um resumo do que foi feito confirmando o alinhamento com a Brabrix.
`;
    return {
        content: [
            {
                type: 'text',
                text: prompt.trim(),
            },
        ],
    };
}
