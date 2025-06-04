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
            sessionStorage.setItem('departamento', doc.data().departamento || '');
            exibirSistema(usuario, doc.data().tipo, doc.data().departamento || '');
        } else {
            erroLogin.textContent = 'Usuário ou senha inválidos.';
        }
    }).catch(() => {
        erroLogin.textContent = 'Erro ao acessar banco de dados.';
    });
}

// EXIBE O SISTEMA PÓS-LOGIN (com splash pós-login)
function exibirSistema(usuario, tipo, departamento) {
    document.getElementById('splash').style.display = '';
    setTimeout(function () {
        document.getElementById('login').style.display = 'none';
        document.querySelector('header').style.display = '';
        document.querySelector('.nav-tabs').style.display = 'flex';
        document.getElementById('aba-calendario').style.display = '';
        document.getElementById('aba-dashboard').style.display = 'none';
        document.getElementById('aba-usuarios').style.display = 'none';
        document.getElementById('aba-logs').style.display = 'none';
        document.querySelector('footer').style.display = '';
        document.getElementById('usuarioLogado').textContent = `Usuário: ${usuario}`;
        document.getElementById('departamentoLogado').textContent = departamento ? `Depto: ${departamento}` : '';
        document.title = "Dashboard | Painel de Atividades";
        if (tipo === "admin") {
            document.getElementById('btnUsuarios').style.display = '';
            document.getElementById('btnLimparCalendario').style.display = '';
            document.getElementById('btnLogs').style.display = '';
        } else if (tipo === "gestor") {
            document.getElementById('btnUsuarios').style.display = '';
            document.getElementById('btnLimparCalendario').style.display = 'none';
            document.getElementById('btnLogs').style.display = 'none';
        } else {
            document.getElementById('btnUsuarios').style.display = 'none';
            document.getElementById('btnLimparCalendario').style.display = 'none';
            document.getElementById('btnLogs').style.display = 'none';
        }
        marcarAbaAtiva('btnCalendario');
        carregarAtividades();
        listarUsuarios();
        inicializarCalendario();

        setTimeout(function () {
            document.getElementById('splash').style.display = 'none';
        }, 1000);
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
    document.getElementById('aba-logs').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    document.getElementById('login').style.display = '';
    document.title = "Login | Painel de Atividades";
    document.getElementById('usuario').value = '';
    document.getElementById('senha').value = '';
    document.getElementById('erroLogin').textContent = '';
    marcarAbaAtiva('btnCalendario');
}

// ABAS
window.abrirAba = function (aba) {
    document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.nav-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('aba-' + aba).style.display = '';
    document.getElementById('btn' + capitalize(aba)).classList.add('active');
    if (aba === 'calendario') {
        inicializarCalendario();
        document.title = "Calendário | Painel de Atividades";
    }
    if (aba === 'dashboard') document.title = "Dashboard | Painel de Atividades";
    if (aba === 'usuarios') document.title = "Usuários | Painel de Atividades";
    if (aba === 'logs') {
        carregarLogsExclusao();
        document.title = "Logs de Exclusão | Painel de Atividades";
    }
};

function marcarAbaAtiva(btnId) {
    document.querySelectorAll('.nav-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
}

function capitalize(str) {
    if (!str) return '';
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
    const departamento = sessionStorage.getItem('departamento');
    if (usuario && tipo) {
        setTimeout(() => exibirSistema(usuario, tipo, departamento), 100);
    }
})();

// ATIVIDADES / CRUD / CALENDÁRIO
let todasAtividades = [];
let atividadesFiltradas = [];
let calendar = null;

// FILTRO DE DEPARTAMENTO
window.filtrarPorDepartamento = function() {
    const dep = document.getElementById('departamentoSelect').value;
    const resp = document.getElementById('responsavelSelect').value;
    if (dep === 'todos') {
        atividadesFiltradas = [...todasAtividades];
    } else {
        atividadesFiltradas = todasAtividades.filter(a => (a.departamento || '') === dep);
    }
    // Depois, aplica filtro de responsável se necessário
    if (resp !== 'todos') {
        atividadesFiltradas = atividadesFiltradas.filter(a => a.responsavel === resp);
    }
    renderizarTabelaAtividades();
    atualizarDashboard();
    renderizarGraficos();
    inicializarCalendario();
};

// FILTRAR POR RESPONSÁVEL (dentro do departamento)
window.filtrarPorResponsavel = function () {
    const dep = document.getElementById('departamentoSelect').value;
    const resp = document.getElementById('responsavelSelect').value;
    if (dep === 'todos' && resp === 'todos') {
        atividadesFiltradas = [...todasAtividades];
    } else if (dep !== 'todos' && resp === 'todos') {
        atividadesFiltradas = todasAtividades.filter(a => (a.departamento || '') === dep);
    } else if (dep === 'todos' && resp !== 'todos') {
        atividadesFiltradas = todasAtividades.filter(a => a.responsavel === resp);
    } else {
        atividadesFiltradas = todasAtividades.filter(a => (a.departamento || '') === dep && a.responsavel === resp);
    }
    renderizarTabelaAtividades();
    atualizarDashboard();
    renderizarGraficos();
    inicializarCalendario();
};

// BOTÃO LIMPAR CALENDÁRIO (admin)
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
    const usuario = sessionStorage.getItem('usuario') || "";
    const tipo = sessionStorage.getItem('tipo');
    document.getElementById('novaData').value = new Date().toISOString().slice(0, 10);
    document.getElementById('novaAtividade').value = "";
    document.getElementById('novoTipoAtividade').value = "urgente";
    document.getElementById('novaDescricao').value = "";
    document.getElementById('msgAdicionarAtividade').textContent = "";
    if (tipo === "admin" || tipo === "gestor") {
        document.getElementById('divResponsavelAdicionar').style.display = '';
        document.getElementById('novoResponsavel').value = "";
    } else {
        document.getElementById('divResponsavelAdicionar').style.display = 'none';
        document.getElementById('novoResponsavel').value = usuario;
    }
    document.getElementById('modalAdicionarAtividade').style.display = 'block';
};
function fecharModalAdicionarAtividade() {
    document.getElementById('modalAdicionarAtividade').style.display = 'none';
}

// Salvar nova atividade
document.getElementById('formAdicionarAtividade').onsubmit = async function(e) {
    e.preventDefault();
    const data = document.getElementById('novaData').value;
    const tipoAtv = document.getElementById('novoTipoAtividade').value;
    let responsavel = document.getElementById('novoResponsavel').value.trim();
    let atividade = document.getElementById('novaAtividade').value.trim();
    let descricao = document.getElementById('novaDescricao').value.trim();
    let departamento = sessionStorage.getItem('tipo') === "admin" || sessionStorage.getItem('tipo') === "gestor"
        ? (usuariosMap[responsavel] ? usuariosMap[responsavel].departamento : sessionStorage.getItem('departamento'))
        : sessionStorage.getItem('departamento');
    if (!data || !responsavel || !atividade) {
        document.getElementById('msgAdicionarAtividade').textContent = "Preencha todos os campos obrigatórios.";
        return;
    }
    await db.collection('atividades').add({
        data: data,
        responsavel: responsavel,
        atividade: atividade,
        tipo: tipoAtv,
        descricao: descricao,
        departamento: departamento || '',
        status: 'pendente'
    });
    document.getElementById('msgAdicionarAtividade').textContent = "Atividade adicionada com sucesso!";
    setTimeout(() => {
        fecharModalAdicionarAtividade();
        carregarAtividades();
    }, 900);
};

let usuariosMap = {};
function listarUsuariosMap() {
    // Auxiliar para departamento-responsável
    db.collection('usuarios').get().then(snapshot => {
        usuariosMap = {};
        snapshot.forEach(doc => {
            usuariosMap[doc.id] = doc.data();
        });
    });
}
listarUsuariosMap();

window.onload = function () {
    setTimeout(function () {
        document.getElementById('splash').style.display = 'none';
    }, 1200);
    document.getElementById('splash').style.display = '';
    listarUsuariosMap();
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
            const [data, responsavel, atividade, tipo, descricao] = line.split(',');
            if (data && responsavel && atividade) {
                atividades.push({
                    data: data.trim(),
                    responsavel: responsavel.trim(),
                    atividade: atividade.trim(),
                    tipo: tipo ? tipo.trim() : "urgente",
                    descricao: descricao ? descricao.trim() : "",
                    status: 'pendente',
                    departamento: usuariosMap[responsavel] ? usuariosMap[responsavel].departamento : ''
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
        // FILTRO MULTI-SETOR: aplica restrição para gestor e comum
        const tipo = sessionStorage.getItem('tipo');
        const departamento = sessionStorage.getItem('departamento');
        if (tipo === "gestor") {
            todasAtividades = todasAtividades.filter(a => (a.departamento || '') === departamento);
        } else if (tipo === "comum") {
            const usuario = sessionStorage.getItem('usuario');
            todasAtividades = todasAtividades.filter(a => a.responsavel === usuario);
        }
        atividadesFiltradas = [...todasAtividades];
        preencherSelectDepartamento();
        preencherSelectResponsavel();
        renderizarTabelaAtividades();
        atualizarDashboard();
        renderizarGraficos();
        inicializarCalendario();
        exibirAlertaTarefasDia();
    });
}

function preencherSelectDepartamento() {
    const select = document.getElementById('departamentoSelect');
    const departamentos = [...new Set(todasAtividades.map(a => a.departamento || 'Outros'))];
    select.innerHTML = '<option value="todos">Todos</option>';
    departamentos.forEach(dep => {
        select.innerHTML += `<option value="${dep}">${dep}</option>`;
    });
}
function preencherSelectResponsavel() {
    const select = document.getElementById('responsavelSelect');
    const responsaveis = [...new Set(todasAtividades.map(a => a.responsavel))];
    select.innerHTML = '<option value="todos">Todos</option>';
    responsaveis.forEach(r => {
        select.innerHTML += `<option value="${r}">${r}</option>`;
    });
}

// BANNER DE ALERTA DE TAREFAS DO DIA
function exibirAlertaTarefasDia() {
    const usuario = sessionStorage.getItem('usuario');
    const tipo = sessionStorage.getItem('tipo');
    const alerta = document.getElementById('alertaTarefasDia');
    if (!usuario || tipo === 'admin' || tipo === 'gestor') {
        alerta.style.display = 'none';
        return;
    }
    const hoje = new Date().toISOString().slice(0, 10);
    const atividadesHoje = todasAtividades.filter(a =>
        a.responsavel === usuario &&
        a.data === hoje &&
        (!a.status || a.status === 'pendente' || a.status === 'naoRealizado')
    );
    if (atividadesHoje.length > 0) {
        alerta.textContent = `🔔 Você tem ${atividadesHoje.length} atividade${atividadesHoje.length > 1 ? 's' : ''} pendente${atividadesHoje.length > 1 ? 's' : ''} para hoje!`;
        alerta.style.display = '';
    } else {
        alerta.textContent = "✅ Parabéns! Todas as suas atividades de hoje estão concluídas.";
        alerta.style.display = '';
    }
}

// CALENDÁRIO COM CORES E TOOLTIP
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    calendarEl.innerHTML = '';
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }
    const usuario = sessionStorage.getItem('usuario');
    const tipo = sessionStorage.getItem('tipo');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        editable: true,
        events: todasAtividades.map(a => ({
            id: a.id,
            title: a.atividade,
            start: a.data,
            color: a.status === "realizado"
                ? "#22b573" // Verde para realizado
                : a.tipo === "urgente" ? "#e74c3c"
                : a.tipo === "recorrente" ? "#2980ef"
                : "#ffc107", // Amarelo escuro para extra
            classNames: [
                a.status === "realizado" ? "realizado" : (a.tipo || 'urgente')
            ],
            extendedProps: {
                responsavel: a.responsavel,
                departamento: a.departamento || "",
                tipo: a.tipo,
                descricao: a.descricao || "",
                status: a.status
            }
        })),
        eventClick: function(info) {
            abrirModalPelaData(info.event.startStr, info.event.title);
        },
        eventDrop: async function(info) {
            const atv = todasAtividades.find(a => a.id === info.event.id);
            if (
                tipo === "admin" ||
                (atv && atv.responsavel === usuario)
            ) {
                await db.collection('atividades').doc(info.event.id).update({
                    data: info.event.startStr
                });
                carregarAtividades();
            } else {
                info.revert();
                alert("Você só pode mover suas próprias atividades!");
            }
        },
        eventDidMount: function(info) {
            // Tooltip igual Google: Atividade, Data, Descrição
            const descricao = info.event.extendedProps.descricao || '';
            const atividade = info.event.title;
            const data = info.event.start.toLocaleDateString();
            let txt = `${atividade}\nData: ${data}`;
            if (descricao) txt += `\nDescrição: ${descricao}`;
            info.el.title = txt;
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
        atividadeTitulo === a.atividade
    );
    if (atv) {
        window.abrirModal(atv.id);
    }
}

