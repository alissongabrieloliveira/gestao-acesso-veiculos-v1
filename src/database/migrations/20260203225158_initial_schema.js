/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // 1. Tabelas Auxiliares e de Tipos
    await knex.schema.createTable('tipo_usuario', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable().unique(); // 'admin', 'basico'
    });
  
    await knex.schema.createTable('tipo_pessoa', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable(); // 'funcionario', 'visitante', 'terceiro'
    });
  
    await knex.schema.createTable('setores', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable();
    });
  
    await knex.schema.createTable('postos_controle', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable(); // 'portaria 1', 'portaria sul'
    });
  
    await knex.schema.createTable('cidades', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.string('uf', 2).notNullable();
    });
  
    // 2. Tabela de Usuários (Sistema)
    await knex.schema.createTable('usuarios', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.string('sobrenome').notNullable();
      table.string('email').notNullable().unique();
      table.string('senha_hash').notNullable();
      table.integer('id_tipo_usuario').unsigned().references('id').inTable('tipo_usuario');
      table.boolean('usuario_ativo').defaultTo(true);
      table.timestamps(true, true); // created_at, updated_at
    });
  
    await knex.schema.createTable('usuarios_historico', (table) => {
      table.increments('id').primary();
      table.integer('id_usuario').notNullable(); // Não é FK para manter histórico se user for deletado
      table.string('nome');
      table.string('sobrenome');
      table.string('email');
      table.integer('id_tipo_usuario');
      table.boolean('usuario_ativo');
      table.enum('acao', ['INSERT', 'UPDATE', 'DELETE', 'BLOCK', 'UNBLOCK']).notNullable();
      table.timestamp('data_acao').defaultTo(knex.fn.now());
      table.integer('usuario_responsavel').unsigned().references('id').inTable('usuarios');
    });
  
    // 3. Tabela de Pessoas (Motoristas, Visitantes, etc)
    await knex.schema.createTable('pessoas', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.string('cpf').unique().notNullable();
      table.string('telefone');
      table.integer('id_tipo_pessoa').unsigned().references('id').inTable('tipo_pessoa');
      table.timestamps(true, true);
    });
  
    await knex.schema.createTable('pessoas_historico', (table) => {
      table.increments('id').primary();
      table.integer('id_pessoa').notNullable();
      table.string('nome');
      table.string('cpf');
      table.string('telefone');
      table.integer('id_tipo_pessoa');
      table.enum('acao', ['INSERT', 'UPDATE', 'DELETE']).notNullable();
      table.timestamp('data_acao').defaultTo(knex.fn.now());
      table.integer('usuario_responsavel').unsigned().references('id').inTable('usuarios');
    });
  
    // 4. RFID
    await knex.schema.createTable('rfid_cartoes', (table) => {
      table.increments('id').primary();
      table.string('codigo_rfid').unique().notNullable();
      table.integer('id_pessoa').unsigned().references('id').inTable('pessoas');
      table.boolean('ativo').defaultTo(true);
      table.enum('tipo', ['PERMANENTE', 'TEMPORARIO']).notNullable();
      table.timestamp('data_atribuicao').defaultTo(knex.fn.now());
      table.timestamp('data_revogacao');
      table.string('observacao');
    });
  
    await knex.schema.createTable('rfid_cartoes_historico', (table) => {
      table.increments('id').primary();
      table.integer('id_rfid_cartao').notNullable();
      table.string('codigo_rfid');
      table.integer('id_pessoa');
      table.boolean('ativo');
      table.enum('acao', ['ATRIBUICAO', 'BLOQUEIO', 'DESBLOQUEIO', 'REVOGACAO', 'DEVOLUCAO']).notNullable();
      table.timestamp('data_acao').defaultTo(knex.fn.now());
      table.integer('usuario_responsavel').unsigned().references('id').inTable('usuarios');
    });
  
    // 5. Veículos
    await knex.schema.createTable('veiculos', (table) => {
      table.increments('id').primary();
      table.string('placa').unique().notNullable();
      table.string('modelo').notNullable();
      table.string('cor');
      table.boolean('frota').defaultTo(false); // Define se é frota própria
      table.timestamps(true, true);
    });
  
    await knex.schema.createTable('veiculos_historico', (table) => {
      table.increments('id').primary();
      table.integer('id_veiculo').notNullable();
      table.string('placa');
      table.string('modelo');
      table.string('cor');
      table.boolean('frota');
      table.enum('acao', ['INSERT', 'UPDATE', 'DELETE']).notNullable();
      table.timestamp('data_acao').defaultTo(knex.fn.now());
      table.integer('usuario_responsavel').unsigned().references('id').inTable('usuarios');
    });
  
    // 6. Controle de Acesso (Portaria Geral)
    await knex.schema.createTable('acessos', (table) => {
      table.increments('id').primary();
      table.integer('id_pessoa').unsigned().notNullable().references('id').inTable('pessoas');
      table.integer('id_veiculo').unsigned().nullable().references('id').inTable('veiculos'); // Pode ser pedestre
      table.integer('id_setor').unsigned().references('id').inTable('setores');
      
      // Entrada
      table.integer('id_usuario_entrada').unsigned().references('id').inTable('usuarios');
      table.integer('id_posto_controle_entrada').unsigned().references('id').inTable('postos_controle');
      table.integer('km_entrada').nullable();
      table.timestamp('data_hora_entrada').defaultTo(knex.fn.now());
      table.string('motivo_visita');
      
      // Saída
      table.integer('id_usuario_saida').unsigned().nullable().references('id').inTable('usuarios');
      table.integer('id_posto_controle_saida').unsigned().nullable().references('id').inTable('postos_controle');
      table.integer('km_saida').nullable();
      table.timestamp('data_hora_saida').nullable();
      table.string('obs_saida').nullable();
      
      table.enum('status', ['ABERTO', 'FECHADO']).defaultTo('ABERTO');
  
      // Índices
      table.index('status');
      table.index(['id_pessoa', 'status']);
      table.index(['id_veiculo', 'status']);
      table.index('data_hora_entrada');
    });
  
    // 7. Controle de Frota (Viagens)
    await knex.schema.createTable('uso_frota', (table) => {
      table.increments('id').primary();
      table.integer('id_veiculo').unsigned().notNullable().references('id').inTable('veiculos');
      table.integer('id_motorista').unsigned().notNullable().references('id').inTable('pessoas');
      
      // Saída
      table.integer('id_usuario_saida').unsigned().notNullable().references('id').inTable('usuarios');
      table.integer('id_posto_controle_saida').unsigned().notNullable().references('id').inTable('postos_controle');
      table.integer('km_saida').notNullable();
      table.integer('id_cidade_destino').unsigned().references('id').inTable('cidades');
      table.string('motivo_saida').notNullable();
      table.timestamp('data_hora_saida').defaultTo(knex.fn.now());
      
      // Chegada (Retorno)
      table.integer('id_usuario_chegada').unsigned().nullable().references('id').inTable('usuarios');
      table.integer('id_posto_controle_chegada').unsigned().nullable().references('id').inTable('postos_controle');
      table.integer('km_chegada').nullable();
      table.string('obs_chegada').nullable();
      table.timestamp('data_hora_chegada').nullable();
      
      table.enum('status', ['EM_USO', 'RETORNOU']).defaultTo('EM_USO');
  
      // Índices
      table.index('status');
      table.index(['id_veiculo', 'status']);
      table.index('data_hora_saida');
    });
  
    // 8. Logs de Auditoria de Dados Sensíveis (LGPD/Compliance)
    await knex.schema.createTable('log_consulta_dados_sensiveis', (table) => {
      table.increments('id').primary();
      table.integer('id_usuario').unsigned().references('id').inTable('usuarios');
      table.string('tabela').notNullable(); // Qual tabela foi acessada
      table.integer('registro_id').notNullable(); // Qual ID foi acessado
      table.enum('acao', ['SELECT', 'EXPORT', 'PRINT']).notNullable();
      table.timestamp('data_hora').defaultTo(knex.fn.now());
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    // Ordem reversa para evitar erro de FK
    await knex.schema.dropTableIfExists('log_consulta_dados_sensiveis');
    await knex.schema.dropTableIfExists('uso_frota');
    await knex.schema.dropTableIfExists('acessos');
    await knex.schema.dropTableIfExists('veiculos_historico');
    await knex.schema.dropTableIfExists('veiculos');
    await knex.schema.dropTableIfExists('rfid_cartoes_historico');
    await knex.schema.dropTableIfExists('rfid_cartoes');
    await knex.schema.dropTableIfExists('pessoas_historico');
    await knex.schema.dropTableIfExists('pessoas');
    await knex.schema.dropTableIfExists('usuarios_historico');
    await knex.schema.dropTableIfExists('usuarios');
    await knex.schema.dropTableIfExists('cidades');
    await knex.schema.dropTableIfExists('postos_controle');
    await knex.schema.dropTableIfExists('setores');
    await knex.schema.dropTableIfExists('tipo_pessoa');
    await knex.schema.dropTableIfExists('tipo_usuario');
  };