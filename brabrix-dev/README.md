# Brabrix Dev - VS Code Extension

Extensão oficial da Brabrix Dev para integrar contexto de projetos, backlog e boards diretamente no VS Code, com workflow guiado de IA e trilha Spec-Driven Development (SDD) opcional.

## Instalação e Uso Local (Modo Desenvolvimento)

1. Certifique-se de ter o Node.js instalado.
2. Acesse a pasta da extensão (`apps/brabrix-dev`).
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Abra a pasta `apps/brabrix-dev` no VS Code.
5. Pressione `F5` para compilar e iniciar a extensão em uma janela de Extension Development Host.

## Como Usar

### Login via Web ou Modo Demo
Na barra lateral (Activity Bar), clique no ícone da **Brabrix Dev**. Clique em **Faça login na Brabrix**. 
Você pode usar a integração via Web, ou escolher o modo manual e inserir a palavra `demo` para testar a interface com dados falsos.

### Projetos Locais (Offline)
Se você não possui uma conta na Brabrix ou quer apenas testar a gestão local, clique em **Criar Projeto Local (Offline)**. 
Isso permite criar Epics, Tarefas e Bugs locais, usando o banco de dados interno da extensão salvo em `.brabrix/local-db.json`.

### Vincular e Sincronizar Workspace
Ao selecionar um projeto em nuvem, a extensão irá baixar o contexto do seu projeto e gravá-lo na pasta oculta `.brabrix/context/`.
Isso cria um acervo de arquivos Markdown (PRD, Backlog, Critérios de Aceitação) que serve como "Cérebro" para agentes de inteligência artificial trabalharem no repositório.

### Plataforma guiada com SDD opcional
A Brabrix Dev não trava seu fluxo. A proposta é oferecer dois modos de trabalho:

- **Modo livre**: você usa backlog, prompts e agentes sem obrigatoriedade de seguir etapas.
- **Modo guiado (SDD opcional)**: você usa artefatos de workflow (Briefing -> PRD -> Spec Técnica -> Backlog -> Execução) para dar mais previsibilidade e reduzir retrabalho.

Em resumo: quando o projeto pede velocidade, rode livre. Quando pede governança, ative a trilha guiada.

### Skills & Rules aplicadas ao projeto
A extensão também sincroniza as Skills & Rules aplicadas no projeto Brabrix para uso local com agentes (Codex, Gemini CLI, Claude Code, MCP futuro etc.).

Comandos principais:
- **Brabrix: Sincronizar Skills & Rules do projeto**
- **Brabrix: Listar Skills & Rules do projeto**
- **Brabrix: Abrir Skills do projeto**
- **Brabrix: Abrir Rules do projeto**

Estrutura gerada no workspace:
```text
.brabrix/
├── skills/
│   ├── project-skills.md
│   ├── project-rules.md
│   ├── index.md
│   ├── public/
│   └── private/
└── context/
    ├── skills.md
    └── rules.md
```

Os arquivos `skills.md` e `rules.md` em `.brabrix/context/` são usados automaticamente pelo gerador de prompt da tarefa.
Quando disponíveis, o prompt inclui:
- `## Skills aplicadas ao projeto`
- `## Rules obrigatórias do projeto`

O comando geral **Brabrix: Sincronizar contexto do projeto** também executa a sincronização de Skills & Rules automaticamente.

## Templates de Agente

A extensão consegue gerar estruturas prontas para diferentes agentes locais com base no contexto sincronizado da Brabrix.

Comando principal:
- **Brabrix: Gerar arquivos para agente de IA**

Templates do MVP:
- **Claude Code**: gera `CLAUDE.md`, `.claude/context/*` e `.claude/skills/*`.
- **Codex**: gera `AGENTS.md`, `.codex/context/*` e `.codex/skills/*`.
- **VS Code / Copilot**: gera `.github/copilot-instructions.md`, `.vscode/brabrix-context.md` e `.vscode/brabrix-rules.md`.
- **Gemini CLI**: gera `GEMINI.md`, `.gemini/context/*` e `.gemini/skills/*`.
- **Genérico**: gera `.brabrix/context/index.md` e `.brabrix/prompts/current-task-prompt.md`.

O fluxo permite:
- escolher o template (ou **Todos**);
- selecionar quais blocos de contexto incluir;
- escolher política de arquivos existentes (backup + sobrescrever, sobrescrever, pular).

