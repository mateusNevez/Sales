const CHAVE_STORAGE = 'dashboard-vendas-v1';

const estado = {
  vendas: [],
  ordenacao: 'adicao',
  idEditando: null
};

const el = {
  dataAtual:     document.getElementById('dataAtual'),
  badgeDia:      document.getElementById('badgeDia'),

  totalVendas:   document.getElementById('totalVendas'),
  subTotal:      document.getElementById('subTotal'),
  vendasHoje:    document.getElementById('vendasHoje'),
  qtdHoje:       document.getElementById('qtdHoje'),
  qtdVendas:     document.getElementById('qtdVendas'),
  ticketMedio:   document.getElementById('ticketMedio'),

  form:          document.getElementById('formVenda'),
  inputValor:    document.getElementById('valor'),
  btnSalvar:     document.getElementById('btnSalvar'),
  btnCancelar:   document.getElementById('btnCancelar'),

  ordenacao:     document.getElementById('ordenacao'),
  lista:         document.getElementById('listaVendas'),
  contador:      document.getElementById('contadorLista'),
  vazio:         document.getElementById('vazio'),

  toast:         document.getElementById('toast')
};

function formatarMoeda(valor) {
  const n = Number(valor);
  if (!isFinite(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function converterValorParaNumero(texto) {
  if (typeof texto !== 'string') return NaN;

  let limpo = texto.trim().replace(/[R$\s]/g, '');
  if (!limpo) return NaN;

  const temVirgula = limpo.includes(',');
  const temPonto   = limpo.includes('.');

  if (temVirgula && temPonto) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (temVirgula) {
    limpo = limpo.replace(',', '.');
  } else if (temPonto) {
    const partes = limpo.split('.');
    const ehMilhar = partes.length > 1 &&
                     partes.slice(1).every((p) => p.length === 3);
    if (ehMilhar) {
      limpo = limpo.replace(/\./g, '');
    }
  }

  const numero = parseFloat(limpo);
  return isFinite(numero) ? numero : NaN;
}

function formatarDataHora(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function criarId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function proximoIndice() {
  return estado.vendas.reduce((max, v) => Math.max(max, Number(v.indice) || 0), 0) + 1;
}

function carregarVendas() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    const dados = bruto ? JSON.parse(bruto) : [];

    if (!Array.isArray(dados)) {
      estado.vendas = [];
      return;
    }

    estado.vendas = dados
      .filter((v) => v && isFinite(Number(v.valor)))
      .map((v, i) => ({
        id: v.id || criarId(),
        valor: Number(v.valor),
        criadoEm: v.criadoEm || new Date().toISOString(),
        indice: Number(v.indice) || (i + 1)
      }));

    estado.vendas.sort((a, b) => a.indice - b.indice);

  } catch (erro) {
    console.warn('Falha ao ler o localStorage:', erro);
    estado.vendas = [];
  }
}

function salvarVendas() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado.vendas));
  } catch (erro) {
    console.warn('Falha ao gravar no localStorage:', erro);
    mostrarToast('Não foi possível salvar os dados.', 'erro');
  }
}

function ordenarVendas(lista) {
  const copia = [...lista];

  switch (estado.ordenacao) {
    case 'adicao':      return copia.sort((a, b) => a.indice - b.indice);
    case 'adicao-desc': return copia.sort((a, b) => b.indice - a.indice);
    case 'maior':       return copia.sort((a, b) => b.valor - a.valor || a.indice - b.indice);
    case 'menor':       return copia.sort((a, b) => a.valor - b.valor || a.indice - b.indice);
    default:            return copia;
  }
}

function atualizarDataAtual() {
  const hoje = new Date();

  const extenso = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
  el.dataAtual.textContent = extenso.charAt(0).toUpperCase() + extenso.slice(1);

  const curto = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  el.badgeDia.textContent = `Hoje · ${curto}`;
}

function renderizarResumo() {
  const total = estado.vendas.reduce((soma, v) => soma + v.valor, 0);
  const qtd = estado.vendas.length;
  const ticket = qtd > 0 ? total / qtd : 0;

  const hojeStr = new Date().toDateString();
  const vendasDeHoje = estado.vendas.filter(
    (v) => new Date(v.criadoEm).toDateString() === hojeStr
  );
  const totalHoje = vendasDeHoje.reduce((soma, v) => soma + v.valor, 0);

  el.totalVendas.textContent = formatarMoeda(total);
  el.subTotal.textContent = `${qtd} ${qtd === 1 ? 'registro' : 'registros'}`;

  el.vendasHoje.textContent = formatarMoeda(totalHoje);
  el.qtdHoje.textContent = `${vendasDeHoje.length} ${vendasDeHoje.length === 1 ? 'venda' : 'vendas'}`;

  el.qtdVendas.textContent = qtd;
  el.ticketMedio.textContent = formatarMoeda(ticket);
}

