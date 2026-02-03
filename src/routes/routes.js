const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

const routes = Router();
const authController = new AuthController();

// Rotas Públicas
routes.post('/login', authController.create);

module.exports = routes;