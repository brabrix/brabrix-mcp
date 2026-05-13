"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeReviewPromptBuilder = void 0;
class CodeReviewPromptBuilder {
    buildPrompt(context) {
        const { project, selectedItem, parentChain } = context;
        let prompt = `# Brabrix Dev — Code Review Automático\n\n`;
        prompt += `Atue como um Senior Software Engineer e faça um code review minucioso das alterações atuais do workspace, cruzando com os requisitos da tarefa abaixo.\n\n`;
        prompt += `## 1. Contexto da Tarefa\n\n`;
        prompt += `- **ID:** ${selectedItem.id}\n`;
        prompt += `- **Título:** ${selectedItem.title}\n`;
        prompt += `- **Tipo:** ${selectedItem.type}\n`;
        if (selectedItem.description)
            prompt += `- **Descrição:** ${selectedItem.description}\n`;
        if (selectedItem.acceptanceCriteria)
            prompt += `- **Critérios de Aceite:**\n${selectedItem.acceptanceCriteria}\n`;
        prompt += `\n`;
        const userStory = parentChain.find(p => p.type === 'USER_STORY');
        if (userStory) {
            prompt += `## 2. User Story Pai\n\n`;
            prompt += `- **Título:** ${userStory.title}\n`;
            if (userStory.acceptanceCriteria)
                prompt += `- **Critérios da História:**\n${userStory.acceptanceCriteria}\n`;
            prompt += `\n`;
        }
        prompt += `## 3. Instruções para o Code Review\n\n`;
        prompt += `1. **Leia as alterações:** Use comandos como \`git diff HEAD\` ou verifique os arquivos modificados recentemente no workspace.\n`;
        prompt += `2. **Valide os Critérios de Aceite:** Verifique se o código escrito realmente atende a todos os critérios listados acima.\n`;
        prompt += `3. **Qualidade de Código:** Aponte problemas de legibilidade, performance, segurança e falta de testes.\n`;
        prompt += `4. **Formato da Resposta:** Entregue o review em Markdown. Liste "O que está bom", "O que falta para atender a tarefa" e "Sugestões de Refatoração".\n`;
        prompt += `5. Não faça \`git commit\` ou \`git push\`. Apenas analise e responda.\n`;
        return prompt;
    }
}
exports.CodeReviewPromptBuilder = CodeReviewPromptBuilder;
//# sourceMappingURL=codeReviewPromptBuilder.js.map