export interface ScanAgentDefinition {
  key: string;
  name: string;
}

export const SCAN_AGENTS: ScanAgentDefinition[] = [
  { key: "sql-injection", name: "SQL Injection Agent" },
  { key: "xss", name: "Cross-Site Scripting Agent" },
  { key: "csrf", name: "CSRF Agent" },
  { key: "ssrf", name: "SSRF Agent" },
  { key: "command-injection", name: "Command Injection Agent" },
  { key: "directory-traversal", name: "Directory Traversal Agent" },
  { key: "file-inclusion", name: "File Inclusion Agent" },
  { key: "open-redirect", name: "Open Redirect Agent" },
  { key: "security-headers", name: "Security Headers Agent" },
  { key: "authentication", name: "Authentication Agent" },
  { key: "authorization", name: "Authorization Agent" },
  { key: "rate-limiting", name: "Rate Limiting Agent" },
  { key: "cors", name: "CORS Agent" },
  { key: "information-disclosure", name: "Information Disclosure Agent" },
  { key: "subdomain-enumeration", name: "Subdomain Enumeration Agent" },
  { key: "port-scan", name: "Port Scan Agent" },
  { key: "technology-detection", name: "Technology Detection Agent" },
  { key: "tls-configuration", name: "TLS Configuration Agent" },
  { key: "http-methods", name: "HTTP Methods Agent" },
  { key: "api-security", name: "API Security Agent" },
];