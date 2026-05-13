"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_TEMPLATE_LABELS = exports.AgentTemplateType = void 0;
var AgentTemplateType;
(function (AgentTemplateType) {
    AgentTemplateType["CLAUDE_CODE"] = "CLAUDE_CODE";
    AgentTemplateType["CODEX"] = "CODEX";
    AgentTemplateType["VSCODE_COPILOT"] = "VSCODE_COPILOT";
    AgentTemplateType["GEMINI_CLI"] = "GEMINI_CLI";
    AgentTemplateType["GENERIC"] = "GENERIC";
})(AgentTemplateType || (exports.AgentTemplateType = AgentTemplateType = {}));
exports.AGENT_TEMPLATE_LABELS = {
    [AgentTemplateType.CLAUDE_CODE]: 'Claude Code',
    [AgentTemplateType.CODEX]: 'Codex',
    [AgentTemplateType.VSCODE_COPILOT]: 'VS Code / Copilot',
    [AgentTemplateType.GEMINI_CLI]: 'Gemini CLI',
    [AgentTemplateType.GENERIC]: 'Genérico'
};
//# sourceMappingURL=agentTemplate.js.map