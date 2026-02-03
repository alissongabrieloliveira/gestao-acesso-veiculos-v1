const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

const routes = Router();
const authController = new AuthController();

// Rotas Públicas
routes.post('/login', authController.create);

// Rotas Protegidas
routes.use(ensureAuthenticated);

// Rota de teste para validar o token (depois sera removida)
routes.get('/me', (req, res) => {
    return res.json({ 
      ok: true, 
      user_id: req.user.id,
      role: req.user.role,
      message: 'Você está autenticado!' 
    });
  });

module.exports = routes;