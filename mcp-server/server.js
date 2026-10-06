#!/usr/bin/env node
// MCP server that exposes the faafo users REST API (app/app.js) as tools.
// Transport: stdio. Point FAAFO_BASE_URL at a running faafo instance.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL = (process.env.FAAFO_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

async function callApi (method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data)
    throw new Error(`faafo API ${method} ${path} -> HTTP ${res.status}: ${detail}`)
  }
  return data
}

function asResult (data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return { content: [{ type: 'text', text }] }
}

function asError (err) {
  return { isError: true, content: [{ type: 'text', text: err.message }] }
}

const server = new McpServer({ name: 'faafo', version: '1.0.0' })

server.registerTool(
  'healthcheck',
  {
    title: 'Health check',
    description: 'Check that the faafo API is up. Returns platform and architecture info.',
    annotations: { readOnlyHint: true }
  },
  async () => {
    try {
      return asResult(await callApi('GET', '/healthcheck'))
    } catch (err) {
      return asError(err)
    }
  }
)

server.registerTool(
  'list_users',
  {
    title: 'List users',
    description: 'List all users in the faafo database, ordered by id.',
    annotations: { readOnlyHint: true }
  },
  async () => {
    try {
      return asResult(await callApi('GET', '/users'))
    } catch (err) {
      return asError(err)
    }
  }
)

server.registerTool(
  'get_user',
  {
    title: 'Get user',
    description: 'Fetch a single user by numeric id.',
    inputSchema: { id: z.number().int().positive().describe('User id') },
    annotations: { readOnlyHint: true }
  },
  async ({ id }) => {
    try {
      return asResult(await callApi('GET', `/users/${id}`))
    } catch (err) {
      return asError(err)
    }
  }
)

server.registerTool(
  'create_user',
  {
    title: 'Create user',
    description: 'Create a new user. Name is required; email is optional.',
    inputSchema: {
      name: z.string().min(1).max(30).describe('Display name (max 30 chars)'),
      email: z.string().max(30).optional().describe('Email address (max 30 chars)')
    }
  },
  async ({ name, email }) => {
    try {
      return asResult(await callApi('POST', '/users', { name, email }))
    } catch (err) {
      return asError(err)
    }
  }
)

server.registerTool(
  'update_user',
  {
    title: 'Update user',
    description: 'Update the name and/or email of an existing user. At least one field must be given.',
    inputSchema: {
      id: z.number().int().positive().describe('User id'),
      name: z.string().min(1).max(30).optional().describe('New display name'),
      email: z.string().max(30).optional().describe('New email address')
    },
    annotations: { idempotentHint: true }
  },
  async ({ id, name, email }) => {
    if (name === undefined && email === undefined) {
      return asError(new Error('Provide name and/or email to update.'))
    }
    try {
      return asResult(await callApi('PUT', `/users/${id}`, { name, email }))
    } catch (err) {
      return asError(err)
    }
  }
)

server.registerTool(
  'delete_user',
  {
    title: 'Delete user',
    description: 'Permanently delete a user by id.',
    inputSchema: { id: z.number().int().positive().describe('User id') },
    annotations: { destructiveHint: true }
  },
  async ({ id }) => {
    try {
      return asResult(await callApi('DELETE', `/users/${id}`))
    } catch (err) {
      return asError(err)
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
// stdout is the MCP channel; log to stderr only.
console.error(`faafo MCP server ready (API: ${BASE_URL})`)
