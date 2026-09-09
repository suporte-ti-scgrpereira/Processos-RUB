const API_URL = "https://script.google.com/macros/s/AKfycbyqI4HxQDtaAJWgLS3iYJB6rS4_1dxGUsF_PwaGGEtnV-O3d0JjMjdaEaQTMspcTFO-QQ/exec";

// Elementos de Telas / Cards
const cardMatricula = document.getElementById('cardMatricula');
const cardCadastro = document.getElementById('cardCadastro');
const cardPendente = document.getElementById('cardPendente');
const cardDashboard = document.getElementById('cardDashboard');
const cardImportacao = document.getElementById('cardImportacao');
const modalSenha = document.getElementById('modalSenha');

// Elementos de Cadastro
const selectBandeira = document.getElementById('cadBandeira');
const boxRegionalUnica = document.getElementById('boxRegionalUnica');
const boxMultiRegional = document.getElementById('boxMultiRegional');

// Elementos do Painel Retrátil (Drawer)
const btnToggleDrawer = document.getElementById('btnToggleDrawer');
const btnFecharDrawer = document.getElementById('btnFecharDrawer');
const drawerPainel = document.getElementById('drawerPainel');
const drawerOverlay = document.getElementById('drawerOverlay');
const btnCarregarRegional = document.getElementById('btnCarregarRegional');
const msgAcessoNegado = document.getElementById('msgAcessoNegado');
const txtRegionaisPermitidas = document.getElementById('txtRegionaisPermitidas');

// Elementos de Navegação das Páginas
const btnIrParaImportacao = document.getElementById('btnIrParaImportacao');
const btnVoltarDashboard = document.getElementById('btnVoltarDashboard');
const btnEnviarAuditoria = document.getElementById('btnEnviarAuditoria');

let matriculaAtual = "";
let regionaisUsuarioLogado = [];
let usuarioAutenticado = false;

// ----------------------------------------------------
// GERENCIAMENTO DE ROTAS POR HASH (#) NA URL
// ----------------------------------------------------
function navegarParaRota() {
  if (!usuarioAutenticado) {
    if (cardDashboard) cardDashboard.classList.add('hidden');
    if (cardImportacao) cardImportacao.classList.add('hidden');
    if (cardCadastro) cardCadastro.classList.add('hidden');
    if (cardPendente) cardPendente.classList.add('hidden');
    if (cardMatricula) cardMatricula.classList.remove('hidden');
    return;
  }

  const hash = window.location.hash;

  if (cardDashboard) cardDashboard.classList.add('hidden');
  if (cardImportacao) cardImportacao.classList.add('hidden');

  if (hash === '#importacao' && cardImportacao) {
    cardImportacao.classList.remove('hidden');
  } else {
    if (cardDashboard) cardDashboard.classList.remove('hidden');
  }
}

// Executa a validação de rotas no carregamento e mudanças de hash
navegarParaRota();
window.addEventListener('hashchange', navegarParaRota);

// Botões de alteração de rota
if (btnIrParaImportacao) {
  btnIrParaImportacao.addEventListener('click', () => {
    window.location.hash = '#importacao';
  });
}

if (btnVoltarDashboard) {
  btnVoltarDashboard.addEventListener('click', () => {
    window.location.hash = '#dashboard';
  });
}

// ----------------------------------------------------
// REGRAS DE NEGÓCIO E INTERFACE
// ----------------------------------------------------

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
  document.getElementById('cadRegional').value = "";
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
document.getElementById('btnVerificar').addEventListener('click', async () => {
  const matricula = document.getElementById('inputMatricula').value.trim();
  if (!matricula) return alert('Digite sua matrícula');

  matriculaAtual = matricula;
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'verificarMatricula', matricula })
    }).then(r => r.json());

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
    alert('Erro ao conectar com o servidor. Verifique sua conexão.');
    console.error(err);
  }
});

// Validar Senha no Login e Acessar Área Interna
document.getElementById('btnEntrar').addEventListener('click', async () => {
  const senha = document.getElementById('inputSenha').value.trim();
  if (!senha) return alert('Digite sua senha');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'validarSenha', matricula: matriculaAtual, senha })
    }).then(r => r.json());

    if (res.autenticado) {
      usuarioAutenticado = true;
      modalSenha.classList.remove('active');
      cardMatricula.classList.add('hidden');
      
      regionaisUsuarioLogado = res.usuario.regional ? res.usuario.regional.split(',') : [];

      document.getElementById('dashBoasVindas').innerText = `Bem-vindo, ${res.usuario.nome}!`;
      document.getElementById('dashRegionaisText').innerText = `Sua regional liberada: ${res.usuario.regional}`;

      if (!window.location.hash) {
        window.location.hash = '#dashboard';
      } else {
        navegarParaRota();
      }
    } else {
      alert(res.message || 'Senha incorreta.');
    }
  } catch (err) {
    alert('Erro ao validar senha.');
    console.error(err);
  }
});

