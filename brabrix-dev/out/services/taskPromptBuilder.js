"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPromptBuilder = void 0;
const fs = require("fs");
const path = require("path");
class TaskPromptBuilder {
    workspaceConfig;
    static MAX_SKILLS_CONTEXT_CHARS = 12000;
    static MAX_RULES_CONTEXT_CHARS = 12000;
    constructor(workspaceConfig) {
        this.workspaceConfig = workspaceConfig;
    }
    readLocalContext(filename) {
        if (!this.workspaceConfig)
            return undefined;
        const root = this.workspaceConfig.getWorkspaceRoot();
        if (!root)
            return undefined;
        const filepath = path.join(root.fsPath, '.brabrix', 'context', filename);
        if (fs.existsSync(filepath)) {
            return fs.readFileSync(filepath, 'utf8');
        }
        return undefined;
    }
    buildTaskPrompt(context, executionProfile = 'plan') {
        const { project, selectedItem, parentChain, exportContext } = context;
        let prompt = `# Brabrix Dev — Prompt de Desenvolvimento\n\n`;
        // 1. Tarefa atual
        prompt += `## 1. Tarefa atual\n\n`;
        prompt += `- **ID:** ${selectedItem.id}\n`;
        prompt += `- **Tipo:** ${selectedItem.type}\n`;
        prompt += `- **Título:** ${selectedItem.title}\n`;
        prompt += `- **Status:** ${selectedItem.status}\n`;
        if (selectedItem.priority)
            prompt += `- **Prioridade:** ${selectedItem.priority}\n`;
        if (selectedItem.estimatedHours)
            prompt += `- **Estimativa:** ${selectedItem.estimatedHours}h\n`;
        prompt += `- **Projeto:** ${project.name}\n`;
        if (project.customerName)
            prompt += `- **Cliente:** ${project.customerName}\n`;
        prompt += `\n`;
        // 2. Objetivo da tarefa
        prompt += `## 2. Objetivo da tarefa\n\n`;
        prompt += `${selectedItem.description || selectedItem.title}\n\n`;
        // 3. Contexto Sincronizado da Brabrix
        prompt += `## 3. Contexto do Projeto\n\n`;
        const localProjectContext = this.readLocalContext('project-context.md');
        if (localProjectContext) {
            prompt += `${localProjectContext}\n\n`;
        }
        else if (exportContext?.projectContextMd) {
            prompt += `${exportContext.projectContextMd}\n\n`;
        }
        else {
            prompt += `- **Nome:** ${project.name}\n`;
            prompt += `- **Tipo:** ${project.projectType || 'N/A'}\n`;
            prompt += `- **Status:** ${project.status || 'N/A'}\n\n`;
        }
        // 4. PRD resumido
        prompt += `## 4. PRD resumido\n\n`;
        const localPrd = this.readLocalContext('prd.md');
        if (localPrd) {
            prompt += `${localPrd}\n\n`;
        }
        else if (exportContext?.prdMd) {
            prompt += `${exportContext.prdMd}\n\n`;
        }
        else {
            prompt += `PRD não encontrado na Brabrix para este projeto.\n\n`;
        }
        // 5. Spec técnica relevante
        prompt += `## 5. Spec técnica relevante\n\n`;
        const localSpec = this.readLocalContext('technical-spec.md');
        if (localSpec) {
            prompt += `${localSpec}\n\n`;
        }
        else if (exportContext?.technicalSpecMd) {
            prompt += `${exportContext.technicalSpecMd}\n\n`;
        }
        else {
            prompt += `Spec técnica não encontrada na Brabrix para este projeto.\n\n`;
        }
        // 6. Contexto do backlog
        prompt += `## 6. Contexto do backlog (Hierarquia)\n\n`;
        if (parentChain.length > 0) {
            parentChain.forEach(p => {
                prompt += `- **[${p.type}]** ${p.title}\n`;
            });
        }
        else {
            prompt += `Nenhum item pai.\n`;
        }
        prompt += `\n`;
        // 7. User Story
        prompt += `## 7. User Story\n\n`;
        const userStory = parentChain.find(p => p.type === 'USER_STORY') || (selectedItem.type === 'USER_STORY' ? selectedItem : null);
        if (userStory) {
            prompt += `${userStory.title}\n`;
            if (userStory.description)
                prompt += `${userStory.description}\n`;
        }
        else {
            prompt += `Nenhuma User Story associada.\n`;
        }
        prompt += `\n`;
        // 8. Critérios de aceite
        prompt += `## 8. Critérios de aceite\n\n`;
        if (selectedItem.acceptanceCriteria) {
            prompt += `${selectedItem.acceptanceCriteria}\n\n`;
        }
        else if (userStory && userStory.acceptanceCriteria) {
            prompt += `Da User Story pai:\n${userStory.acceptanceCriteria}\n\n`;
        }
        else {
            prompt += `Nenhum critério de aceite definido.\n\n`;
        }
        // 9. Skills aplicadas ao projeto
        const localSkillsContext = this.readLocalContext('skills.md');
        prompt += this.buildOptionalContextSection('## 9. Skills aplicadas ao projeto', localSkillsContext, 'Nenhuma Skill sincronizada para este projeto.', TaskPromptBuilder.MAX_SKILLS_CONTEXT_CHARS);
        // 10. Rules obrigatórias do projeto
        const localRulesContext = this.readLocalContext('rules.md');
        prompt += this.buildOptionalContextSection('## 10. Rules obrigatórias do projeto', localRulesContext, 'Nenhuma Rule sincronizada para este projeto.', TaskPromptBuilder.MAX_RULES_CONTEXT_CHARS);
        // 11. Instruções para o agente
        prompt += `## 11. Instruções para o agente\n\n`;
        const localAiPrompts = this.readLocalContext('ai-prompts.md');
        if (localAiPrompts) {
            prompt += `${localAiPrompts}\n\n`;
        }
        prompt += `**Perfil de Execução: ${executionProfile.toUpperCase()}**\n`;
        switch (executionProfile) {
            case 'safe':
                prompt += `- Atue apenas em modo de leitura/análise. Não faça modificações.\n`;
                break;
            case 'plan':
                prompt += `- O CLI deve analisar a tarefa e apresentar um plano curto antes de qualquer alteração.\n`;
                prompt += `- Verifique as ferramentas (tools) disponíveis. Se não houver ferramentas de escrita, gere o conteúdo para cópia manual.\n`;
                prompt += `- Mesmo que as ferramentas de escrita estejam disponíveis, apresente o plano antes de executar as alterações.\n`;
                break;
            case 'edit':
                prompt += `- Você tem permissão para editar arquivos, mas SOMENTE se as ferramentas (tools) de escrita adequadas estiverem disponíveis.\n`;
                prompt += `- Verifique suas ferramentas antes. Se as ferramentas não existirem, use o fallback para saída manual (exiba o código para cópia em blocos Markdown).\n`;
                prompt += `- Não tente burlar restrições ou inventar ferramentas que não possua.\n`;
                break;
            case 'manual':
                prompt += `- NÃO edite arquivos diretamente.\n`;
                prompt += `- O prompt deve retornar as modificações em blocos padronizados no seguinte formato:\n`;
                prompt += `  ### FILE: caminho/do/arquivo\n`;
                prompt += `  \`\`\`\n`;
                prompt += `  conteúdo do arquivo aqui\n`;
                prompt += `  \`\`\`\n`;
                prompt += `- O usuário aplicará as alterações manualmente.\n`;
                break;
            default:
                prompt += `- O CLI deve analisar a tarefa e apresentar um plano curto antes de qualquer alteração.\n`;
                break;
        }
        prompt += `\n`;
        prompt += `- Analise a estrutura do projeto antes de alterar arquivos.\n`;
        prompt += `- Siga os padrões existentes do repositório.\n`;
        prompt += `- Faça mudanças pequenas e focadas na tarefa.\n`;
        prompt += `- Não refatore áreas fora do escopo.\n`;
        prompt += `- Não remova código sem necessidade.\n`;
        prompt += `- Não altere contratos públicos sem avisar.\n`;
        prompt += `- Crie ou atualize testes quando fizer sentido.\n`;
        prompt += `- Se faltar informação, pare e liste as dúvidas.\n`;
        prompt += `- Ao final, explique os arquivos alterados e o motivo.\n`;
        prompt += `- Não exponha secrets, tokens ou dados sensíveis.\n`;
        prompt += `- Não execute comandos destrutivos sem confirmação.\n\n`;
        // 12. Fora de escopo
        prompt += `## 12. Fora de escopo\n\n`;
        prompt += `- Não implementar funcionalidades fora da tarefa.\n`;
        prompt += `- Não alterar autenticação se não fizer parte do escopo.\n`;
        prompt += `- Não mudar layout global sem necessidade.\n\n`;
        // 13. Resultado esperado
        prompt += `## 13. Resultado esperado\n\n`;
        prompt += `- Arquivos alterados.\n`;
        prompt += `- Testes criados ou atualizados.\n`;
        prompt += `- Resumo final da implementação.\n`;
        prompt += `- Próximos passos (se houver).\n`;
        return prompt;
    }
    buildOptionalContextSection(sectionTitle, content, emptyMessage, maxChars) {
        let section = `${sectionTitle}\n\n`;
        if (!content || !content.trim()) {
            section += `${emptyMessage}\n\n`;
            return section;
        }
        const trimmed = content.trim();
        if (trimmed.length <= maxChars) {
            section += `${trimmed}\n\n`;
            return section;
        }
        section += `${trimmed.slice(0, maxChars)}\n\n`;
        section += `> Conteúdo truncado para manter o prompt em tamanho seguro.\n\n`;
        return section;
    }
}
exports.TaskPromptBuilder = TaskPromptBuilder;
//# sourceMappingURL=taskPromptBuilder.js.map