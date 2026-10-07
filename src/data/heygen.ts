export const heygenExperience = {
  role: "Software Engineering Intern",
  date: "May. 2026 - Aug. 2026",
  location: "Palo Alto, CA",
  summary:
    "Built AI agent infrastructure spanning low-latency security classification, repository knowledge graphs, and multi-user agent services.",
  bullets: [
    "Evaluated 8 classifiers on 449 cases and optimized Gemma 2B with llama.cpp for an agent data-security layer, achieving 99.6% accuracy with latency under 300 ms in evaluation.",
    "Shipped an MCP repository knowledge graph for coding-agent retrieval, reducing context usage 71× and inference cost 54% in controlled A/B evaluations.",
    "Optimized graph construction with PyArrow/KuzuDB bulk loading and edge indexing, reducing relationship resolution from O(N×E) to O(N+E); measured build time was 8m 19s versus 42m for GitNexus.",
    "Built Go services and Python sidecars for OpenClaw, Hermes, and Claude Code agents, implementing multi-user authorization, spend enforcement, MCP provisioning, and gateway lifecycle management.",
  ],
};