if (btnCarregarRegional) {
  btnCarregarRegional.addEventListener('click', async () => {
    const regionalSelecionada = document.getElementById('selectRegionalDiaria').value;
    if (!regionalSelecionada) return alert('Selecione uma regional.');

    const listaPermitidas = regionaisUsuarioLogado.map(r => r.trim().toUpperCase());
    const solicitada = regionalSelecionada.trim().toUpperCase();

    const possuiAcesso = listaPermitidas.includes(solicitada) || listaPermitidas.includes('TODAS');

    if (possuiAcesso) {
      msgAcessoNegado.classList.add('hidden');
      toggleDrawer(false);
      
      const container = document.getElementById('conteudoRegional');
      container.innerHTML = `<p class="placeholder-text">Carregando dados da regional ${regionalSelecionada}...</p>`;

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'carregarDadosRegional', regional: regionalSelecionada })
        }).then(r => r.json());

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

function montarTabelaHTML(matriz) {
  if (!matriz || matriz.length === 0) return '<p>Sem dados.</p>';
  
  let html = '<div class="table-responsive"><table class="dash-table"><thead><tr>';
  
  matriz[0].forEach(col => {
    html += `<th>${col}</th>`;
  });
  html += '</tr></thead><tbody>';

  for (let i = 1; i < matriz.length; i++) {
    html += '<tr>';
    matriz[i].forEach(celula => {
      html += `<td>${celula}</td>`;
    });
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

document.getElementById('btnSolicitar').addEventListener('click', async () => {
  const nome = document.getElementById('cadNome').value.trim();
  const bandeira = selectBandeira.value;
  const senha = document.getElementById('cadSenha').value;
  const senhaConfirma = document.getElementById('cadSenhaConfirma').value;

  if (!nome || !bandeira || !senha) return alert('Preencha todos os campos obrigatórios.');

  if (senha !== senhaConfirma) {
    return alert('As senhas digitadas não coincidem. Verifique e tente novamente.');
  }

  let regionalFinal = "";
  if (bandeira === 'Grupo Pereira') {
    const selecionadas = Array.from(document.querySelectorAll('input[name="chkRegional"]:checked')).map(cb => cb.value);
    if (selecionadas.length === 0) return alert('Selecione ao menos uma regional.');
    regionalFinal = selecionadas.join(', ');
  } else {
    regionalFinal = document.getElementById('cadRegional').value;
    if (!regionalFinal) return alert('Selecione a regional.');
  }

  const payload = {
    action: 'solicitarCadastro',
    nome,
    matricula: matriculaAtual,
    bandeira,
    regional: regionalFinal,
    senha
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(r => r.json());

    alert(res.message);
    
    limparFormularioCadastro();
    cardCadastro.classList.add('hidden');
    cardPendente.classList.remove('hidden');
  } catch (err) {
    alert('Erro ao enviar solicitação.');
    console.error(err);
  }
});

if (btnEnviarAuditoria) {
  btnEnviarAuditoria.addEventListener('click', () => {
    enviarAuditoria(false);
  });
}

async function enviarAuditoria(sobrescrever = false) {
  const loja = document.getElementById('inputLojaUpload').value;
  const fileInput = document.getElementById('inputFileOds');

  if (!loja || fileInput.files.length === 0) {
    return alert('Preencha o número da loja e selecione o arquivo .ods');
  }

  const file = fileInput.files[0];

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async function () {
    const base64Data = reader.result.split(',')[1];

    const payload = {
      action: 'salvarArquivoAuditoriaSimplificado',
      loja: loja,
      mimeType: file.type || 'application/vnd.oasis.opendocument.spreadsheet',
      arquivoBase64: base64Data,
      confirmarSobrescrever: sobrescrever
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (!response.success && response.requerConfirmacao) {
        if (confirm(response.message)) {
          enviarAuditoria(true);
        }
      } else {
        alert(response.message);
        if (response.success) {
          document.getElementById('inputLojaUpload').value = '';
          fileInput.value = '';
        }
      }
    } catch (err) {
      alert('Erro na comunicação com o servidor.');
      console.error(err);
    }
  };
}

// Botões de Navegação e Logout
document.getElementById('btnFecharModal').addEventListener('click', () => modalSenha.classList.remove('active'));
document.getElementById('btnVoltarPendente').addEventListener('click', () => location.reload());
document.getElementById('btnVoltarCadastro').addEventListener('click', () => {
  limparFormularioCadastro();
  cardCadastro.classList.add('hidden');
  cardMatricula.classList.remove('hidden');
});

// Ação do Botão Sair
document.getElementById('btnSair').addEventListener('click', () => {
  usuarioAutenticado = false;
  history.pushState("", document.title, window.location.pathname);
  location.reload();
});
