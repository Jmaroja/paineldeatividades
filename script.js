// SPLASH
window.onload = function () {
    setTimeout(function () {
        document.getElementById('splash').style.display = 'none';
    }, 1200);
    document.getElementById('splash').style.display = '';
};

// LOGIN FLUXO
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    fazerLogin();
});

function fazerLogin() {
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    const erroLogin = document.getElementById('erroLogin');

    db.collection('usuarios').doc(usuario).get().then((doc) => {
        if (doc.exists && doc.data().senha === senha) {
            sessionStorage.setItem('usuario', usuario);
            sessionStorage.setItem('tipo', doc.data().tipo);
            exibirSistema(usuario, doc.data().tipo);
        } else {
            erroLogin.textContent = 'Usuário ou senha inválidos.';
        }
    }).catch(() => {
        erroLogin.textContent = 'Erro ao acessar banco de dados.';
    });
}

// EXIBE O SISTEMA PÓS-LOGIN (com splash pós-login)
function exibirSistema(usuario, tipo) {
    document.getElementById('splash').style.display = '';
    setTimeout(function () {
        document.getElementById('login').style.display = 'none';
        document.querySelector('header').style.display = '';
        document.querySelector('.nav-tabs').style.display = 'flex';
        document.getElementById('aba-calendario').style.display = '';
        document.getElementById('aba-dashboard').style.display = 'none';
        document.getElementById('aba-usuarios').style.display = 'none';
        document.querySelector('footer').style.display = '';
        document.getElementById('usuarioLogado').textContent = `Usuário: ${usuario}`;
        document.title = "Dashboard | Acompanhamento de Atividades - DP";
        if (tipo === "admin") {
            document.getElementById('btnUsuarios').style.display = '';
            document.getElementById('btnLimparCalendario').style.display = '';
        } else {
            document.getElementById('btnUsuarios').style.display = 'none';
            document.getElementById('btnLimparCalendario').style.display = 'none';
        }
        marcarAbaAtiva('btnCalendario');
        carregarAtividades();
        listarUsuarios();
        inicializarCalendario();

        setTimeout(function () {
            document.getElementById('splash').style.display = 'none';
        }, 1000); // Splash pós-login
    }, 200);
}

// LOGOUT FLUXO
function fazerLogout() {
    sessionStorage.clear();
    document.querySelector('header').style.display = 'none';
    document.querySelector('.nav-tabs').style.display = 'none';
    document.getElementById('aba-calendario').style.display = 'none';
    document.getElementById('aba-dashboard').style.display = 'none';
    document.getElementById('aba-usuarios').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.getElementById('login').style.display = '';
    document.title = "Login | Acompanhamento de Atividades - DP";
    document.getElementById('usuario').value = '';
    document.getElementById('senha').value = '';
    document.getElementById('erroLogin').textContent = '';
    marcarAbaAtiva('btnCalendario');
}

// ESC = LOGOUT
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        if (document.querySelector('header').style.display !== 'none') {
            fazerLogout();
        }
    }
});

// ABAS
window.abrirAba = function (aba) {
    document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.nav-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('aba-' + aba).style.display = '';
    document.getElementById('btn' + capitalize(aba)).classList.add('active');
    if (aba === 'calendario') {
        inicializarCalendario();
        document.title = "Calendário | Acompanhamento de Atividades - DP";
    }
    if (aba === 'dashboard') document.title = "Dashboard | Acompanhamento de Atividades - DP";
    if (aba === 'usuarios') document.title = "Usuários | Acompanhamento de Atividades - DP";
};

