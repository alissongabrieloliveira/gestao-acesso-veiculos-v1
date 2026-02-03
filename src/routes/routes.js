const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const VeiculoController = require('../controllers/VeiculoController');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

const routes = Router();
const authController = new AuthController();
const veiculoController = new VeiculoController();

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

// Rotas de Veículos
routes.get('/veiculos', veiculoController.index);
routes.post('/veiculos', veiculoController.create);
routes.put('/veiculos/:id', veiculoController.update);
routes.delete('/veiculos/:id', veiculoController.delete);

module.exports = routes;