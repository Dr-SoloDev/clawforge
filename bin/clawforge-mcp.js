#!/usr/bin/env node

/**
 * ClawForge MCP Server Binary
 * Entry point for MCP server
 */

import { ClawForgeMCPServer } from '../src/mcp/clawforge-mcp-server.js';

const server = new ClawForgeMCPServer();

server.start().catch((error) => {
  console.error('Failed to start ClawForge MCP server:', error);
  process.exit(1);
});
