// ====================================================
// CONFIGURAÇÕES E ESTADO GLOBAL DA APLICAÇÃO
// ====================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyqI4HxQDtaAJWgLS3iYJB6rS4_1dxGUsF_PwaGGEtnV-O3d0JjMjdaEaQTMspcTFO-QQ/exec";

let matriculaAtual = "";
let regionaisUsuarioLogado = [];
let usuarioAutenticado = false;
let mapaRegionaisLojas = {}; 

// Elementos Globais de Telas
const cardMatricula = document.getElementById('cardMatricula');
const cardCadastro = document.getElementById('cardCadastro');
const cardPendente = document.getElementById('cardPendente');
const cardDashboard = document.getElementById('cardDashboard');
const cardImportacao = document.getElementById('cardImportacao');
const cardReincidencia = document.getElementById('cardReincidencia');
const modalSenha = document.getElementById('modalSenha');

// Elementos de Formulários / Selects
const selectBandeira = document.getElementById('cadBandeira');
const selectCadRegional = document.getElementById('cadRegional');
const boxRegionalUnica = document.getElementById('boxRegionalUnica');
const boxMultiRegional = document.getElementById('boxMultiRegional');

// Elementos do Drawer Retrátil
const btnToggleDrawer = document.getElementById('btnToggleDrawer');
const btnFecharDrawer = document.getElementById('btnFecharDrawer');
const drawerPainel = document.getElementById('drawerPainel');
const drawerOverlay = document.getElementById('drawerOverlay');
const btnCarregarRegional = document.getElementById('btnCarregarRegional');
const selectRegionalDiaria = document.getElementById('selectRegionalDiaria');
const msgAcessoNegado = document.getElementById('msgAcessoNegado');
const txtRegionaisPermitidas = document.getElementById('txtRegionaisPermitidas');

// Elementos de Reincidência
const selectRegionalReinc = document.getElementById('selectRegionalReinc');
const inputDataReinc = document.getElementById('inputDataReinc');
const btnBuscarReincidencia = document.getElementById('btnBuscarReincidencia');

