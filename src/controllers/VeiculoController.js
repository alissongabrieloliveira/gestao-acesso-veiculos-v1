const knex = require('../database/connection');

class VeiculoController {
  
  // Listagem (com filtros e paginação)
  async index(req, res) {
    const { page = 1, placa, frota } = req.query;

    const query = knex('veiculos')
      .limit(10)
      .offset((page - 1) * 10)
      .orderBy('created_at', 'desc');

    if (placa) {
      query.where('placa', 'ilike', `%${placa}%`); // ilike = case insensitive
    }

    // Filtro booleano (frota própria ou terceiro)
    if (frota !== undefined) {
      query.where('frota', frota === 'true');
    }

    const [count] = await knex('veiculos').count();
    const veiculos = await query;

    // Retorna dados + metadados de paginação (padrão de API REST)
    res.header('X-Total-Count', count.count);
    return res.json(veiculos);
  }

  // Criação
  async create(req, res) {
    const { placa, modelo, cor, frota } = req.body;
    const usuario_id = req.user.id; // Pega do token JWT

    // Validação básica
    const veiculoExiste = await knex('veiculos').where({ placa }).first();
    if (veiculoExiste) {
      return res.status(400).json({ error: 'Veículo já cadastrado com esta placa.' });
    }

    const trx = await knex.transaction(); // Inicia transação

    try {
      // 1. Insere o Veículo
      const [novoVeiculo] = await trx('veiculos').insert({
        placa: placa.toUpperCase(),
        modelo,
        cor,
        frota: frota || false
      }).returning('*'); // Postgres retorna o objeto inserido

      // 2. Registra o Histórico
      await trx('veiculos_historico').insert({
        id_veiculo: novoVeiculo.id,
        placa: novoVeiculo.placa,
        modelo: novoVeiculo.modelo,
        cor: novoVeiculo.cor,
        frota: novoVeiculo.frota,
        acao: 'INSERT',
        usuario_responsavel: usuario_id
      });

      await trx.commit(); // Confirma tudo
      return res.status(201).json(novoVeiculo);

    } catch (error) {
      await trx.rollback(); // Desfaz se der erro
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar veículo.' });
    }
  }

  // Atualização
  async update(req, res) {
    const { id } = req.params;
    const { modelo, cor, frota } = req.body; // Placa geralmente não se muda, mas pode ser adicionada se quiser
    const usuario_id = req.user.id;

    const veiculo = await knex('veiculos').where({ id }).first();
    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    const trx = await knex.transaction();

    try {
      // 1. Atualiza
      const [veiculoAtualizado] = await trx('veiculos')
        .where({ id })
        .update({
          modelo,
          cor,
          frota,
          updated_at: knex.fn.now()
        })
        .returning('*');

      // 2. Histórico
      await trx('veiculos_historico').insert({
        id_veiculo: id,
        placa: veiculoAtualizado.placa,
        modelo: veiculoAtualizado.modelo,
        cor: veiculoAtualizado.cor,
        frota: veiculoAtualizado.frota,
        acao: 'UPDATE',
        usuario_responsavel: usuario_id
      });

      await trx.commit();
      return res.json(veiculoAtualizado);

    } catch (error) {
      await trx.rollback();
      return res.status(500).json({ error: 'Erro ao atualizar veículo.' });
    }
  }

  // Deleção
  async delete(req, res) {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const veiculo = await knex('veiculos').where({ id }).first();
    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    const trx = await knex.transaction();

    try {
      // 1. Histórico antes de deletar (Snaphost final)
      await trx('veiculos_historico').insert({
        id_veiculo: id,
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        cor: veiculo.cor,
        frota: veiculo.frota,
        acao: 'DELETE',
        usuario_responsavel: usuario_id
      });

      // 2. Deleta
      await trx('veiculos').where({ id }).delete();

      await trx.commit();
      return res.status(204).send(); // 204 = No Content

    } catch (error) {
      await trx.rollback();
      // Erro comum: violação de FK se o veículo já tiver acessos registrados
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Não é possível excluir veículo que possui acessos registrados.' });
      }
      return res.status(500).json({ error: 'Erro ao excluir veículo.' });
    }
  }
}

module.exports = VeiculoController;