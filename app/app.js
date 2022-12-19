const http = require('http')
const https = require('https')
const express = require('express')
const bodyParser = require('body-parser')
const os = require('os')
const app = express()
const port = 3000
const secPort = 3443
const api = require('./apis')
const terminate = require('./terminate')

const options = {
  key: process.env.KEY,
  cert: process.env.CERT
}

const httpServer = http.createServer(app)
const httpsServer = https.createServer(options, app)

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

app.get('/', (req, res) => {
  res.json({ info: 'Node.js, Express, and Postgres running in ' + `${os.platform}` + ' on ' + `${os.arch}` })
})

app.get('/healthcheck', (req, res) => {
  res.json({ info: 'crud-app healthy and running in ' + `${os.platform}` + ' on ' + `${os.arch}` })
})

app.get('/uptime', (req, res) => {
  res.json({ uptime: 'crud-app has been running for ' + Math.floor(Math.floor(Math.floor(process.uptime())/3600)/24) + ' days.' })
})

const exitHandlerHttp = terminate(httpServer, {
  coredump: false,
  timeout: 500
})

const exitHandlerHttps = terminate(httpsServer, {
  coredump: false,
  timeout: 500
})

process.on('uncaughtException', exitHandlerHttp(1, 'Unexpected Error'))
process.on('unhandledRejection', exitHandlerHttp(1, 'Unhandled Promise'))
process.on('SIGTERM', exitHandlerHttp(0, 'SIGTERM'))
process.on('SIGINT', exitHandlerHttp(0, 'SIGINT'))

process.on('uncaughtException', exitHandlerHttps(1, 'Unexpected Error'))
process.on('unhandledRejection', exitHandlerHttps(1, 'Unhandled Promise'))
process.on('SIGTERM', exitHandlerHttps(0, 'SIGTERM'))
process.on('SIGINT', exitHandlerHttps(0, 'SIGINT'))

app.get('/users', api.getUsers)
app.get('/users/:id', api.getUserById)
app.post('/users', api.createUser)
app.put('/users/:id', api.updateUser)
app.delete('/users/:id', api.deleteUser)

httpServer.listen(port, () => {
  console.log(`App running in ${os.platform} on port ${port} on ${os.arch}.`)
})
httpsServer.listen(secPort, () => {
  console.log(`App running in ${os.platform} on port ${secPort} on ${os.arch}.`)
})

/* API doc
GET    /users     | getUsers()
GET    /users/:id | getUserById()
POST   /users     | createUser()
PUT    /users/:id | updateUser()
DELETE /users/:id | deleteUser()
*/
