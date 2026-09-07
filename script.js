const API_URL = "https://script.google.com/macros/s/AKfycbyqI4HxQDtaAJWgLS3iYJB6rS4_1dxGUsF_PwaGGEtnV-O3d0JjMjdaEaQTMspcTFO-QQ/exec";

const cardMatricula = document.getElementById('cardMatricula');
const cardCadastro = document.getElementById('cardCadastro');
const cardDashboard = document.getElementById('cardDashboard');
const modalSenha = document.getElementById('modalSenha');

let matriculaAtual = "";

document.getElementById('btnVerificar').addEventListener('click', async () => {
  const matricula = document.getElementById('inputMatricula').value.trim();
  if (!matricula) return alert('Digite sua matrícula');

  matriculaAtual = matricula;
  
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'verificarMatricula', matricula })
  }).then(r => r.json());

  if (res.existe) {
    document.getElementById('boasVindas').innerText = `Olá, ${res.nome}`;
    modalSenha.classList.add('active');
  } else {
    document.getElementById('cadMatricula').value = matricula;
    cardMatricula.classList.add('hidden');
    cardCadastro.classList.remove('hidden');
  }
});

document.getElementById('btnEntrar').addEventListener('click', async () => {
  const senha = document.getElementById('inputSenha').value.trim();
  if (!senha) return alert('Digite sua senha');

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'validarSenha', matricula: matriculaAtual, senha })
  }).then(r => r.json());

  if (res.autenticado) {
    modalSenha.classList.remove('active');
    cardMatricula.classList.add('hidden');
    cardDashboard.classList.remove('hidden');
    document.getElementById('dashBoasVindas').innerText = `Bem-vindo, ${res.usuario.nome}!`;
  } else {
    alert(res.message || 'Senha incorreta.');
  }
});

document.getElementById('btnSolicitar').addEventListener('click', async () => {
  const payload = {
    action: 'solicitarCadastro',
    nome: document.getElementById('cadNome').value.trim(),
    matricula: matriculaAtual,
    bandeira: document.getElementById('cadBandeira').value.trim(),
    regional: document.getElementById('cadRegional').value.trim(),
    senha: document.getElementById('cadSenha').value.trim()
  };

  if (!payload.nome || !payload.senha) return alert('Preencha os campos obrigatórios.');

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(r => r.json());

  alert(res.message);
  cardCadastro.classList.add('hidden');
  cardMatricula.classList.remove('hidden');
});

document.getElementById('btnFecharModal').addEventListener('click', () => modalSenha.classList.remove('active'));
document.getElementById('btnVoltar').addEventListener('click', () => {
  cardCadastro.classList.add('hidden');
  cardMatricula.classList.remove('hidden');
});
document.getElementById('btnSair').addEventListener('click', () => location.reload());
