import apiClient from '../apiClient';
import config from '../config';

const http = apiClient.instance;

export const MCP_SERVER_URL = `${config.apiUrl}/api/mcp/server`;

export const requestMcpCode = (email) =>
  http.post('/api/mcp/auth/request-code', { email }).then((r) => r.data);

export const verifyMcpCode = (email, code) =>
  http.post('/api/mcp/auth/verify-code', { email, code }).then((r) => r.data);
