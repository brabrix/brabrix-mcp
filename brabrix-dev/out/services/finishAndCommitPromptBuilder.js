"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinishAndCommitPromptBuilder = void 0;
class FinishAndCommitPromptBuilder {
    buildPrompt(context) {
        const { selectedItem } = context;
        let prompt = `# Brabrix Dev — Finalizar Tarefa e Commitar\n\n`;
        prompt += `Atue como um desenvolvedor concluindo uma tarefa. Seu objetivo é analisar as alterações, criar uma mensagem de commit padronizada e efetuar o commit.\n\n`;
        prompt += `## 1. Tarefa Concluída\n\n`;
        prompt += `- **ID / Referência:** ${selectedItem.id}\n`;
        prompt += `- **Título:** ${selectedItem.title}\n`;
        prompt += `- **Tipo:** ${selectedItem.type}\n`;
        prompt += `\n`;
        prompt += `## 2. Instruções para o Agente\n\n`;
        prompt += `1. **Revisão das Alterações:** Execute \`git diff\` e \`git status\` para entender o que foi modificado no workspace.\n`;
        prompt += `2. **Adicionar ao Stage:** Execute \`git add .\` (ou adicione os arquivos relevantes) se ainda não estiverem no stage.\n`;
        prompt += `3. **Gerar Mensagem de Commit:** Crie uma mensagem clara seguindo o padrão Conventional Commits. Exemplo:\n`;
        prompt += `   \`feat: ${selectedItem.title.toLowerCase()}\n\n[Brabrix: ${selectedItem.id}]\`\n`;
        prompt += `4. **Realizar o Commit:** Execute o comando \`git commit -m "sua mensagem"\`.\n`;
        prompt += `5. **Atenção:** Não faça \`git push\`. Apenas conclua o commit localmente e avise o desenvolvedor.\n`;
        return prompt;
    }
}
exports.FinishAndCommitPromptBuilder = FinishAndCommitPromptBuilder;
//# sourceMappingURL=finishAndCommitPromptBuilder.js.map