// RENDERIZAR TABELA COM AÇÕES E TIPO
function renderizarTabelaAtividades() {
    const usuario = sessionStorage.getItem('usuario');
    const tipo = sessionStorage.getItem('tipo');
    const tbody = document.getElementById('tabelaAtividades').querySelector('tbody');
    tbody.innerHTML = '';
    atividadesFiltradas.forEach(a => {
        const podeEditar = tipo === 'admin' || tipo === "gestor" || a.responsavel === usuario;
        tbody.innerHTML += `
            <tr>
                <td>${a.data}</td>
                <td>${a.departamento || ''}</td>
                <td>${a.responsavel}</td>
                <td>${a.atividade}</td>
                <td>${a.tipo ? capitalize(a.tipo) : 'Urgente'}</td>
                <td>${statusFormatado(a.status, a.motivo)}</td>
                <td>
                    <button class="acao-btn editar${podeEditar ? '' : ' desabilitado'}" 
                        ${podeEditar ? `onclick="abrirModalEditarAtividade('${a.id}')"` : 'disabled'}>Editar</button>
                    <button class="acao-btn excluir${podeEditar ? '' : ' desabilitado'}" 
                        ${podeEditar ? `onclick="abrirModalExcluirAtividade('${a.id}')"` : 'disabled'}>Excluir</button>
                </td>
            </tr>
        `;
    });
}
function statusFormatado(status, motivo) {
    if (status === 'realizado') return 'Realizado';
    if (status === 'naoRealizado') return 'Não Realizado' + (motivo ? ` (${motivo})` : '');
    return 'Pendente';
}