function marcarAbaAtiva(btnId) {
    document.querySelectorAll('.nav-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// TEMA CLARO/ESCURO
const btnTema = document.getElementById('btnTema');
function aplicarTema(tema) {
    if (tema === 'dark') {
        document.body.classList.add('dark');
        btnTema.textContent = "☀️";
        btnTema.title = "Tema claro";
    } else {
        document.body.classList.remove('dark');
        btnTema.textContent = "🌙";
        btnTema.title = "Tema escuro";
    }
    localStorage.setItem('tema', tema);
}
btnTema.addEventListener('click', () => {
    const atual = document.body.classList.contains('dark') ? 'dark' : 'light';
    aplicarTema(atual === 'dark' ? 'light' : 'dark');
});
const temaSalvo = localStorage.getItem('tema') || 'light';
aplicarTema(temaSalvo);

// AUTOLOGIN
(function autoLogin() {
    const usuario = sessionStorage.getItem('usuario');
    const tipo = sessionStorage.getItem('tipo');
    if (usuario && tipo) {
        setTimeout(() => exibirSistema(usuario, tipo), 100);
    }
})();

// ATIVIDADES / CRUD / CALENDÁRIO
let todasAtividades = [];
let atividadesFiltradas = [];
let calendar = null;

// BOTÃO LIMPAR CALENDÁRIO (apenas admin)
document.getElementById('btnLimparCalendario').onclick = async function() {
    if (!confirm('Tem certeza que deseja APAGAR TODAS as atividades do calendário? Esta ação NÃO pode ser desfeita.')) return;
    const snapshot = await db.collection('atividades').get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    alert('Todas as atividades foram apagadas!');
    carregarAtividades();
};

// ADICIONAR ATIVIDADE (botão + modal)
document.getElementById('btnAdicionarAtividade').onclick = function() {
    const responsavel = sessionStorage.getItem('usuario') || "";
    document.getElementById('novoResponsavel').value = responsavel;
    document.getElementById('novaAtividade').value = "";
    document.getElementById('novaData').value = "";
    document.getElementById('msgAdicionarAtividade').textContent = "";
    document.getElementById('modalAdicionarAtividade').style.display = 'block';
};
function fecharModalAdicionarAtividade() {
    document.getElementById('modalAdicionarAtividade').style.display = 'none';
}

// Correção automática no campo atividade
function formatarAtividade(texto) {
    if (!texto) return "";
    let palavrasPequenas = ["de", "da", "do", "das", "dos", "e", "em", "com", "para", "por", "a", "o", "as", "os"];
    texto = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove acento
    let dicionario = {
        "ferias": "férias",
        "funcionario": "funcionário",
        "beneficios": "benefícios",
        "admissao": "admissão",
        "demissao": "demissão",
        "relatorio": "relatório",
        "relatorios": "relatórios",
        "cartao": "cartão",
        "cartoes": "cartões",
        "ponto": "ponto",
        "pagamento": "pagamento"
    };
    texto = texto.split(" ").map((w, i) => {
        w = dicionario[w] || w;
        if (i === 0 || !palavrasPequenas.includes(w)) return w.charAt(0).toUpperCase() + w.slice(1);
        return w;
    }).join(" ");
    return texto;
}

document.getElementById('formAdicionarAtividade').onsubmit = async function(e) {
    e.preventDefault();
    const data = document.getElementById('novaData').value;
    const responsavel = document.getElementById('novoResponsavel').value.trim();
    let atividade = document.getElementById('novaAtividade').value.trim();
    atividade = formatarAtividade(atividade);

    if (!data || !responsavel || !atividade) {
        document.getElementById('msgAdicionarAtividade').textContent = "Preencha todos os campos.";
        return;
    }
    await db.collection('atividades').add({
        data: data,
        responsavel: responsavel,
        atividade: atividade,
        status: 'pendente'
    });
    document.getElementById('msgAdicionarAtividade').textContent = "Atividade adicionada com sucesso!";
    setTimeout(() => {
        fecharModalAdicionarAtividade();
        carregarAtividades();
    }, 900);
};

// IMPORTAÇÃO CSV EM LOTE (batchs de 400)
window.processCSV = function () {
    const file = document.getElementById('csvFile').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        const lines = e.target.result.split('\n');
        let atividades = [];
        for (let line of lines) {
            const [data, responsavel, atividade] = line.split(',');
            if (data && responsavel && atividade) {
                atividades.push({
                    data: data.trim(),
                    responsavel: responsavel.trim(),
                    atividade: formatarAtividade(atividade.trim()),
                    status: 'pendente'
                });
            }
        }
        for (let i = 0; i < atividades.length; i += 400) {
            const batch = db.batch();
            const sub = atividades.slice(i, i + 400);
            sub.forEach(atv => {
                const ref = db.collection('atividades').doc();
                batch.set(ref, atv);
            });
            await batch.commit();
        }
        alert('Importação concluída!');
        carregarAtividades();
    };
    reader.readAsText(file);
};

function carregarAtividades() {
    db.collection('atividades').get().then(snapshot => {
        todasAtividades = [];
        snapshot.forEach(doc => {
            const atividade = doc.data();
            atividade.id = doc.id;
            todasAtividades.push(atividade);
        });
        atividadesFiltradas = [...todasAtividades];
        preencherSelectResponsavel();
        renderizarTabelaAtividades();
        atualizarDashboard();
        renderizarGraficos();
        inicializarCalendario();
    });
}

// FULLCALENDAR
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    calendarEl.innerHTML = '';
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        events: todasAtividades.map(a => ({
            title: a.atividade + ' (' + a.responsavel + ')',
            start: a.data,
            color: a.status === 'realizado' ? '#2ecc71' : (a.status === 'naoRealizado' ? '#e67e22' : '#95a5a6'),
            extendedProps: {
                responsavel: a.responsavel,
                status: a.status
            }
        })),
        eventClick: function(info) {
            abrirModalPelaData(info.event.startStr, info.event.title);
        },
        buttonText: {
            today:    'Hoje',
            month:    'Mês',
            week:     'Semana',
            day:      'Dia',
            list:     'Lista'
        }
    });
    calendar.render();
    setTimeout(() => {
        document.querySelectorAll('#calendar .fc-scroller, #calendar .fc-scrollgrid-sync-table, #calendar .fc-daygrid-body, #calendar .fc-daygrid-body-natural').forEach(el => {
            el.style.overflowY = 'hidden';
        });
    }, 300);
}

