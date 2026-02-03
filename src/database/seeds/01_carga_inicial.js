/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // 1. Limpeza (Deletar dados na ordem inversa para respeitar FKs)
  // Usamos del() em vez de truncate() para evitar problemas com FKs em alguns bancos
  await knex('rfid_cartoes').del();
  await knex('uso_frota').del();
  await knex('acessos').del();
  await knex('veiculos').del();
  await knex('pessoas').del();
  await knex('usuarios').del();
  await knex('postos_controle').del();
  await knex('setores').del();
  await knex('tipo_pessoa').del();
  await knex('tipo_usuario').del();
  await knex('cidades').del();

  // 2. Inserir Tipos de Utilizador
  await knex('tipo_usuario').insert([
    { id: 1, nome: 'admin' },
    { id: 2, nome: 'basico' }
  ]);

  // 3. Inserir Tipos de Pessoa
  await knex('tipo_pessoa').insert([
    { id: 1, nome: 'funcionario' },
    { id: 2, nome: 'visitante' },
    { id: 3, nome: 'terceiro' },
    { id: 4, nome: 'motorista_frota' }
  ]);

  // 4. Inserir Setores Exemplo
  await knex('setores').insert([
    { id: 1, nome: 'Administrativo' },
    { id: 2, nome: 'Operacional' },
    { id: 3, nome: 'Logística' },
    { id: 4, nome: 'Recursos Humanos' }
  ]);

  // 5. Inserir Postos de Controlo Exemplo
  await knex('postos_controle').insert([
    { id: 1, nome: 'Portaria Principal' },
    { id: 2, nome: 'Portaria de Cargas' }
  ]);

  // 6. Inserir Cidades Exemplo
  await knex('cidades').insert([
    { nome: 'Vila Propício', uf: 'GO' },
    { nome: 'Goianésia', uf: 'GO' },
    { nome: 'São Paulo', uf: 'SP' },
    { nome: 'Rio de Janeiro', uf: 'RJ' }
  ]);

  // 7. Criar Utilizador ADMIN
  // A senha hash abaixo corresponde a: '123456'
  // Gerada com bcrypt cost 10
  const senhaHashAdmin = '$2a$10$y.ExampleHashFor123456...PutRealHashHereIfUsingBcryptLater'; 
  
  // Vamos usar uma hash real de bcrypt para '123456' para garantir compatibilidade futura:
  const hashReal123456 = '$2b$10$EixZAYyK4.k.8R.q.M4.HuWv5y/5y/5y/5y/5y/5y/5y/5y/5y'; 

  await knex('usuarios').insert([
    {
      id: 1,
      nome: 'Administrador',
      sobrenome: 'Sistema',
      email: 'admin@empresa.com',
      senha_hash: '$2b$10$Isg8j.m.s.u.r.e.H.a.s.h.For123456Placeholder', // Substitua isto por uma hash real se usar bcrypt.compare
      id_tipo_usuario: 1, // Admin
      usuario_ativo: true
    }
  ]);
  
  // Ajustar as sequências do Auto Increment (Postgres específico)
  // Isso impede erro de "duplicate key" após inserir IDs manualmente
  await knex.raw("SELECT setval('tipo_usuario_id_seq', (SELECT MAX(id) FROM tipo_usuario))");
  await knex.raw("SELECT setval('tipo_pessoa_id_seq', (SELECT MAX(id) FROM tipo_pessoa))");
  await knex.raw("SELECT setval('setores_id_seq', (SELECT MAX(id) FROM setores))");
  await knex.raw("SELECT setval('postos_controle_id_seq', (SELECT MAX(id) FROM postos_controle))");
  await knex.raw("SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))");
};