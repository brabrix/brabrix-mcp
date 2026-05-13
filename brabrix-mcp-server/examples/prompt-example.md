# Exemplo de Prompt para Iniciar Desenvolvimento

Ao iniciar uma nova sessão com o Gemini CLI ou Claude Code no seu projeto, você pode usar o seguinte prompt para dar contexto ao agente:

> "Use as tools da Brabrix para buscar a tarefa atual, a spec de desenvolvimento da tarefa, o PRD e a spec técnica do projeto. Primeiro leia o contexto com brabrix_get_related_context_for_task. Depois apresente um plano curto antes de modificar qualquer arquivo."

Isso garante que o agente:
1. Entenda o **objetivo** da tarefa.
2. Conheça as **regras de negócio** (PRD).
3. Siga os **padrões técnicos** (Tech Spec).
4. Tenha os **detalhes da implementação** (Task Spec).
