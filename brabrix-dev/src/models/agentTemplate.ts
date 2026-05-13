export enum AgentTemplateType {
    CLAUDE_CODE = 'CLAUDE_CODE',
    CODEX = 'CODEX',
    VSCODE_COPILOT = 'VSCODE_COPILOT',
    GEMINI_CLI = 'GEMINI_CLI',
    GENERIC = 'GENERIC'
}

export const AGENT_TEMPLATE_LABELS: Record<AgentTemplateType, string> = {
    [AgentTemplateType.CLAUDE_CODE]: 'Claude Code',
    [AgentTemplateType.CODEX]: 'Codex',
    [AgentTemplateType.VSCODE_COPILOT]: 'VS Code / Copilot',
    [AgentTemplateType.GEMINI_CLI]: 'Gemini CLI',
    [AgentTemplateType.GENERIC]: 'Genérico'
};