function montarItemHTML(venda) {
  const emEdicao = estado.idEditando === venda.id;

  return `
    <li class="item ${emEdicao ? 'item--editando' : ''}">
      <span class="item__indice" title="Ordem de adição">#${venda.indice}</span>

      <div class="item__info">
        <span class="item__data">${formatarDataHora(venda.criadoEm)}</span>
      </div>

      <span class="item__valor">${formatarMoeda(venda.valor)}</span>

      <div class="item__acoes">
        <button type="button" class="icon-btn icon-btn--editar"
                data-acao="editar" data-id="${venda.id}"
                title="Editar venda" aria-label="Editar venda">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>

        <button type="button" class="icon-btn icon-btn--remover"
                data-acao="remover" data-id="${venda.id}"
                title="Remover venda" aria-label="Remover venda">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    </li>
  `;
}

function renderizarLista() {
  const ordenadas = ordenarVendas(estado.vendas);

  el.contador.textContent = `(${ordenadas.length})`;

  if (ordenadas.length === 0) {
    el.lista.innerHTML = '';
    el.lista.hidden = true;
    el.vazio.hidden = false;
    return;
  }

  el.lista.hidden = false;
  el.vazio.hidden = true;
  el.lista.innerHTML = ordenadas.map(montarItemHTML).join('');
}

function renderizar() {
  atualizarDataAtual();
  renderizarResumo();
  renderizarLista();
}

let toastTimer = null;

function mostrarToast(mensagem, tipo = 'ok') {
  el.toast.textContent = mensagem;
  el.toast.className = 'toast toast--visivel' + (tipo === 'erro' ? ' toast--erro' : '');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.remove('toast--visivel');
  }, 2600);
}

function adicionarVenda(valor) {
  estado.vendas.push({
    id: criarId(),
    valor,
    criadoEm: new Date().toISOString(),
    indice: proximoIndice()
  });
  salvarVendas();
  renderizar();
}

function atualizarVenda(id, valor) {
  const venda = estado.vendas.find((v) => v.id === id);
  if (!venda) return;

  venda.valor = valor;

  salvarVendas();
  renderizar();
}

function iniciarEdicao(id) {
  const venda = estado.vendas.find((v) => v.id === id);
  if (!venda) return;

  estado.idEditando = id;

  el.inputValor.value = Number(venda.valor).toFixed(2).replace('.', ',');

  el.btnSalvar.textContent = 'Salvar alterações';
  el.btnCancelar.hidden = false;

  renderizarLista();

  el.inputValor.focus();
  el.inputValor.select();
}

function cancelarEdicao() {
  estado.idEditando = null;
  el.form.reset();
  el.btnSalvar.textContent = 'Adicionar';
  el.btnCancelar.hidden = true;
}

function removerVenda(id) {
  const venda = estado.vendas.find((v) => v.id === id);
  if (!venda) return;

  const confirmar = window.confirm(`Remover a venda de ${formatarMoeda(venda.valor)}?`);
  if (!confirmar) return;

  estado.vendas = estado.vendas.filter((v) => v.id !== id);

  if (estado.idEditando === id) cancelarEdicao();

  salvarVendas();
  renderizar();
  mostrarToast('Venda removida.');
}

el.form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const valor = converterValorParaNumero(el.inputValor.value);

  if (!isFinite(valor) || valor <= 0) {
    mostrarToast('Informe um valor válido maior que zero.', 'erro');
    el.inputValor.focus();
    return;
  }

  if (estado.idEditando) {
    atualizarVenda(estado.idEditando, valor);
    cancelarEdicao();
    renderizar();
    mostrarToast('Venda atualizada!');
  } else {
    adicionarVenda(valor);
    mostrarToast('Venda adicionada!');
  }

  el.form.reset();
  el.inputValor.focus();
});

el.btnCancelar.addEventListener('click', () => {
  cancelarEdicao();
  renderizarLista();
  el.inputValor.focus();
});

el.ordenacao.addEventListener('change', () => {
  estado.ordenacao = el.ordenacao.value;
  renderizarLista();
});

el.lista.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const id = botao.dataset.id;
  const acao = botao.dataset.acao;

  if (acao === 'editar') iniciarEdicao(id);
  if (acao === 'remover') removerVenda(id);
});

window.addEventListener('storage', (evento) => {
  if (evento.key !== CHAVE_STORAGE) return;
  carregarVendas();
  renderizar();
});

(function iniciar() {
  carregarVendas();
  el.ordenacao.value = estado.ordenacao;
  renderizar();
})();
