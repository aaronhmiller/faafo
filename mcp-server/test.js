// Smoke test: starts a stub of the faafo API, spawns server.js over stdio,
// lists tools, and exercises each one. Run with: npm test
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const users = [{ id: 1, name: 'Marcia', email: 'marcia@example.edu' }]

const stub = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => { body += c })
  req.on('end', () => {
    const json = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
    const text = (code, data) => { res.writeHead(code); res.end(data) }
    const m = req.url.match(/^\/users\/(\d+)$/)
    if (req.method === 'GET' && req.url === '/healthcheck') return json(200, { info: 'stub healthy' })
    if (req.method === 'GET' && req.url === '/users') return json(200, users)
    if (req.method === 'POST' && req.url === '/users') {
      const { name, email } = JSON.parse(body)
      const id = users.length + 1
      users.push({ id, name, email })
      return text(201, `User added with ID: ${id}`)
    }
    if (m) {
      const id = Number(m[1])
      const u = users.find((x) => x.id === id)
      if (req.method === 'GET') return u ? json(200, [u]) : text(200, 'User cannot be retrieved as that ID does not exist.')
      if (req.method === 'PUT') { Object.assign(u, JSON.parse(body)); return text(200, `User updated with ID: ${id}`) }
      if (req.method === 'DELETE') { users.splice(users.indexOf(u), 1); return text(200, `User deleted with ID: ${id}`) }
    }
    text(404, 'not found')
  })
})

await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve))
const port = stub.address().port

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(here, 'server.js')],
  env: { ...process.env, FAAFO_BASE_URL: `http://127.0.0.1:${port}` },
  stderr: 'pipe'
})
const client = new Client({ name: 'faafo-mcp-test', version: '1.0.0' })

let failed = 0
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  -> ${detail}`}`)
  if (!ok) failed++
}

try {
  await client.connect(transport)
  const { tools } = await client.listTools()
  const names = tools.map((t) => t.name).sort()
  check('tools/list', names.join(',') === 'create_user,delete_user,get_user,healthcheck,list_users,update_user', names.join(','))

  const call = async (name, args) => {
    const r = await client.callTool({ name, arguments: args })
    return { isError: !!r.isError, text: r.content[0]?.text ?? '' }
  }

  let r = await call('healthcheck', {})
  check('healthcheck', !r.isError && r.text.includes('stub healthy'), r.text)
  r = await call('list_users', {})
  check('list_users', !r.isError && r.text.includes('Marcia'), r.text)
  r = await call('create_user', { name: 'Amy', email: 'amy@example.com' })
  check('create_user', !r.isError && r.text.includes('ID: 2'), r.text)
  r = await call('get_user', { id: 2 })
  check('get_user', !r.isError && r.text.includes('Amy'), r.text)
  r = await call('update_user', { id: 2, email: 'amy@example.org' })
  check('update_user', !r.isError && r.text.includes('updated'), r.text)
  r = await call('update_user', { id: 2 })
  check('update_user rejects empty update', r.isError, r.text)
  r = await call('delete_user', { id: 2 })
  check('delete_user', !r.isError && r.text.includes('deleted'), r.text)
  r = await call('list_users', {})
  check('list_users after delete', !r.isError && !r.text.includes('Amy'), r.text)
  r = await call('get_user', { id: 0 }).catch((e) => ({ isError: true, text: e.message }))
  check('get_user rejects invalid id', r.isError, r.text)
} finally {
  await client.close().catch(() => {})
  stub.close()
}

console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
