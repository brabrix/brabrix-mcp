# Brabrix MCP Server

Servidor MCP (Model Context Protocol) para integração com a plataforma Brabrix Dev.

> **Aviso de Segurança:** Esta versão inicial do MCP é **somente leitura**. Ela permite que agentes de IA consultem o contexto do seu projeto, mas não altera dados na API nem escreve arquivos locais.

## Funcionalidades

Este servidor expõe ferramentas para que agentes de IA possam consultar o contexto de projetos, especificações técnicas, PRDs e backlog da Brabrix Dev.

### Detecção Automática de Workspace
O servidor busca automaticamente o arquivo `.brabrix/config.json` no workspace. Se encontrado, ele utiliza o `projectId` e `currentTaskId` definidos pela Extensão VS Code da Brabrix.

## Instalação e Build

```bash
# Instalar dependências
npm install

# Gerar o build (necessário para rodar o MCP)
npm run build
```

## Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`. 
**Importante:** Nunca versione seu `BRABRIX_TOKEN`.

- `BRABRIX_API_URL`: URL da API da Brabrix (Default: https://api.brabrix.com).
- `BRABRIX_TOKEN`: Seu token de acesso à API. Pode ser um **JWT de usuário** ou uma **API Key** (recomendado).
  - **API Key:** Começa com `bbx_`. Pode ser gerada no painel da Brabrix e não expira.
  - **JWT:** Token de sessão temporário obtido no portal.
  - Se omitido, o servidor entra em **modo demo**.
- `BRABRIX_PROJECT_ID`: ID do projeto padrão (UUID).
- `BRABRIX_CURRENT_TASK_ID`: ID da tarefa padrão (UUID).

### Integração com Gemini CLI
Adicione ao seu arquivo de configuração do Gemini CLI (`~/.gemini/settings.json`):
```json
{
  "mcpServers": {
    "brabrix": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/brabrix-mcp-server/dist/index.js"],
      "env": {
        "BRABRIX_API_URL": "https://api.brabrix.com",
        "BRABRIX_PROJECT_ID": "ID_DO_SEU_PROJETO",
        "BRABRIX_TOKEN": "bbx_sua_api_key_aqui",
        "BRABRIX_WORKSPACE_ROOT": "/CAMINHO/PARA/SEU/PROJETO"
      }
    }
  }
}
```

### Integração com Claude Code
Execute o comando:
```bash
claude mcp add brabrix -- node /CAMINHO/PARA/brabrix-mcp-server/dist/index.js
```

## Modo Demo
Se você rodar o servidor sem um `BRABRIX_TOKEN`, ele responderá com dados mockados de um projeto exemplo ("Clínica Vida Plena"), permitindo testar as ferramentas sem uma conta real.

## Tools Disponíveis

- `brabrix_get_workspace_config`: Retorna a configuração local detectada.
- `brabrix_get_project_context`: Informações gerais do projeto.
- `brabrix_get_current_task`: Detalhes da tarefa atual.
- `brabrix_get_task_spec`: Especificação técnica/markdown da tarefa.
- `brabrix_get_prd`: Documento de Requisitos de Produto (PRD).
- `brabrix_get_technical_spec`: Especificação técnica global.
- `brabrix_get_backlog`: Lista de itens do backlog.
- `brabrix_get_board`: Itens do board agrupados por status.
- `brabrix_get_related_context_for_task`: Pacote completo de contexto para desenvolvimento (Recomendado para iniciar tarefas).

## Skills & Rules

Tools read-only para consultar Skills & Rules da Brabrix Dev:

- `brabrix_list_public_skills`: Lista Skills & Rules públicas do Hub (resumo).
- `brabrix_list_my_skills`: Lista Skills & Rules privadas do tenant (resumo).
- `brabrix_list_project_skills`: Lista Skills & Rules aplicadas ao projeto.
- `brabrix_get_skill`: Retorna conteúdo completo de uma Skill/Rule por `skillId`.
- `brabrix_get_project_rules`: Retorna Rules do projeto (com foco em obrigatórias).
- `brabrix_get_effective_project_context`: Retorna contexto efetivo com projeto, tarefa, artefatos, Skills e Rules.

### Exemplo de Prompt para Agente

```text
Use brabrix_get_effective_project_context para buscar o contexto do projeto.
Antes de alterar arquivos, leia as Rules obrigatórias.
Use as Skills como padrões técnicos recomendados.
```

### Exemplo de Uso

```text
Liste as rules obrigatórias deste projeto e explique como elas impactam a implementação da task atual.
```

## Segurança

- Este MCP está em modo **read-only** nesta etapa.
- Não há tools para criar/editar/inativar/aplicar Skills via MCP.
- O token não é exposto nas respostas.
- O servidor só lê `.brabrix/config.json` para detectar contexto local de projeto.

## Testes Manuais

1. Executar `brabrix_list_public_skills` e validar retorno de lista pública.
2. Executar `brabrix_list_my_skills` e validar retorno de skills privadas do tenant.
3. Executar `brabrix_list_project_skills` com e sem `projectId`.
4. Executar `brabrix_get_skill` com um `skillId` válido.
5. Executar `brabrix_get_project_rules` e validar ordenação por `required` e `priority`.
6. Executar `brabrix_get_effective_project_context` e validar presença de `skills`, `rules` e `agentInstructions`.
7. Rodar sem `BRABRIX_TOKEN` (modo demo) e validar mocks.
8. Confirmar que token não aparece em respostas/erros.
9. Confirmar que tools de escrita não aparecem em `list_tools`.

---
*Para mais detalhes e exemplos, veja a pasta `examples/`.*
