require('dotenv').config();
const path = require('path');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations'),
      extension: 'js'
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds'),
      extension: 'js'
    },
    useNullAsDefault: true,
    // Debug opcional: mostra as queries SQL no terminal
    // debug: true 
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: { rejectUnauthorized: false } // Necessário para muitos hosts de cloud (Render, Heroku, etc)
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    }
  }

};