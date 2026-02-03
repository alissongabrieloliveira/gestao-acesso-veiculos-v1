require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes/routes');

// Inicializa o app
const app = express();

// Middlewares Globais
app.use(helmet()); // Segurança
app.use(cors());   // Permite acesso externo (frontend)
app.use(express.json()); // Entende JSON no corpo da requisição

// Rotas (Placeholder)
app.use(routes);

// Rota de Health Check (para testar se o servidor está de pé)
app.get('/', (req, res) => {
  return res.json({ message: 'SaaS Veículos API - Online', version: '1.0.0' });
});

// Tratamento de Erros (Middleware final)
app.use((error, req, res, next) => {
  console.error(error); // Log do erro no terminal
  return res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});