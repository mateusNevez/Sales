// --- DOM ---
const inputValor = document.getElementById('valorVenda');
const adicionarBtn = document.getElementById('adicionarBtn');
const totalSpan = document.getElementById('totalVendas');
const ultimoDisplay = document.getElementById('ultimaVendaDisplay');
const ultimoValorSpan = document.getElementById('ultimoValorTexto');
const limparBtn = document.getElementById('limparTudoBtn');
const contagemSpan = document.getElementById('contagemVendas');

// --- estado ---
let vendas = [];
const STORAGE_KEY = 'vendasDiarias';

// --- formatação ---
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

    try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
    } catch (_) { /* silencioso */ }
}

// --- carregar do storage ---
function carregarDoStorage() {
    try {
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
    } else {
    alert('Erro ao adicionar.');
    }
}

async function getDataAtual() {
    const labelData = document.querySelector("#data")
    const res = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=America/Cuiaba");
    const data = await res.json();

    labelData.innerHTML += `${data.date}`
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

// --- init ---
carregarDoStorage();
inputValor.focus();
getDataAtual();