// MODAL DETALHE ATIVIDADE (visualização)
let atividadeSelecionada = null;
window.abrirModal = function (id) {
    atividadeSelecionada = todasAtividades.find(a => a.id === id);
    document.getElementById('modalData').textContent = atividadeSelecionada.data;
    document.getElementById('modalDepartamento').textContent = atividadeSelecionada.departamento || '';
    document.getElementById('modalResponsavel').textContent = atividadeSelecionada.responsavel;
    document.getElementById('modalAtv').textContent = atividadeSelecionada.atividade;
    document.getElementById('modalTipoAtv').textContent = atividadeSelecionada.tipo ? capitalize(atividadeSelecionada.tipo) : 'Urgente';
    document.getElementById('modalDescricao').textContent = atividadeSelecionada.descricao || '';
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

// MODAL EDITAR ATIVIDADE
window.abrirModalEditarAtividade = function(id) {
    const atv = todasAtividades.find(a => a.id === id);
    if (!atv) return;
    window.atividadeEditando = id;
    document.getElementById('editarData').value = atv.data;
    document.getElementById('editarAtividade').value = atv.atividade;
    document.getElementById('editarTipoAtividade').value = atv.tipo || "urgente";
    document.getElementById('editarDescricao').value = atv.descricao || '';
    document.getElementById('msgEditarAtividade').textContent = "";
    const tipoSessao = sessionStorage.getItem('tipo');
    if (tipoSessao === "admin" || tipoSessao === "gestor") {
        document.getElementById('divResponsavelEditar').style.display = '';
        document.getElementById('editarResponsavel').value = atv.responsavel;
    } else {
        document.getElementById('divResponsavelEditar').style.display = 'none';
        document.getElementById('editarResponsavel').value = atv.responsavel;
    }
    document.getElementById('modalEditarAtividade').style.display = 'block';
}
function fecharModalEditarAtividade() {
    document.getElementById('modalEditarAtividade').style.display = 'none';
    window.atividadeEditando = null;
}
document.getElementById('formEditarAtividade').onsubmit = async function(e) {
    e.preventDefault();
    const id = window.atividadeEditando;
    if (!id) return;
    const data = document.getElementById('editarData').value;
    const tipoAtv = document.getElementById('editarTipoAtividade').value;
    let responsavel = document.getElementById('editarResponsavel').value.trim();
    let atividade = document.getElementById('editarAtividade').value.trim();
    let descricao = document.getElementById('editarDescricao').value.trim();

    if (!data || !responsavel || !atividade) {
        document.getElementById('msgEditarAtividade').textContent = "Preencha todos os campos obrigatórios.";
        return;
    }
    await db.collection('atividades').doc(id).update({
        data: data,
        responsavel: responsavel,
        atividade: atividade,
        tipo: tipoAtv,
        descricao: descricao
    });
    document.getElementById('msgEditarAtividade').textContent = "Alteração salva!";
    setTimeout(() => {
        fecharModalEditarAtividade();
        carregarAtividades();
    }, 900);
};
// MODAL EXCLUIR ATIVIDADE (com motivo e log)
window.abrirModalExcluirAtividade = function(id) {
    const atv = todasAtividades.find(a => a.id === id);
    if (!atv) return;
    window.atividadeExcluindo = id;
    document.getElementById('infoExcluirAtividade').innerHTML = `<b>Data:</b> ${atv.data}<br><b>Responsável:</b> ${atv.responsavel}<br><b>Atividade:</b> ${atv.atividade}<br><b>Tipo:</b> ${atv.tipo ? capitalize(atv.tipo) : 'Urgente'}`;
    document.getElementById('motivoExclusao').value = '';
    document.getElementById('modalExcluirAtividade').style.display = 'block';
}
function fecharModalExcluirAtividade() {
    document.getElementById('modalExcluirAtividade').style.display = 'none';
    window.atividadeExcluindo = null;
}
document.getElementById('btnConfirmarExcluir').onclick = async function() {
    const id = window.atividadeExcluindo;
    if (!id) return;
    const motivo = document.getElementById('motivoExclusao').value.trim();
    if (!motivo) {
        alert('Informe o motivo da exclusão.');
        return;
    }
    const atv = todasAtividades.find(a => a.id === id);
    if (!atv) return;
    // Salva o log
    await db.collection('logs_exclusao').add({
        datahora: new Date().toISOString(),
        quem: sessionStorage.getItem('usuario'),
        motivo: motivo,
        atividade: {
            data: atv.data,
            departamento: atv.departamento || '',
            responsavel: atv.responsavel,
            atividade: atv.atividade,
            tipo: atv.tipo || 'urgente',
            status: atv.status || 'pendente'
        }
    });
    // Remove atividade
    await db.collection('atividades').doc(id).delete();
    fecharModalExcluirAtividade();
    carregarAtividades();
    alert("Atividade excluída e log registrada!");
};

// LOGS DE EXCLUSÃO (admin)
function carregarLogsExclusao() {
    if (sessionStorage.getItem('tipo') !== 'admin') return;
    db.collection('logs_exclusao').orderBy('datahora', 'desc').get().then(snapshot => {
        const tbody = document.getElementById('tabelaLogs').querySelector('tbody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const l = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${l.datahora.replace('T',' ').replace('.000Z','')}</td>
                    <td>${l.quem}</td>
                    <td>${l.motivo}</td>
                    <td>${l.atividade.data} - ${l.atividade.departamento || ''} - ${l.atividade.responsavel} - ${l.atividade.atividade} [${capitalize(l.atividade.tipo)}]</td>
                </tr>
            `;
        });
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
    let csv = 'Data,Departamento,Responsável,Atividade,Tipo,Status,Motivo,Descrição\n';
    atividadesFiltradas.forEach(a => {
        csv += `${a.data},${a.departamento || ''},${a.responsavel},${a.atividade},${a.tipo || ''},${statusFormatado(a.status)},${a.motivo || ''},${a.descricao || ''}\n`;
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

// USUÁRIOS (ADMIN / GESTOR)
document.getElementById('usuarioForm').addEventListener('submit', function(event) {
    event.preventDefault();
    adicionarUsuario();
});

function adicionarUsuario() {
    const usuario = document.getElementById('novoUsuario').value.trim();
    const senha = document.getElementById('novaSenha').value;
    const email = document.getElementById('novoEmail').value.trim();
    const departamento = document.getElementById('novoDepartamento').value;
    const tipo = document.getElementById('novoTipo').value;
    if (!usuario || !senha || !departamento) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    db.collection('usuarios').doc(usuario).set({
        senha: senha,
        tipo: tipo,
        departamento: departamento,
        email: email
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
        const tipoSessao = sessionStorage.getItem('tipo');
        const depSessao = sessionStorage.getItem('departamento');
        const tbody = document.getElementById('tabelaUsuarios').querySelector('tbody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const u = doc.data();
            // Restrição gestor: só vê seu departamento
            if (tipoSessao === 'gestor' && u.departamento !== depSessao) return;
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id}</td>
                    <td>${u.email || '-'}</td>
                    <td>${u.departamento || '-'}</td>
                    <td>${u.tipo}</td>
                    <td>
                        <input type="text" id="senha-${doc.id}" value="${u.senha}" readonly style="width:90px;">
                        <button class="acao-btn senha" onclick="editarSenhaUsuario('${doc.id}')">Alterar</button>
                    </td>
                    <td>
                        <button onclick="removerUsuario('${doc.id}')">Remover</button>
                    </td>
                </tr>
            `;
        });
    });
}

window.editarSenhaUsuario = function(usuario) {
    const novaSenha = prompt('Nova senha para o usuário:');
    if (!novaSenha) return;
    db.collection('usuarios').doc(usuario).update({
        senha: novaSenha
    }).then(() => {
        alert('Senha alterada!');
        listarUsuarios();
    });
};

window.removerUsuario = function(usuario) {
    if (confirm(`Remover usuário ${usuario}?`)) {
        db.collection('usuarios').doc(usuario).delete().then(() => {
            alert('Usuário removido');
            listarUsuarios();
        });
    }
}

// ESC só fecha modais (NÃO desloga)
document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") {
        fecharModal();
        fecharModalAdicionarAtividade();
        fecharModalEditarAtividade();
        fecharModalExcluirAtividade();
        fecharModalAjuda();
    }
});
