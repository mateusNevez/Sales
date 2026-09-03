(function() {
  "use strict";

  // --- DOM ---
  const inputValor = document.getElementById('valorVenda');
  const adicionarBtn = document.getElementById('adicionarBtn');
  const totalSpan = document.getElementById('totalVendas');
  const ultimoDisplay = document.getElementById('ultimaVendaDisplay');
  const ultimoValorSpan = document.getElementById('ultimoValorTexto');
  const limparBtn = document.getElementById('limparTudoBtn');
  const ordenarBtn = document.getElementById('ordenarBtn');
  const contagemSpan = document.getElementById('contagemVendas');
  const listaVendas = document.getElementById('listaVendas');
  const dataSpan = document.getElementById('data');

  // --- estado ---
  let vendas = [];
  let ordemCrescente = true; // true = crescente, false = decrescente
  const STORAGE_KEY = 'vendasDiarias';
  const STORAGE_DATE_KEY = 'vendasDiariasData';
  const STORAGE_ORDER_KEY = 'vendasDiariasOrdem';

  // --- exibir data atual ---
  function exibirData() {
    const hoje = new Date();
    const opcoes = { day: '2-digit', month: '2-digit', year: 'numeric' };
    dataSpan.textContent += hoje.toLocaleDateString('pt-BR', opcoes);
    return hoje.toDateString();
  }
  const dataAtual = exibirData();

  // --- verificar reset diário (funcionalidade 7) ---
  function verificarResetDiario() {
    const dataSalva = localStorage.getItem(STORAGE_DATE_KEY);
    const hoje = new Date().toDateString();
    
    if (dataSalva && dataSalva !== hoje) {
      // Se a data salva é diferente de hoje, reseta as vendas
      vendas = [];
      localStorage.setItem(STORAGE_DATE_KEY, hoje);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
      atualizarUI();
      return true;
    }
    
    if (!dataSalva) {
      // Primeira vez usando, salva a data atual
      localStorage.setItem(STORAGE_DATE_KEY, hoje);
    }
    return false;
  }

  // --- formatação ---
  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // --- ordenar vendas (funcionalidade 4) ---
  function ordenarVendas() {
    if (vendas.length === 0) return;
    
    ordemCrescente = !ordemCrescente;
    vendas.sort((a, b) => ordemCrescente ? a - b : b - a);
    
    // Salvar preferência de ordem
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(ordemCrescente));
    
    atualizarUI();
    
    // Feedback visual no botão
    const ordenarBtn = document.getElementById('ordenarBtn');
    const icon = ordenarBtn.querySelector('i');
    if (ordemCrescente) {
      icon.className = 'bi bi-arrow-up me-1';
      ordenarBtn.innerHTML = '<i class="bi bi-arrow-up me-1"></i>Menor p/ Maior';
    } else {
      icon.className = 'bi bi-arrow-down me-1';
      ordenarBtn.innerHTML = '<i class="bi bi-arrow-down me-1"></i>Maior p/ Menor';
    }
  }

  // --- remover venda individual (funcionalidade 3) ---
  function removerVenda(index) {
    if (index >= 0 && index < vendas.length) {
      vendas.splice(index, 1);
      atualizarUI();
    }
  }

  // --- editar venda individual (funcionalidade 3) ---
  function editarVenda(index) {
    if (index >= 0 && index < vendas.length) {
      const valorAtual = vendas[index];
      const novoValorStr = prompt(`Editar venda #${index + 1}\nValor atual: ${formatarMoeda(valorAtual)}\nDigite o novo valor:`, valorAtual.toFixed(2).replace('.', ','));
      
      if (novoValorStr === null) return; // Usuário cancelou
      
      const novoValor = parseFloat(novoValorStr.replace(',', '.'));
      
      if (isNaN(novoValor) || novoValor <= 0) {
        alert('Valor inválido. A edição foi cancelada.');
        return;
      }
      
      const arredondado = Math.round(novoValor * 100) / 100;
      if (arredondado === 0) {
        alert('Valor inválido. A edição foi cancelada.');
        return;
      }
      
      vendas[index] = arredondado;
      atualizarUI();
    }
  }

  // --- renderizar lista de vendas ---
  function renderizarLista() {
    if (vendas.length === 0) {
      listaVendas.innerHTML = `<div class="text-center text-muted py-3">Nenhuma venda registrada</div>`;
      return;
    }

    let html = '';
    vendas.forEach((venda, index) => {
      const numero = index + 1;
      html += `
        <div class="item-venda d-flex justify-content-between align-items-center px-3 py-2 mb-1" style="background-color: rgba(255, 255, 255, 0.85); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-semibold text-secondary">${numero}</span>
            <span class="fw-semibold">${formatarMoeda(venda)}</span>
          </div>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary editar-venda" data-index="${index}" title="Editar venda">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger remover-venda" data-index="${index}" title="Remover venda">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      `;
    });
    listaVendas.innerHTML = html;

    // Adicionar event listeners para os botões de editar e remover
    document.querySelectorAll('.remover-venda').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (confirm(`Tem certeza que deseja remover a venda #${index + 1}?`)) {
          removerVenda(index);
        }
      });
    });

    document.querySelectorAll('.editar-venda').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        editarVenda(index);
      });
    });
  }

  // --- atualizar UI + localStorage ---
  function atualizarUI() {
    const total = vendas.reduce((acc, v) => acc + v, 0);
    totalSpan.textContent = formatarMoeda(total);

    const qtd = vendas.length;
    contagemSpan.textContent = qtd === 1 ? '1 venda' : `${qtd} vendas`;

    if (qtd > 0) {
      const ultimo = vendas[qtd - 1];
      ultimoValorSpan.textContent = formatarMoeda(ultimo);
      ultimoDisplay.classList.remove('d-none');
    } else {
      ultimoDisplay.classList.add('d-none');
    }

    renderizarLista();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
      localStorage.setItem(STORAGE_DATE_KEY, new Date().toDateString());
    } catch (_) { /* silencioso */ }
  }

  // --- carregar do storage ---
  function carregarDoStorage() {
    try {
      // Verificar reset diário primeiro
      const dataSalva = localStorage.getItem(STORAGE_DATE_KEY);
      const hoje = new Date().toDateString();
      
      if (dataSalva && dataSalva !== hoje) {
        // Reset diário automático
        vendas = [];
        localStorage.setItem(STORAGE_DATE_KEY, hoje);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
        atualizarUI();
        return;
      }
      
      // Carregar preferência de ordem
      const ordemSalva = localStorage.getItem(STORAGE_ORDER_KEY);
      if (ordemSalva) {
        ordemCrescente = JSON.parse(ordemSalva);
        const ordenarBtn = document.getElementById('ordenarBtn');
        if (ordemCrescente) {
          ordenarBtn.innerHTML = '<i class="bi bi-arrow-up me-1"></i>Menor p/ Maior';
        } else {
          ordenarBtn.innerHTML = '<i class="bi bi-arrow-down me-1"></i>Maior p/ Menor';
        }
      }
      
      // Carregar vendas
      const dados = localStorage.getItem(STORAGE_KEY);
      if (dados) {
        const parsed = JSON.parse(dados);
        if (Array.isArray(parsed) && parsed.every(v => typeof v === 'number' && !isNaN(v))) {
          vendas = parsed;
        } else {
          vendas = [];
        }
      } else {
        vendas = [];
      }
      
      // Ordenar se necessário
      if (vendas.length > 0) {
        vendas.sort((a, b) => ordemCrescente ? a - b : b - a);
      }
      
    } catch (_) {
      vendas = [];
    }
    atualizarUI();
  }

  // --- adicionar venda ---
  function adicionarVenda(valor) {
    if (typeof valor !== 'number' || isNaN(valor) || valor <= 0) return false;
    const arredondado = Math.round(valor * 100) / 100;
    if (arredondado === 0) return false;
    vendas.push(arredondado);
    
    // Reaplicar ordenação
    vendas.sort((a, b) => ordemCrescente ? a - b : b - a);
    
    atualizarUI();
    return true;
  }

  // --- limpar ---
  function limparVendas() {
    if (vendas.length === 0) return;
    if (confirm('Apagar todas as vendas?')) {
      vendas = [];
      atualizarUI();
      inputValor.value = '';
      inputValor.focus();
    }
  }

  // --- handler input ---
  function handleAdicionar() {
    let raw = inputValor.value.trim();
    if (raw === '') {
      alert('Digite um valor.');
      inputValor.focus();
      return;
    }
    raw = raw.replace(',', '.');
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0) {
      alert('Valor inválido. Use ex: 12,50');
      inputValor.value = '';
      inputValor.focus();
      return;
    }
    const ok = adicionarVenda(num);
    if (ok) {
      inputValor.value = '';
      inputValor.focus();
      // Scroll para o final da lista
      const container = document.getElementById('listaVendasContainer');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } else {
      alert('Erro ao adicionar.');
    }
  }

  // --- eventos ---
  adicionarBtn.addEventListener('click', handleAdicionar);
  inputValor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdicionar();
    }
  });
  limparBtn.addEventListener('click', limparVendas);
  ordenarBtn.addEventListener('click', ordenarVendas);

  // --- init ---
  carregarDoStorage();
  inputValor.focus();
})();