function abrirModalPelaData(data, atividadeTitulo) {
    const atv = todasAtividades.find(a =>
        a.data === data &&
        atividadeTitulo.includes(a.atividade)
    );
    if (atv) {
        window.abrirModal(atv.id);
    }
}

// SELECT RESPONSÁVEL
function preencherSelectResponsavel() {
    const select = document.getElementById('responsavelSelect');
    const responsaveis = [...new Set(todasAtividades.map(a => a.responsavel))];
    select.innerHTML = '<option value="todos">Todos</option>';
    responsaveis.forEach(r => {
        select.innerHTML += `<option value="${r}">${r}</option>`;
    });
}

// FILTRAR POR RESPONSÁVEL
window.filtrarPorResponsavel = function () {
    const filtro = document.getElementById('responsavelSelect').value;
    if (filtro === 'todos') {
        atividadesFiltradas = [...todasAtividades];
    } else {
        atividadesFiltradas = todasAtividades.filter(a => a.responsavel === filtro);
    }
    renderizarTabelaAtividades();
    atualizarDashboard();
    renderizarGraficos();
    inicializarCalendario();
};

// RENDERIZAR TABELA
function renderizarTabelaAtividades() {
    const tbody = document.getElementById('tabelaAtividades').querySelector('tbody');
    tbody.innerHTML = '';
    atividadesFiltradas.forEach(a => {
        tbody.innerHTML += `
            <tr onclick="abrirModal('${a.id}')">
                <td>${a.data}</td>
                <td>${a.responsavel}</td>
                <td>${a.atividade}</td>
                <td>${statusFormatado(a.status, a.motivo)}</td>
            </tr>
        `;
    });
}
function statusFormatado(status, motivo) {
    if (status === 'realizado') return 'Realizado';
    if (status === 'naoRealizado') return 'Não Realizado' + (motivo ? ` (${motivo})` : '');
    return 'Pendente';
}

// MODAL DETALHE ATIVIDADE (layout novo)
let atividadeSelecionada = null;
window.abrirModal = function (id) {
    atividadeSelecionada = todasAtividades.find(a => a.id === id);
    document.getElementById('modalData').textContent = atividadeSelecionada.data;
    document.getElementById('modalResponsavel').textContent = atividadeSelecionada.responsavel;
    document.getElementById('modalAtv').textContent = atividadeSelecionada.atividade;
    document.getElementById('selectMotivo').style.display = 'none';
    document.getElementById('modalAtividade').style.display = 'block';
}
window.fecharModal = function () {
    document.getElementById('modalAtividade').style.display = 'none';
    atividadeSelecionada = null;
}
window.mostrarSelectMotivo = function () {
    document.getElementById('selectMotivo').style.display = '';
}
window.marcarStatusModal = function (realizado) {
    if (!atividadeSelecionada) return;
    let status = realizado ? 'realizado' : 'naoRealizado';
    let motivo = realizado ? '' : document.getElementById('motivoNaoRealizado').value;
    db.collection('atividades').doc(atividadeSelecionada.id).update({
        status: status,
        motivo: motivo
    }).then(() => {
        fecharModal();
        carregarAtividades();
    });
}

