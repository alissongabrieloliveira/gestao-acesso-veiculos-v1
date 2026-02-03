const knex = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  async create(req, res) {
    const { email, senha } = req.body;

    // 1. Verifica se o usuário existe
    const usuario = await knex('usuarios')
      .where({ email })
      .first();

    if (!usuario) {
      return res.status(401).json({ error: 'E-mail e/ou senha incorretos' });
    }

    // 2. Verifica se o usuário está ativo
    if (!usuario.usuario_ativo) {
      return res.status(403).json({ error: 'Acesso negado. Usuário inativo.' });
    }

    // 3. Verifica a senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail e/ou senha incorretos' });
    }

    // 4. Remove a senha do objeto de retorno (Segurança)
    delete usuario.senha_hash;

    // 5. Gera o Token JWT
    // O payload leva o ID e o Tipo (role) para validações rápidas no front
    const token = jwt.sign(
      { 
        id: usuario.id, 
        role: usuario.id_tipo_usuario 
      }, 
      process.env.JWT_SECRET, 
      {
        subject: String(usuario.id),
        expiresIn: '1d' // Token válido por 1 dia
      }
    );

    return res.json({
      usuario,
      token
    });
  }
}

module.exports = AuthController;