Backups (quando escolhidos):
- `.brabrix/backups/agent-templates/{timestamp}/...`

Segurança:
- nenhum token da Brabrix é salvo nos templates gerados;
- a extensão escreve apenas dentro do workspace;
- conteúdo de Skills & Rules é tratado como Markdown (sem execução).

Quando o projeto mudar, rode novamente:
- **Brabrix: Sincronizar contexto do projeto**
- **Brabrix: Gerar arquivos para agente de IA**

## Comandos Disponíveis (Command Palette e Menus)

- **Brabrix: Vincular workspace ao projeto**: Conecta a pasta atual a um projeto da Brabrix.
- **Brabrix: Sincronizar contexto do projeto**: Baixa as últimas atualizações da nuvem para a pasta `.brabrix/context`.
- **Brabrix: Sincronizar Skills & Rules do projeto**: Atualiza `.brabrix/skills` e `.brabrix/context/skills.md|rules.md`.
- **Brabrix: Criar Projeto Local**: Inicia um workspace sem depender da internet.
- **Brabrix: Selecionar tarefa atual**: Marca uma tarefa específica como o seu foco atual.

### Integração com Agentes de IA (MCP - Model Context Protocol)
A extensão suporta o **MCP Server da Brabrix**, que permite que agentes de IA consultem seu projeto automaticamente.

Para configurar:
- Abra o Command Palette (`Ctrl+Shift+P` ou `Cmd+Shift+P`).
- Digite **Brabrix: Configurar MCP da Brabrix**.
- Siga as instruções para copiar a configuração do **Gemini CLI** ou o comando do **Claude Code**.

> ⚠️ **Segurança**: Nunca versione seu `BRABRIX_TOKEN`. O setup gerado pela extensão utiliza os IDs do seu workspace atual, mas o token deve ser configurado como variável de ambiente local.

#### Recomendação de uso no modo guiado (SDD)
Ao iniciar tarefas sensíveis, use este padrão:

1. Sincronize o contexto do projeto.
2. Busque a tarefa atual e a spec de desenvolvimento.
3. Só então peça implementação para o agente.

Isso mantém a IA alinhada ao contexto e evita desvio de requisito.

### Integração com Agentes de IA (Local CLI - Legado/Prompt)
Você pode gerar prompts incrivelmente detalhados...

Ao clicar com o **botão direito do mouse** sobre um projeto ou tarefa, as seguintes magias estão disponíveis:
- **Gerar prompt de skills (No Projeto):** Lê o PRD e contexto e pede para a IA criar o arquivo `AGENTS.md` (regras e diretrizes do repositório).
- **Quebrar História em Tarefas (Na User Story):** Lê uma História e pede para a IA quebrar em subtarefas técnicas estimadas.
- **Fazer Code Review (Na Tarefa):** Pede para a IA ler as suas alterações locais do Git e cruzar com os Critérios de Aceite da tarefa antes de um Pull Request.
- **Gerar PRD (No Projeto):** Cria a documentação inicial de produto baseada no nome do projeto.
- **Finalizar Tarefa e Commitar (Na Tarefa):** Atualiza a tarefa para `DONE` e gera o Conventional Commit.
- **Reportar Bug (No Editor):** Selecione uma falha de código, botão direito e reporte um Bug diretamente pro backlog.

> ⚠️ **Aviso de Segurança**: A execução em CLI ocorre **localmente na sua máquina**. A Brabrix Dev Extension não executa comandos destrutivos no terminal sem a sua confirmação explícita. Não subimos o seu código para a nuvem da Brabrix.

### Ignorando Arquivos (Git)
A pasta `.brabrix` guarda contexto que ajuda as IAs. Recomendamos adicionar as seguintes linhas no seu `.gitignore`:
```gitignore
.brabrix/cache/
.brabrix/prompts/
.brabrix/local-db.json
```
A subpasta `.brabrix/context/` é opcional versionar. Ela é útil caso a equipe inteira use ferramentas de IA.

## Segurança
- O token da Brabrix permanece no `SecretStorage` do VS Code e **não** é salvo no workspace.
- A extensão escreve apenas em `.brabrix/` dentro do workspace atual.
- Skills & Rules são tratadas como texto Markdown (sem execução de conteúdo).
- A extensão não cria arquivos em `.git`, `node_modules` ou caminhos fora do projeto.
