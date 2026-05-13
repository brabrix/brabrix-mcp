import { BrabrixProject } from '../models/brabrixProject';

export class PrdPromptBuilder {
    buildPrompt(project: BrabrixProject): string {
        let prompt = `# Brabrix Dev — Geração de PRD (Product Requirements Document)\n\n`;
        prompt += `Atue como um Product Manager sênior. Baseado no nome e tipo do projeto abaixo, gere uma estrutura base de PRD.\n\n`;

        prompt += `## 1. Dados Iniciais do Projeto\n\n`;
        prompt += `- **Nome:** ${project.name}\n`;
        prompt += `- **Cliente:** ${project.customerName || 'N/A'}\n`;
        prompt += `- **Tipo:** ${project.projectType || 'N/A'}\n`;
        prompt += `\n`;

        prompt += `## 2. Instruções para o Agente\n\n`;
        prompt += `- Se o workspace tiver algum README.md ou documentação inicial, leia primeiro para entender o contexto.\n`;
        prompt += `- Crie um documento PRD abrangente contendo:\n`;
        prompt += `  - Visão Geral (Objetivo do Produto)\n`;
        prompt += `  - Personas / Usuários Alvo\n`;
        prompt += `  - User Stories Principais (Épicos e Histórias base)\n`;
        prompt += `  - Requisitos Não Funcionais (Segurança, Performance)\n`;
        prompt += `  - Fora de Escopo\n`;
        prompt += `- O objetivo é gerar um arquivo \`PRD.md\` na raiz do projeto ou na pasta \`.brabrix/\`.\n`;
        prompt += `- Sugira ideias inovadoras, mas mantenha o escopo realista.\n`;

        return prompt;
    }
}