# Configuração no Claude Code

Para adicionar o servidor MCP da Brabrix ao Claude Code, utilize o seguinte comando no seu terminal:

```bash
claude mcp add brabrix -- node /ABSOLUTE/PATH/TO/brabrix-mcp-server/dist/index.js
```

### Notas Importantes:

1. **Caminho Absoluto:** Certifique-se de substituir `/ABSOLUTE/PATH/TO/` pelo caminho real onde o projeto foi clonado e compilado.
2. **Variáveis de Ambiente:** O Claude Code geralmente solicita ou permite configurar variáveis de ambiente. Você precisará configurar:
   - `BRABRIX_TOKEN`: Seu token pessoal.
   - `BRABRIX_PROJECT_ID`: O ID do projeto (opcional se usar `.brabrix/config.json`).
3. **Build:** O arquivo `dist/index.js` só existirá após você rodar `npm run build` na pasta do servidor.
