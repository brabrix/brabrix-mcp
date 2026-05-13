import { BrabrixProject } from '../models/brabrixProject';
import { BrabrixExport } from '../models/brabrixExport';

export class SkillsPromptBuilder {
    buildSkillsPrompt(project: BrabrixProject, exportContext?: BrabrixExport, executionProfile: string = 'plan'): string {
        let prompt = `# Brabrix Dev — Geração de Skills do Projeto\n\n`;
        prompt += `Baseado no contexto deste projeto, crie um conjunto de skills (regras, padrões, diretrizes arquiteturais, workflows e templates de código) para agentes de IA usarem ao trabalhar neste repositório.\n\n`;

        // 1. Contexto do projeto
        prompt += `## 1. Contexto do Projeto\n\n`;
        if (exportContext?.projectContextMd) {
            prompt += `${exportContext.projectContextMd}\n\n`;
        } else {
            prompt += `- **Nome:** ${project.name}\n`;
            prompt += `- **Tipo:** ${project.projectType || 'N/A'}\n`;
            prompt += `- **Status:** ${project.status || 'N/A'}\n\n`;
        }

        // 2. PRD resumido
        prompt += `## 2. PRD Resumido\n\n`;
        if (exportContext?.prdMd) {
            prompt += `${exportContext.prdMd}\n\n`;
        } else {
            prompt += `PRD não encontrado na Brabrix para este projeto.\n\n`;
        }

        // 3. Spec técnica
        prompt += `## 3. Spec Técnica\n\n`;
        if (exportContext?.technicalSpecMd) {
            prompt += `${exportContext.technicalSpecMd}\n\n`;
        } else {
            prompt += `Spec técnica não encontrada na Brabrix para este projeto.\n\n`;
        }

        // 4. Instruções para o agente
        prompt += `## 4. Instruções para o agente de IA\n\n`;
        prompt += `- Analise a estrutura geral do projeto antes de gerar as regras.\n`;
        prompt += `- Identifique padrões de nomenclatura, de arquitetura e de formatação que já existam.\n`;
        prompt += `- Crie regras de ouro (Red Lines) que nunca devem ser cruzadas ao programar aqui.\n`;
        prompt += `- Especifique fluxos claros (Ex: como criar um endpoint, como adicionar um novo componente UI).\n`;
        prompt += `- Sintetize tudo em um formato altamente estruturado de SKILL ou em um arquivo global \`AGENTS.md\` na raiz.\n\n`;
        
        prompt += `**Perfil de Execução: ${executionProfile.toUpperCase()}**\n`;
        
        switch (executionProfile) {
            case 'safe':
                prompt += `- Atue apenas em modo de leitura/análise. Não faça modificações.\n`;
                break;
            case 'plan':
                prompt += `- O CLI deve apresentar um plano curto antes de criar os arquivos de skills.\n`;
                prompt += `- Verifique as ferramentas (tools) disponíveis. Se não houver ferramentas de escrita, gere o conteúdo para cópia manual.\n`;
                break;
            case 'edit':
                prompt += `- Você tem permissão para editar/criar arquivos (ex: \`AGENTS.md\`), mas SOMENTE se as ferramentas (tools) de escrita adequadas estiverem disponíveis.\n`;
                prompt += `- Verifique suas ferramentas antes. Se as ferramentas não existirem, use o fallback para saída manual (exiba o código para cópia em blocos Markdown).\n`;
                break;
            case 'manual':
                prompt += `- NÃO crie ou edite arquivos diretamente.\n`;
                prompt += `- O prompt deve retornar o conteúdo do arquivo (ex: \`AGENTS.md\`) em blocos padronizados no seguinte formato:\n`;
                prompt += `  ### FILE: AGENTS.md\n`;
                prompt += `  \`\`\`\n`;
                prompt += `  conteúdo do arquivo aqui\n`;
                prompt += `  \`\`\`\n`;
                prompt += `- O usuário salvará os arquivos manualmente.\n`;
                break;
            default:
                prompt += `- O CLI deve apresentar um plano curto antes de criar os arquivos.\n`;
                break;
        }
        prompt += `\n`;

        // 5. Resultado esperado
        prompt += `## 5. Resultado Esperado\n\n`;
        if (executionProfile === 'manual' || executionProfile === 'safe') {
            prompt += `- A saída deve ser focada em gerar o conteúdo textual de contexto e configuração de IA.\n`;
        } else {
            prompt += `- A saída deve ser focada em criar e gravar os arquivos de contexto e configuração de IA (ex: \`AGENTS.md\`, \`.cursorrules\`, \`.gemini.md\`).\n`;
        }
        prompt += `- Ao final, liste brevemente as skills que foram configuradas.\n`;

        return prompt;
    }
}