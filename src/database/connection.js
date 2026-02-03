const knex = require('knex');
const configuration = require('../../knexfile');

// Define se usa config de desenvolvimento ou produção
const config = process.env.NODE_ENV === 'production' 
  ? configuration.production 
  : configuration.development;

const connection = knex(config);

module.exports = connection;