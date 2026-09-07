const API_URL = "https://script.google.com/macros/s/AKfycbyqI4HxQDtaAJWgLS3iYJB6rS4_1dxGUsF_PwaGGEtnV-O3d0JjMjdaEaQTMspcTFO-QQ/exec";

const cardMatricula = document.getElementById('cardMatricula');
const cardCadastro = document.getElementById('cardCadastro');
const cardPendente = document.getElementById('cardPendente');
const cardDashboard = document.getElementById('cardDashboard');
const modalSenha = document.getElementById('modalSenha');

const selectBandeira = document.getElementById('cadBandeira');
const boxRegionalUnica = document.getElementById('boxRegionalUnica');
const boxMultiRegional = document.getElementById('boxMultiRegional');

let matriculaAtual = "";

// 1. Alterna entre Seleção Única e Multi-Regional ao mudar a Bandeira
selectBandeira.addEventListener('change', (e) => {
  if (e.target.value === 'Grupo Pereira') {
    boxRegionalUnica.classList.add('hidden');
    boxMultiRegional.classList.remove('hidden');
  } else {
    boxRegionalUnica.classList.remove('hidden');
    boxMultiRegional.classList.add('hidden');
  }
});

// 2. Limpa o formulário de cadastro para não expor dados anteriores (Segurança)
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

// 3. Verificar Matrícula
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

// 4. Validar Senha no Login
document.getElementById('btnEntrar').addEventListener('click', async () => {
  const senha = document.getElementById('inputSenha').value.trim();
  if (!senha) return alert('Digite sua senha');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'validarSenha', matricula: matriculaAtual, senha })
    }).then(r => r.json());

    if (res.autenticado) {
      modalSenha.classList.remove('active');
      cardMatricula.classList.add('hidden');
      cardDashboard.classList.remove('hidden');
      document.getElementById('dashBoasVindas').innerText = `Bem-vindo, ${res.usuario.nome}!`;
      document.getElementById('dashRegionaisText').innerText = `Sua regional liberada: ${res.usuario.regional}`;
    } else {
      alert(res.message || 'Senha incorreta.');
    }
  } catch (err) {
    alert('Erro ao validar senha.');
    console.error(err);
  }
});

// 5. Enviar Solicitação de Cadastro
document.getElementById('btnSolicitar').addEventListener('click', async () => {
  const nome = document.getElementById('cadNome').value.trim();
  const bandeira = selectBandeira.value;
  const senha = document.getElementById('cadSenha').value;
  const senhaConfirma = document.getElementById('cadSenhaConfirma').value;

  if (!nome || !bandeira || !senha) return alert('Preencha todos os campos obrigatórios.');

  // Validação das Senhas Idênticas
  if (senha !== senhaConfirma) {
    return alert('As senhas digitadas não coincidem. Verifique e tente novamente.');
  }

  // Coleta das Regionais (Única ou Multi-Regional)
  let regionalFinal = "";
  if (bandeira === 'Grupo Pereira') {
    const selecionadas = Array.from(document.querySelectorAll('input[name="chkRegional"]:checked')).map(cb => cb.value);
    if (selecionadas.length === 0) return alert('Selecione ao menos uma regional.');
    regionalFinal = selecionadas.join(', '); // Salva formatado ex: "Vale de Itajaí, Norte SC"
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
    
    // Limpa tudo e envia para a tela de pendente
    limparFormularioCadastro();
    cardCadastro.classList.add('hidden');
    cardPendente.classList.remove('hidden');
  } catch (err) {
    alert('Erro ao enviar solicitação.');
    console.error(err);
  }
});

// Botões de Navegação
document.getElementById('btnFecharModal').addEventListener('click', () => modalSenha.classList.remove('active'));
document.getElementById('btnVoltarPendente').addEventListener('click', () => location.reload());
document.getElementById('btnVoltarCadastro').addEventListener('click', () => {
  limparFormularioCadastro();
  cardCadastro.classList.add('hidden');
  cardMatricula.classList.remove('hidden');
});
document.getElementById('btnSair').addEventListener('click', () => location.reload());
