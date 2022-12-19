const Pool = require('pg').Pool
const pool = new Pool({
  user: 'salt',
  host: 'postgres',
  database: 'api',
  password: 'salt',
  port: 5432
})

const getUsers = (req, res) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    if (results.rows == 0) {
      res.status(200).send(`No users exist.`)
    } else {
      res.status(200).json(results.rows)
    }
  })
}

const getUserById = (req, res) => {
  const id = parseInt(req.params.id) || 0
  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    if (results.rows == 0) {
      res.status(200).send(`User cannot be retrieved as that ID does not exist.`)
    } else {
      res.status(200).json(results.rows)
    }
  })
}

const createUser = (req, res) => {
  const { name, email } = req.body

  if (!name) {
    return res.status(400).send({
      message: 'Name cannot be empty'
    })
  }

  pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name, email], (error, results) => {
    if (error) {
      throw error
    }
    const newID = results.rows[0].id
    res.status(201).send(`User added with ID: ${newID}`)
  })
}

const updateUser = (req, res) => {
  const id = parseInt(req.params.id)
  const { name, email } = req.body

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    if (results.rows == 0) {
      res.status(200).send(`User cannot be updated because that ID does not exist.`)
    } else {
      if (!name && !email) {
        res.status(400).send(`Either name and/or email must be sent.`)
      } else if (!name) {
        pool.query('UPDATE users SET email = $1 WHERE id = $2',[email, id], (error) => {
          if (error) {
            throw error
          }
          res.status(200).send(`User email updated with ID: ${id}`)
        })
      } else if (!email) {
        pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, id], (error) => {
          if (error) {
            throw error
          }
          res.status(200).send(`User name updated with ID: ${id}`)
        })
      } else {
        pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, id], (error) => {
          if (error) {
            throw error
          }
          res.status(200).send(`User name and email updated with ID: ${id}`)
        })
      }
    }
  })
}

const deleteUser = (req, res) => {
  const id = parseInt(req.params.id)

  pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    if (results.rows == 0) {
      res.status(200).send(`User cannot be deleted because that ID does not exist.`)
    } else {
      pool.query('DELETE FROM users WHERE id = $1', [id], (error) => {
        if (error) {
          throw error
        }
        res.status(200).send(`User deleted with ID: ${id}`)
      })
    }
  })
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}
