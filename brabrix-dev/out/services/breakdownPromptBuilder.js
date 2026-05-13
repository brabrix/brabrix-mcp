"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakdownPromptBuilder = void 0;
class BreakdownPromptBuilder {
    buildPrompt(context) {
        const { project, selectedItem, parentChain, exportContext } = context;
        let prompt = `# Brabrix Dev — Quebrar História em Tarefas (Breakdown)\n\n`;
        prompt += `Baseado no contexto da User Story abaixo, atue como um Tech Lead e quebre esta história em tarefas técnicas (TASKS) menores e executáveis.\n\n`;
        prompt += `## 1. User Story Alvo\n\n`;
        prompt += `- **Título:** ${selectedItem.title}\n`;
        prompt += `- **Descrição:** ${selectedItem.description || 'N/A'}\n`;
        if (selectedItem.acceptanceCriteria) {
            prompt += `- **Critérios de Aceite:**\n${selectedItem.acceptanceCriteria}\n`;
        }
        prompt += `\n`;
        prompt += `## 2. Contexto do Projeto\n\n`;
        prompt += `- **Projeto:** ${project.name}\n`;
        if (exportContext?.projectContextMd) {
            prompt += `${exportContext.projectContextMd}\n\n`;
        }
        prompt += `## 3. Instruções para o Agente\n\n`;
        prompt += `- Analise os critérios de aceite e a arquitetura provável do projeto.\n`;
        prompt += `- Gere uma lista de 3 a 7 tarefas (TASKS) técnicas.\n`;
        prompt += `- Para cada tarefa, inclua: Título, Descrição curta e Estimativa em horas.\n`;
        prompt += `- Considere tarefas de frontend, backend, banco de dados e testes separadamente, se aplicável ao projeto.\n`;
        prompt += `- Retorne a lista em formato Markdown claro para que o desenvolvedor possa cadastrar na Brabrix.\n`;
        return prompt;
    }
}
exports.BreakdownPromptBuilder = BreakdownPromptBuilder;
//# sourceMappingURL=breakdownPromptBuilder.js.map