// DASHBOARD RESUMO
function atualizarDashboard() {
    document.getElementById('totalAtividades').textContent = atividadesFiltradas.length;
    const realizadas = atividadesFiltradas.filter(a => a.status === 'realizado').length;
    const naoRealizadas = atividadesFiltradas.filter(a => a.status === 'naoRealizado').length;
    document.getElementById('totalRealizadas').textContent = realizadas;
    document.getElementById('totalNaoRealizadas').textContent = naoRealizadas;
    document.getElementById('percentualConclusao').textContent =
        atividadesFiltradas.length ? Math.round(realizadas / atividadesFiltradas.length * 100) + '%' : '0%';
}

// GRÁFICOS
let chartBarras, chartLinha, chartMotivos;
function renderizarGraficos() {
    // Barras
    const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
    if (chartBarras) chartBarras.destroy();
    const realizadas = atividadesFiltradas.filter(a => a.status === 'realizado').length;
    const naoRealizadas = atividadesFiltradas.filter(a => a.status === 'naoRealizado').length;
    const pendentes = atividadesFiltradas.filter(a => !a.status || a.status === 'pendente').length;
    chartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            labels: ['Realizadas', 'Não Realizadas', 'Pendentes'],
            datasets: [{
                data: [realizadas, naoRealizadas, pendentes],
                label: 'Atividades',
            }]
        }
    });

    // Linha
    const ctxLinha = document.getElementById('graficoLinha').getContext('2d');
    if (chartLinha) chartLinha.destroy();
    let dadosData = {};
    atividadesFiltradas.forEach(a => {
        if (!dadosData[a.data]) dadosData[a.data] = 0;
        if (a.status === 'realizado') dadosData[a.data]++;
    });
    const datas = Object.keys(dadosData).sort();
    const valores = datas.map(d => dadosData[d]);
    chartLinha = new Chart(ctxLinha, {
        type: 'line',
        data: {
            labels: datas,
            datasets: [{
                data: valores,
                label: 'Atividades Realizadas'
            }]
        }
    });

    // Motivos (pizza)
    const ctxMotivos = document.getElementById('graficoMotivos').getContext('2d');
    if (chartMotivos) chartMotivos.destroy();
    let motivos = {};
    atividadesFiltradas.filter(a => a.status === 'naoRealizado').forEach(a => {
        motivos[a.motivo] = (motivos[a.motivo] || 0) + 1;
    });
    chartMotivos = new Chart(ctxMotivos, {
        type: 'pie',
        data: {
            labels: Object.keys(motivos),
            datasets: [{
                data: Object.values(motivos)
            }]
        }
    });
}

// EXPORTAR CSV
window.exportarResumo = function () {
    let csv = 'Data,Responsável,Atividade,Status,Motivo\n';
    atividadesFiltradas.forEach(a => {
        csv += `${a.data},${a.responsavel},${a.atividade},${statusFormatado(a.status)},${a.motivo || ''}\n`;
    });
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumo-atividades.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// USUÁRIOS (ADMIN)
document.getElementById('usuarioForm').addEventListener('submit', function(event) {
    event.preventDefault();
    adicionarUsuario();
});

function adicionarUsuario() {
    const usuario = document.getElementById('novoUsuario').value.trim();
    const senha = document.getElementById('novaSenha').value;
    const tipo = document.getElementById('novoTipo').value;
    if (!usuario || !senha) {
        alert('Preencha todos os campos!');
        return;
    }
    db.collection('usuarios').doc(usuario).set({
        senha: senha,
        tipo: tipo
    }).then(() => {
        alert('Usuário adicionado!');
        listarUsuarios();
        document.getElementById('usuarioForm').reset();
    }).catch(() => {
        alert('Erro ao adicionar usuário');
    });
}

function listarUsuarios() {
    db.collection('usuarios').get().then(snapshot => {
        const tbody = document.getElementById('tabelaUsuarios').querySelector('tbody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const u = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id}</td>
                    <td>${u.tipo}</td>
                    <td>
                        <button onclick="removerUsuario('${doc.id}')">Remover</button>
                    </td>
                </tr>
            `;
        });
    });
}
window.removerUsuario = function(usuario) {
    if (confirm(`Remover usuário ${usuario}?`)) {
        db.collection('usuarios').doc(usuario).delete().then(() => {
            alert('Usuário removido');
            listarUsuarios();
        });
    }
}
