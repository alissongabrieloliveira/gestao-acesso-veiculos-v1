const { verify } = require('jsonwebtoken');

function ensureAuthenticated(request, response, next) {
  const authHeader = request.headers.authorization;

  // 1. Verifica se o token foi enviado
  if (!authHeader) {
    return response.status(401).json({ error: 'Token JWT não informado' });
  }

  // 2. Separa o prefixo "Bearer" do token em si
  // O formato é: "Bearer eyJhbGciOiJIUzI1Ni..."
  const [, token] = authHeader.split(' ');

  try {
    // 3. Valida o token
    const { sub: user_id, role } = verify(token, process.env.JWT_SECRET);

    // 4. Injeta as informações do usuário na requisição
    // Converte para Number pois o ID no banco é Integer
    request.user = {
      id: Number(user_id),
      role: role
    };

    return next();
  } catch (err) {
    return response.status(401).json({ error: 'Token JWT inválido' });
  }
}

module.exports = ensureAuthenticated;