// ====================================================
// SERVIÇOS DE REDE (API)
// ====================================================
async function fetchAPI(payload, tentativas = 3) {
  try {
    const formData = new URLSearchParams();
    formData.append("payload", JSON.stringify(payload));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (tentativas > 1) {
      console.warn(`Tentativa falhou. Reconectando em 2s... Restam ${tentativas - 1}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchAPI(payload, tentativas - 1);
    }
    throw err;
  }
}

// ====================================================
// GERENCIAMENTO DE REGIONAIS E MAPA DADOS
// ====================================================
async function carregarMapaRegionais() {
  try {
    const res = await fetchAPI({ action: 'obterMapaRegionaisELojas' });

    if (res && res.success && res.mapa) {
      mapaRegionaisLojas = res.mapa;
      preencherSelectsEDinamicos();
    }
  } catch (err) {
    console.error("Erro ao carregar mapa de regionais via API:", err);
  }
}

function preencherSelectsEDinamicos() {
  if (!mapaRegionaisLojas) return;
  const regionais = Object.keys(mapaRegionaisLojas);

  if (regionais.length === 0) return;

  const popularSelect = (element) => {
    if (!element) return;
    
    // Preserva o valor selecionado
    const valorAtual = element.value;
    element.innerHTML = '<option value="">Selecione a Regional</option>';
    
    regionais.forEach(reg => {
      const opt = document.createElement('option');
      opt.value = reg;
      opt.textContent = reg;
      element.appendChild(opt);
    });

    if (valorAtual) element.value = valorAtual;
  };

  popularSelect(selectRegionalDiaria);
  popularSelect(selectCadRegional);
  popularSelect(selectRegionalReinc);

  if (boxMultiRegional) {
    boxMultiRegional.innerHTML = '<label class="block-title">Selecione as Regionais:</label>';
    regionais.forEach(reg => {
      const label = document.createElement('label');
      label.className = 'checkbox-inline';
      label.style.display = 'block';
      label.innerHTML = `<input type="checkbox" name="chkRegional" value="${reg}"> ${reg}`;
      boxMultiRegional.appendChild(label);
    });
  }
}

// ====================================================
// ROTEAMENTO E NAVEGAÇÃO DE ROTAS (HASH)
// ====================================================
function navegarParaRota() {
  if (!usuarioAutenticado) {
    if (window.location.hash !== '') {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    if (cardDashboard) cardDashboard.classList.add('hidden');
    if (cardImportacao) cardImportacao.classList.add('hidden');
    if (cardReincidencia) cardReincidencia.classList.add('hidden');
    if (cardCadastro) cardCadastro.classList.add('hidden');
    if (cardPendente) cardPendente.classList.add('hidden');
    if (cardMatricula) cardMatricula.classList.remove('hidden');
    return;
  }

  const hash = window.location.hash;

  if (cardDashboard) cardDashboard.classList.add('hidden');
  if (cardImportacao) cardImportacao.classList.add('hidden');
  if (cardReincidencia) cardReincidencia.classList.add('hidden');

  if (hash === '#importacao' && cardImportacao) {
    cardImportacao.classList.remove('hidden');
  } else if (hash === '#reincidencia' && cardReincidencia) {
    cardReincidencia.classList.remove('hidden');
  } else {
    if (cardDashboard) cardDashboard.classList.remove('hidden');
  }
}

window.addEventListener('hashchange', navegarParaRota);

// ====================================================
// INICIALIZAÇÃO DE EVENTOS
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
  const btnIrParaImportacao = document.getElementById('btnIrParaImportacao');
  const btnVoltarDashboard = document.getElementById('btnVoltarDashboard');
  const btnIrParaReincidencia = document.getElementById('btnIrParaReincidencia');
  const btnVoltarDashReinc = document.getElementById('btnVoltarDashReinc');

  if (btnIrParaImportacao) {
    btnIrParaImportacao.addEventListener('click', () => window.location.hash = '#importacao');
  }

  if (btnIrParaReincidencia) {
    btnIrParaReincidencia.addEventListener('click', () => {
      window.location.hash = '#reincidencia';
    });
  }

  if (btnVoltarDashboard) {
    btnVoltarDashboard.addEventListener('click', () => window.location.hash = '#dashboard');
  }

  if (btnVoltarDashReinc) {
    btnVoltarDashReinc.addEventListener('click', () => window.location.hash = '#dashboard');
  }

  const btnEnviarAuditoria = document.getElementById('btnEnviarAuditoria');
  if (btnEnviarAuditoria) {
    btnEnviarAuditoria.addEventListener('click', (e) => {
      e.preventDefault();
      enviarAuditoria(false);
    });
  }

  if (window.location.hash !== '') {
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }
  
  navegarParaRota();
  carregarMapaRegionais();
});

// ====================================================
// AUTENTICAÇÃO E CONTROLE DE TELA
// ====================================================
if (selectBandeira) {
  selectBandeira.addEventListener('change', (e) => {
    if (e.target.value === 'Grupo Pereira') {
      boxRegionalUnica.classList.add('hidden');
      boxMultiRegional.classList.remove('hidden');
    } else {
      boxRegionalUnica.classList.remove('hidden');
      boxMultiRegional.classList.add('hidden');
    }
  });
}

function limparFormularioCadastro() {
  document.getElementById('cadNome').value = "";
  document.getElementById('cadSenha').value = "";
  document.getElementById('cadSenhaConfirma').value = "";
  document.getElementById('cadBandeira').value = "";
  if (selectCadRegional) selectCadRegional.value = "";
  document.querySelectorAll('input[name="chkRegional"]').forEach(chk => chk.checked = false);
  boxRegionalUnica.classList.remove('hidden');
  boxMultiRegional.classList.add('hidden');
}

function toggleDrawer(abrir) {
  if (abrir) {
    drawerPainel.classList.add('open');
    drawerOverlay.classList.add('active');
  } else {
    drawerPainel.classList.remove('open');
    drawerOverlay.classList.remove('active');
    if (msgAcessoNegado) msgAcessoNegado.classList.add('hidden');
  }
}

if (btnToggleDrawer) btnToggleDrawer.addEventListener('click', () => toggleDrawer(true));
if (btnFecharDrawer) btnFecharDrawer.addEventListener('click', () => toggleDrawer(false));
if (drawerOverlay) drawerOverlay.addEventListener('click', () => toggleDrawer(false));

// Verificar Matrícula
const btnVerificar = document.getElementById('btnVerificar');
if (btnVerificar) {
  btnVerificar.addEventListener('click', async () => {
    const matriculaInput = document.getElementById('inputMatricula');
    const matricula = matriculaInput ? matriculaInput.value.trim() : "";
    if (!matricula) return alert('Digite sua matrícula');

    matriculaAtual = matricula;

    btnVerificar.disabled = true;
    btnVerificar.innerText = "Aguarde...";

    try {
      const res = await fetchAPI({ action: 'verificarMatricula', matricula });

      if (res.status === "APROVADO") {
        document.getElementById('boasVindas').innerText = `Olá, ${res.nome}`;
        modalSenha.classList.add('active');
      } else if (res.status === "PENDENTE") {
        cardMatricula.classList.add('hidden');
        cardPendente.classList.remove('hidden');
      } else {
        limparFormularioCadastro();
        document.getElementById('cadMatricula').value = matricula;
        cardMatricula.classList.add('hidden');
        cardCadastro.classList.remove('hidden');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor. Tente novamente.');
      console.error(err);
    } finally {
      btnVerificar.disabled = false;
      btnVerificar.innerText = "Avançar";
    }
  });
}

// Validar Senha no Login
const btnEntrar = document.getElementById('btnEntrar');
if (btnEntrar) {
  btnEntrar.addEventListener('click', async () => {
    const senha = document.getElementById('inputSenha').value.trim();
    if (!senha) return alert('Digite sua senha');

    btnEntrar.disabled = true;
    btnEntrar.innerText = "Entrando...";

    try {
      const res = await fetchAPI({ action: 'validarSenha', matricula: matriculaAtual, senha });

      if (res.autenticado) {
        usuarioAutenticado = true;
        modalSenha.classList.remove('active');
        cardMatricula.classList.add('hidden');

        regionaisUsuarioLogado = res.usuario.regional ? res.usuario.regional.split(',').map(r => r.trim()) : [];

        document.getElementById('dashBoasVindas').innerText = `Bem-vindo, ${res.usuario.nome}!`;
        document.getElementById('dashRegionaisText').innerText = `Sua regional liberada: ${res.usuario.regional}`;

        window.location.hash = '#dashboard';
        navegarParaRota();
      } else {
        alert(res.message || 'Senha incorreta.');
      }
    } catch (err) {
      alert('Erro ao validar senha.');
      console.error(err);
    } finally {
      btnEntrar.disabled = false;
      btnEntrar.innerText = "Entrar";
    }
  });
}

if (btnCarregarRegional) {
  btnCarregarRegional.addEventListener('click', async () => {
    const regionalSelecionada = selectRegionalDiaria ? selectRegionalDiaria.value : '';
    if (!regionalSelecionada) return alert('Selecione uma regional.');

    const listaPermitidas = regionaisUsuarioLogado.map(r => r.toUpperCase());
    const solicitada = regionalSelecionada.trim().toUpperCase();

    const possuiAcesso = listaPermitidas.includes(solicitada) || listaPermitidas.includes('TODAS');

    if (possuiAcesso) {
      msgAcessoNegado.classList.add('hidden');
      toggleDrawer(false);

      const container = document.getElementById('conteudoRegional');
      container.innerHTML = `<p class="placeholder-text">Carregando dados da regional ${regionalSelecionada}...</p>`;

      try {
        const res = await fetchAPI({ action: 'carregarDadosRegional', regional: regionalSelecionada });

        if (res.success) {
          container.innerHTML = montarQuadrosDashboard(res.regional, res.blocos);
        } else {
          container.innerHTML = `<p class="alerta-erro">${res.message}</p>`;
        }
      } catch (err) {
        container.innerHTML = `<p class="alerta-erro">Erro ao carregar dados da planilha.</p>`;
        console.error(err);
      }

    } else {
      txtRegionaisPermitidas.innerText = `Sua conta possui acesso apenas para: ${regionaisUsuarioLogado.join(', ')}`;
      msgAcessoNegado.classList.remove('hidden');
    }
  });
}

// Modais adicionais e Sair
const btnFecharModal = document.getElementById('btnFecharModal');
if (btnFecharModal) btnFecharModal.addEventListener('click', () => modalSenha.classList.remove('active'));

const btnVoltarPendente = document.getElementById('btnVoltarPendente');
if (btnVoltarPendente) btnVoltarPendente.addEventListener('click', () => location.reload());

const btnVoltarCadastro = document.getElementById('btnVoltarCadastro');
if (btnVoltarCadastro) btnVoltarCadastro.addEventListener('click', () => {
  limparFormularioCadastro();
  cardCadastro.classList.add('hidden');
  cardMatricula.classList.remove('hidden');
});

const btnSair = document.getElementById('btnSair');
if (btnSair) btnSair.addEventListener('click', () => {
  usuarioAutenticado = false;
  window.location.hash = '';
  location.reload();
});

// ====================================================
// IMPORTAÇÃO / UPLOAD DE ARQUIVOS
// ====================================================
async function enviarAuditoria(sobrescrever = false) {
  const btnEnviarAuditoria = document.getElementById('btnEnviarAuditoria');
  const lojaInput = document.getElementById('inputLojaUpload');
  const fileInput = document.getElementById('inputFileOds');
  const tipoSelect = document.getElementById('selectTipoImportacao');

  const loja = lojaInput ? lojaInput.value.trim() : '';
  const tipoImportacao = tipoSelect ? tipoSelect.value : 'Auditorias';

  if (!loja) return alert('Preencha o número da loja.');
  if (!fileInput || !fileInput.files.length) return alert('Selecione o arquivo (.ods ou .xlsx).');

  const file = fileInput.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (fileExtension !== 'ods' && fileExtension !== 'xlsx') {
    return alert('Por favor, selecione apenas arquivos com extensão .ods ou .xlsx');
  }

  if (btnEnviarAuditoria) {
    btnEnviarAuditoria.disabled = true;
    btnEnviarAuditoria.innerText = "Enviando...";
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = async function () {
    try {
      const base64Data = reader.result.split(',')[1];

      const payload = {
        action: 'salvarArquivoAuditoriaSimplificado',
        loja: loja,
        tipoImportacao: tipoImportacao,
        nomeArquivo: file.name,
        mimeType: file.type,
        arquivoBase64: base64Data,
        confirmarSobrescrever: sobrescrever
      };

      const response = await fetchAPI(payload);

      if (!response.success && response.requerConfirmacao) {
        if (confirm(response.message)) {
          enviarAuditoria(true);
        }
      } else {
        alert(response.message);
        if (response.success) {
          if (lojaInput) lojaInput.value = '';
          fileInput.value = '';
        }
      }
    } catch (err) {
      alert('Erro na comunicação com o servidor ao enviar o arquivo.');
      console.error(err);
    } finally {
      if (btnEnviarAuditoria) {
        btnEnviarAuditoria.disabled = false;
        btnEnviarAuditoria.innerText = "Enviar Arquivo";
      }
    }
  };
}

// ====================================================
// RELATÓRIO DE REINCIDÊNCIA
// ====================================================
if (btnBuscarReincidencia) {
  btnBuscarReincidencia.addEventListener('click', async () => {
    const regional = selectRegionalReinc ? selectRegionalReinc.value : '';
    const dataFiltro = inputDataReinc ? inputDataReinc.value : '';

    if (!regional) return alert('Selecione uma Regional.');

    const container = document.getElementById('resultadoReincidencia');
    container.innerHTML = `<p class="placeholder-text">Processando planilhas de Reincidência da regional ${regional}...</p>`;

    btnBuscarReincidencia.disabled = true;

    try {
      const res = await fetchAPI({
        action: 'buscarDadosReincidencia',
        regional: regional,
        dataFiltro: dataFiltro
      });

      if (res.success && res.lojas && res.lojas.length > 0) {
        container.innerHTML = montarTabelaReincidencia(res.lojas);
      } else if (res.success && res.lojas && res.lojas.length === 0) {
        container.innerHTML = `<p class="placeholder-text">Nenhuma planilha de Reincidência encontrada para a data/regional selecionada.</p>`;
      } else {
        container.innerHTML = `<p class="alerta-erro">${res.message}</p>`;
      }
    } catch (err) {
      container.innerHTML = `<p class="alerta-erro">Erro ao conectar com o servidor.</p>`;
      console.error(err);
    } finally {
      btnBuscarReincidencia.disabled = false;
    }
  });
}

function montarTabelaReincidencia(lojas) {
  let html = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Qtd. Reincidências</th>
            <th>Custo Ruptura Total</th>
            <th>Itens ≤ 11 Dias Sem Venda</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  lojas.forEach(item => {
    if (item.possuiPlanilha) {
      html += `
        <tr>
          <td><strong>${item.loja}</strong></td>
          <td>${item.qtdReincidencias}</td>
          <td>${item.custoRuptura}</td>
          <td>${item.qtdAte11Dias}</td>
          <td><span style="color: #2e7d32; font-weight: bold;">✓ Atualizado</span></td>
        </tr>
      `;
    } else {
      html += `
        <tr style="background-color: #fff4f4;">
          <td><strong>${item.loja}</strong></td>
          <td colspan="3" style="text-align: center; color: #d32f2f;">
            <em>${item.status}</em>
          </td>
          <td><span style="color: #d32f2f; font-weight: bold;">⚠️ Pendente</span></td>
        </tr>
      `;
    }
  });

  html += `</tbody></table></div>`;
  return html;
}

// ====================================================
// MONTAGEM DE COMPONENTES DASHBOARD
// ====================================================
function montarTabelaHTML(matriz) {
  if (!matriz || matriz.length === 0) return '<p>Sem dados.</p>';

  let html = '<div class="table-responsive"><table class="dash-table"><thead><tr>';
  matriz[0].forEach(col => html += `<th>${col}</th>`);
  html += '</tr></thead><tbody>';

  for (let i = 1; i < matriz.length; i++) {
    html += '<tr>';
    matriz[i].forEach(celula => html += `<td>${celula}</td>`);
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

function montarQuadrosDashboard(nomeRegional, blocos) {
  return `
    <div class="grid-dashboard">
      <div class="quadro-card">
        <h3>Ruptura Operacional (${nomeRegional})</h3>
        ${montarTabelaHTML(blocos.rupturaDiaria)}
      </div>

      <div class="quadro-card">
        <h3>Consolidado Operacional</h3>
        ${montarTabelaHTML(blocos.consolidado)}
      </div>

      <div class="quadro-card">
        <h3>Ressuprimentos</h3>
        ${montarTabelaHTML(blocos.ressuprimento)}
      </div>

      <div class="quadro-card">
        <h3>Reincidências</h3>
        ${montarTabelaHTML(blocos.reincidencia)}
      </div>
    </div>
  `;
}
