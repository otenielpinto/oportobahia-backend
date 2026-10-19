const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const controllerPath = resolve(__dirname, '../src/controller/apurarRoyaltiesController.js');

async function apurar(tipos) {
  const movimentos = [];
  const notas = tipos.map((tipoVenda) => ({
    tipoVenda,
    data_movto: new Date('2026-01-15T12:00:00Z'),
    cliente: { uf: 'SP' },
    itens: [{ prod: { cEAN: '123', qCom: '10', vProd: '1000' } }],
  }));
  class Repository {
    async findById() { return { uf: 'SP' }; }
    async findOne() {
      return { tipo: 'CD', listaPreco: 'LISTA', numeroDiscos: 1,
        numeroFaixas: 10, percentual: 10, custo_operativo: 5 };
    }
    async findAll() {
      return [{ id: 1, gtin: '123', name: 'CD', limite_faixas: 12, percentual_faixa: 0.5 }];
    }
    async findByProdutoAndListaPreco() { return { preco: 100 }; }
    async insertMany(items) { movimentos.push(...items); }
  }
  const context = {
    console, Date,
    lib: { round: (value) => Math.round(value * 100) / 100, newUUId: () => 'movement-id' },
    TMongo: { connect: async () => ({ collection: (name) => {
      assert.equal(name, 'nota_fiscal');
      return { find: (query) => ({ toArray: async () => notas.filter((nf) => {
        const matchesType = typeof query.tipoVenda === 'string'
          ? nf.tipoVenda === query.tipoVenda
          : query.tipoVenda.$in.includes(nf.tipoVenda);
        return matchesType && nf.data_movto >= query.data_movto.$gte
          && nf.data_movto <= query.data_movto.$lte;
      }) }) };
    } }) },
    CalculoImpostoService: class {
      calcular() {
        const imposto = { aliquota: 0, valor: 0 };
        return { icms: { aliquota: 10, valor: 100 }, cofins: imposto,
          pis: imposto, ipi: imposto, total_impostos: 100, base_calculo: 1000 };
      }
    },
  };
  for (const name of ['ProdutoRoyaltyRepository', 'ProdutoRepository',
    'ApuracaoRoyaltiesMovtoRepository', 'EmpresaRepository', 'TributacaoRepository',
    'ListaPrecoExcecoesRepository', 'FormatoRepository']) context[name] = Repository;
  // Load the exported controller with in-memory dependencies; never connect to MongoDB.
  const source = readFileSync(controllerPath, 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  vm.createContext(context);
  vm.runInContext(`${source}\nglobalThis.processar = _processarCab;`, context);
  const result = await context.processar({ id: 'cab-id', id_tenant: 1, id_empresa: 1,
    dataInicial: '2026-01-01', dataFinal: '2026-01-31' });
  return { result, movimentos };
}

function assertCalculos(movimento) {
  assert.equal(movimento.id_royalty_cab, 'cab-id');
  assert.equal(movimento.quantFaturada, 10);
  assert.equal(movimento.totalImpostos, 100);
  assert.equal(movimento.custoOperativo, 50);
  assert.equal(movimento.valorSemImpostos, 900);
  assert.equal(movimento.baseCalculoRoyalties, 850);
  assert.equal(movimento.valorRoyalties, 85);
  assert.equal(movimento.baseCalculoLista, 900);
  assert.equal(movimento.copyrightNormal, 54);
  assert.equal(movimento.percentual, 6);
}

test('sales retain their calculations and store tipoVenda V', async () => {
  const { result, movimentos } = await apurar(['V']);
  assert.equal(result.insertedCount, 1);
  assert.equal(result.logs.length, 0);
  assertCalculos(movimentos[0]);
  assert.equal(movimentos[0].tipoVenda, 'V');
});

test('sales and bonuses share calculations, preserve their types and exclude other notes', async () => {
  const { result, movimentos } = await apurar(['V', 'B', 'D']);
  assert.equal(result.insertedCount, 2);
  assert.equal(result.logs.length, 0);
  assert.deepEqual(movimentos.map((item) => item.tipoVenda), ['V', 'B']);
  movimentos.forEach(assertCalculos);
});
