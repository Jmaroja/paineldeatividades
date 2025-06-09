const firebaseConfig = {
  apiKey: "AIzaSyBndhAbgEbFxCZvTVfkqMH6MTuyzhPTxUo",
  authDomain: "nordil-atividades.firebaseapp.com",
  projectId: "nordil-atividades",
  storageBucket: "nordil-atividades.appspot.com",
  messagingSenderId: "138660523776",
  appId: "1:138660523776:web:d47955e6b48401c233cde5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let chartBarras, chartLinha, chartMotivos; //painel dashs


// SPLASH
const splash = document.getElementById('splash');
splash.classList.add('ativo');

setTimeout(() => {
    splash.classList.remove('ativo');
}, 1100); // tempo que o splash ficará visível
    document.getElementById('splash').style.display = '';

     // Mostrar opções de recorrência apenas se tipo for "recorrente"
    const tipoSelect = document.getElementById('novoTipoAtividade');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function () {
            const tipo = this.value;
            document.getElementById('opcoesRecorrencia').style.display = tipo === 'recorrente' ? '' : 'none';
        });
    }
    // Alternar entre recorrência por semana e por dia fixo
const selectTipoRecorrencia = document.getElementById("tipoRecorrenciaAvancada");
if (selectTipoRecorrencia) {
    selectTipoRecorrencia.addEventListener("change", function () {
        const tipo = this.value;
        document.getElementById("blocoSemana").style.display = tipo === "semana" ? "" : "none";
        document.getElementById("blocoMensal").style.display = tipo === "mensal" ? "" : "none";
    });
}


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
            if (doc.data().tipo === "comum") {
            document.getElementById("btnDashboard").style.display = "none";
            if (doc.data().tipo === "comum") {
            document.getElementById("filtrosLaterais").style.display = "none";
            
}

            
}

        } else {
            erroLogin.textContent = 'Usuário ou senha inválidos.';
        }
    }).catch(() => {
        erroLogin.textContent = 'Erro ao acessar banco de dados.';
    });
}
function exibirSistema(usuario, tipo, departamento) {
    document.getElementById('splash').style.display = '';
    setTimeout(function () {
        document.getElementById('login').style.display = 'none';
        document.querySelector('header').style.display = '';
        document.querySelector('.painel-main').style.display = 'flex';
        document.getElementById('aba-calendario').style.display = '';
        document.getElementById('aba-dashboard').style.display = 'none';
        document.getElementById('aba-usuarios').style.display = 'none';
        document.getElementById('aba-logs').style.display = 'none';
        document.querySelector('footer').style.display = '';
        document.getElementById('usuarioLogado').textContent = `Usuário: ${usuario}`;
        document.getElementById('departamentoLogado').textContent = departamento ? `Depto: ${departamento}` : '';
        document.title = "Painel de Atividades";
        if (tipo === "comum") {
            document.getElementById("btnDashboard").style.display = "none";
            document.getElementById("filtrosLaterais").style.display = "none";
}

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
        marcarAbaAtiva('aba-calendario');
        carregarAtividades();
        listarUsuarios();
        inicializarCalendario();
        verificarFinalizacaoAutomatica();
        checarPendenciasDiaAnterior();
        setTimeout(function () {
            document.getElementById('splash').style.display = 'none';
        }, 1000);
    }, 180);
}

// LOGOUT
function fazerLogout() {
    sessionStorage.clear();
    document.querySelector('header').style.display = 'none';
    document.querySelector('.painel-main').style.display = 'none';
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
    marcarAbaAtiva('aba-calendario');
}

// Abas
window.abrirAba = function (aba) {
    const tipoUsuario = sessionStorage.getItem('tipo');
    if (aba === 'dashboard' && tipoUsuario === 'comum') return; // Bloqueia comum          
    document.querySelectorAll('.painel-content section').forEach(sec => sec.style.display = 'none');
    marcarAbaAtiva('aba-' + aba);
    document.getElementById('aba-' + aba).style.display = '';
    if (aba === 'dashboard' && !dashboardRenderizado) {
    if (atividades.length > 0) {
        atualizarDashboard();
        dashboardRenderizado = true;
    } else {
        console.warn("Dashboard ainda não carregado: sem dados.");
    }

}
    if (aba === 'logs') carregarLogsExclusao();
    if (aba === 'usuarios') listarUsuarios();
    if (aba === 'calendario') inicializarCalendario();
};
function marcarAbaAtiva(id) {
    document.querySelectorAll('.nav-tabs button, .btn-sidebar-aba').forEach(btn => btn.classList.remove('active'));
    let btn = document.querySelector(`#btn${capitalize(id.replace('aba-', ''))}`);
    if (btn) btn.classList.add('active');
}
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Tema claro/escuro
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
        setTimeout(() => exibirSistema(usuario, tipo, departamento), 120);
    }
})();

// ATIVIDADES - CRUD
let todasAtividades = [];
let atividadesFiltradas = [];
let calendar = null;
let usuariosMap = {};
let dashboardRenderizado = false;


function listarUsuariosMap() {
    db.collection('usuarios').get().then(snapshot => {
        usuariosMap = {};
        snapshot.forEach(doc => {
            usuariosMap[doc.id] = doc.data();
        });
    });
}
listarUsuariosMap();

// Finalização automática às 18h (local)
function verificarFinalizacaoAutomatica() {
    const usuario = sessionStorage.getItem('usuario');
    if (!usuario) return;
    const agora = new Date();
    if (agora.getHours() >= 18) {
        db.collection('atividades').get().then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => {
                const atv = doc.data();
                if (atv.status !== "realizado" && atv.status !== "naoRealizado" && atv.data === agora.toISOString().slice(0,10)) {
                    batch.update(doc.ref, {
                        status: "naoRealizado",
                        motivo: "Não finalizada no prazo"
                    });
                }
            });
            if (!snapshot.empty) return batch.commit().then(() => carregarAtividades());
        });
    }
}

// Checar pendências do dia anterior
function checarPendenciasDiaAnterior() {
    const usuario = sessionStorage.getItem('usuario');
    if (!usuario) return;
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    db.collection('atividades').where('responsavel', '==', usuario)
        .where('data', '==', ontem)
        .where('status', '!=', 'realizado')
        .get().then(snapshot => {
            let pendentes = [];
            snapshot.forEach(doc => {
                let a = doc.data();
                a.id = doc.id;
                if (a.status !== 'realizado') pendentes.push(a);
            });
            if (pendentes.length > 0) {
                mostrarModalPendencias(pendentes);
            }
        });
}

// Modal de pendências
function mostrarModalPendencias(pendentes) {
    let lista = document.getElementById('listaPendencias');
    lista.innerHTML = '';
    pendentes.forEach(a => {
        lista.innerHTML += `
        <div class="pendencia-bloco">
            <div><b>Atividade:</b> ${a.atividade}</div>
            <div><b>Data:</b> ${a.data}</div>
            <div><b>Status:</b> ${statusFormatado(a.status, a.motivo)}</div>
            <button class="btn-pendencia realizado" onclick="marcarPendenciaRealizado('${a.id}')">Marcar como Realizado</button>
            <button class="btn-pendencia reagendar" onclick="reagendarPendencia('${a.id}')">Reagendar para hoje</button>
            <button class="btn-pendencia naorealizado" onclick="marcarPendenciaNaoRealizado('${a.id}')">Confirmar Não Realizado</button>
        </div>
        `;
    });
    document.getElementById('modalPendencias').style.display = 'block';
}
window.fecharModalPendencias = function() {
    document.getElementById('modalPendencias').style.display = 'none';
};
window.marcarPendenciaRealizado = function(id) {
    db.collection('atividades').doc(id).update({
        status: 'realizado',
        motivo: ''
    }).then(() => {
        fecharModalPendencias();
        carregarAtividades();
    });
};
window.reagendarPendencia = function(id) {
    const hoje = new Date().toISOString().slice(0,10);
    db.collection('atividades').doc(id).update({
        data: hoje,
        status: 'pendente',
        motivo: ''
    }).then(() => {
        fecharModalPendencias();
        carregarAtividades();
    });
};
window.marcarPendenciaNaoRealizado = function(id) {
    db.collection('atividades').doc(id).update({
        status: 'naoRealizado',
        motivo: 'Não finalizada no prazo'
    }).then(() => {
        fecharModalPendencias();
        carregarAtividades();
    });
};
// ----------- ATIVIDADES - CRUD & CALENDÁRIO ------------
window.processCSV = function () {
    const file = document.getElementById('csvFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        const lines = e.target.result.split('\n');
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());

        const colIndex = {
            data: header.indexOf('data'),
            responsavel: header.indexOf('responsavel'),
            atividade: header.indexOf('atividade'),
            tipo: header.indexOf('tipo'),
            descricao: header.indexOf('descricao'),
            diasSemana: header.indexOf('diassemana'),
            repetirMes: header.indexOf('repetirmes'),
            status: header.indexOf('status'),
            departamento: header.indexOf('departamento')
        };

        let atividades = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const campos = line.split(',');

            const atividade = {
                data: campos[colIndex.data]?.trim() || '',
                responsavel: campos[colIndex.responsavel]?.trim() || '',
                atividade: campos[colIndex.atividade]?.trim() || '',
                tipo: campos[colIndex.tipo]?.trim() || 'urgente',
                descricao: campos[colIndex.descricao]?.trim() || '',
                status: campos[colIndex.status]?.trim() || 'pendente',
                departamento: campos[colIndex.departamento]?.trim() || '',
            };

            if (colIndex.diasSemana !== -1) {
                const diasRaw = campos[colIndex.diasSemana]?.trim();
                atividade.diasSemana = diasRaw ? diasRaw.split('|') : [];
            }

            if (colIndex.repetirMes !== -1) {
                atividade.repetirMes = campos[colIndex.repetirMes]?.trim().toLowerCase() === 'true';
            }

            atividades.push(atividade);
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
        inicializarCalendario();
// Se a aba dashboard estiver visível e ainda não foi renderizada, atualiza agora
if (document.getElementById("aba-dashboard").style.display !== "none" && !dashboardRenderizado) {
    atualizarDashboard();
    dashboardRenderizado = true;
}


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
            title: sessionStorage.getItem('tipo') === "gestor" ? `${a.responsavel}: ${a.atividade}` : a.atividade,
            start: a.data,
            color: a.status === "realizado"
                ? "#22b573"
                : a.status === "naoRealizado"
                ? "#d32f2f" // vermelho escur
                : a.tipo === "urgente" ? "#e74c3c"
                : a.tipo === "recorrente" ? "#2980ef"
                : "#ffc107",
            classNames: [
                 a.status === "realizado"
                ? "realizado"
                : a.status === "naoRealizado"
                ? "naoRealizado"
            : (a.tipo || 'urgente')
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
function renderizarTabelaAtividades() {
    const usuario = sessionStorage.getItem('usuario');
    const tipo = sessionStorage.getItem('tipo');
    const tbody = document.getElementById('tabelaAtividades').querySelector('tbody');
    tbody.innerHTML = '';

    // Ordena por data DESC antes de exibir
    const atividadesOrdenadas = atividadesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

    atividadesOrdenadas.forEach(a => {
        const podeEditar = tipo === 'admin' || tipo === "gestor" || a.responsavel === usuario;
        tbody.innerHTML += `
            <tr>
                <td>${formatarDataBrasileira(a.data)}</td>
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
function formatarDataBrasileira(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-'); // [ano, mes, dia]
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
function statusFormatado(status, motivo) {
    if (status === 'realizado') return 'Realizado';
    if (status === 'naoRealizado') return 'Não Realizado' + (motivo ? ` (${motivo})` : '');
    return 'Pendente';
}

// MODAIS DE ATIVIDADE
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
window.excluirAtividadeDireto = function () {
    if (!atividadeSelecionada || !atividadeSelecionada.id) return;

    if (confirm(`Tem certeza que deseja excluir a atividade "${atividadeSelecionada.atividade}"?`)) {
        // Grava log de exclusão
        db.collection('logs_exclusao').add({
            datahora: new Date().toISOString(),
            quem: sessionStorage.getItem('usuario'),
            motivo: 'Exclusão direta via modal de detalhes',
            atividade: {
                data: atividadeSelecionada.data,
                departamento: atividadeSelecionada.departamento || '',
                responsavel: atividadeSelecionada.responsavel,
                atividade: atividadeSelecionada.atividade,
                tipo: atividadeSelecionada.tipo || 'urgente',
                status: atividadeSelecionada.status || 'pendente'
            }
        });

        // Exclui atividade
        db.collection('atividades').doc(atividadeSelecionada.id).delete().then(() => {
            fecharModal();
            carregarAtividades();
            alert("Atividade excluída com sucesso.");
        });
    }
};

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
document.getElementById('formAdicionarAtividade').onsubmit = async function (e) {
    e.preventDefault();

    if (Object.keys(usuariosMap).length === 0) {
        await listarUsuariosMap(); // Garante que o mapa está carregado
    }

    const data = document.getElementById('novaData').value;
    const tipoAtv = document.getElementById('novoTipoAtividade').value;
    let responsavel = document.getElementById('novoResponsavel').value.trim();
    let atividade = document.getElementById('novaAtividade').value.trim();
    let descricao = document.getElementById('novaDescricao').value.trim();
    let repetirMes = document.getElementById('repetirMes')?.checked || false;

    const tipoUsuario = sessionStorage.getItem('tipo');
    const departamento =
        tipoUsuario === "admin" || tipoUsuario === "gestor"
            ? (usuariosMap[responsavel]?.departamento || sessionStorage.getItem('departamento'))
            : sessionStorage.getItem('departamento');

    const atividadesParaSalvar = [];

   if (tipoAtv === 'recorrente') {
    const tipoRecorrencia = document.getElementById('tipoRecorrenciaAvancada').value;
    const dataInicial = new Date(data);
    if (isNaN(dataInicial)) {
        document.getElementById('msgAdicionarAtividade').textContent = "Data inválida.";
        return;
    }

    const ano = dataInicial.getFullYear();
    const mes = dataInicial.getMonth();

    if (tipoRecorrencia === 'semana') {
        const checkboxesSelecionados = document.querySelectorAll('#blocoSemana input[type="checkbox"]:checked');
        const diasSelecionados = Array.from(checkboxesSelecionados).map(cb => parseInt(cb.value));

        if (diasSelecionados.length === 0) {
            document.getElementById('msgAdicionarAtividade').textContent = "Selecione ao menos um dia da semana para repetir.";
            return;
        }

        const ultimoDia = new Date(ano, mes + 1, 0).getDate();

        for (let dia = 1; dia <= ultimoDia; dia++) {
            const atual = new Date(ano, mes, dia);
            if (
                diasSelecionados.includes(atual.getDay()) &&
                atual >= dataInicial
            ) {
                atividadesParaSalvar.push({
                    data: atual.toISOString().slice(0, 10),
                    responsavel,
                    atividade,
                    tipo: tipoAtv,
                    descricao,
                    departamento: departamento || '',
                    status: 'pendente'
                });
            }
        }

        console.log(`[Recorrente - Semana] Dias gerados: ${atividadesParaSalvar.length}`);
    }

    else if (tipoRecorrencia === 'mensal') {
        const diaFixo = parseInt(document.getElementById('diaFixo').value);
        if (isNaN(diaFixo) || diaFixo < 1 || diaFixo > 31) {
            document.getElementById('msgAdicionarAtividade').textContent = "Informe um dia do mês válido.";
            return;
        }

        for (let i = 0; i < 3; i++) { // próximos 3 meses
            const dataGerada = new Date(ano, mes + i, diaFixo);
            if (dataGerada >= dataInicial && dataGerada.getDate() === diaFixo) {
                atividadesParaSalvar.push({
                    data: dataGerada.toISOString().slice(0, 10),
                    responsavel,
                    atividade,
                    tipo: tipoAtv,
                    descricao,
                    departamento: departamento || '',
                    status: 'pendente'
                });
            }
        }

        console.log(`[Recorrente - Mensal] Dias gerados: ${atividadesParaSalvar.length}`);
    }
}
else {
    // Tipo urgente ou extra — adiciona uma única atividade
    atividadesParaSalvar.push({
        data,
        responsavel,
        atividade,
        tipo: tipoAtv,
        descricao,
        departamento: departamento || '',
        status: 'pendente'
    });
    console.log(`[Única] Adicionando uma atividade para ${data}`);
}


    const batch = db.batch();
    atividadesParaSalvar.forEach(atv => {
        const ref = db.collection('atividades').doc();
        batch.set(ref, atv);
    });

    await batch.commit();

    document.getElementById('msgAdicionarAtividade').textContent = "Atividade(s) adicionada(s) com sucesso!";
    setTimeout(() => {
        fecharModalAdicionarAtividade();
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

    // Remove atividade do Firestore
    await db.collection('atividades').doc(id).delete();

    // Remove atividade visual do calendário
    calendar.getEventById(id)?.remove();

    // Fecha modal e recarrega dashboard e tabela
    fecharModalExcluirAtividade();
    carregarAtividades();

    alert("Atividade excluída e log registrada!");
};


// ----------- DASHBOARD, GRÁFICOS, LOGS E EXPORTAÇÃO -----------
function atualizarDashboard() {
    document.getElementById('totalAtividades').textContent = atividadesFiltradas.length;
    const realizadas = atividadesFiltradas.filter(a => a.status === 'realizado').length;
    const naoRealizadas = atividadesFiltradas.filter(a => a.status === 'naoRealizado').length;
    document.getElementById('totalRealizadas').textContent = realizadas;
    document.getElementById('totalNaoRealizadas').textContent = naoRealizadas;
    document.getElementById('percentualConclusao').textContent =
        atividadesFiltradas.length ? Math.round(realizadas / atividadesFiltradas.length * 100) + '%' : '0%';
}

function renderizarGraficos() {
    // Barras
    const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
    if (chartBarras) chartBarras.destroy();chartBarras = null;
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
    if (chartLinha) chartLinha.destroy();chartLinha = null;
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
    if (chartMotivos) chartMotivos.destroy();chartMotivos = null;
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

// ----------- USUÁRIOS (CRUD ADMIN/GESTOR) -----------
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
                    <td><input type="text" id="login-${doc.id}" value="${doc.id}" style="width:120px;" disabled>
  <button onclick="editarLoginUsuario('${doc.id}')">Editar Login</button>
</td>

                    <td><input type="email" id="email-${doc.id}" value="${u.email || ''}" style="width:150px"></td>
                    <td>
                        <select id="dep-${doc.id}">
                            <option value="DP"${u.departamento==="DP"?" selected":""}>DP</option>
                            <option value="Comercial"${u.departamento==="Comercial"?" selected":""}>Comercial</option>
                            <option value="Financeiro"${u.departamento==="Financeiro"?" selected":""}>Financeiro</option>
                            <option value="TI"${u.departamento==="TI"?" selected":""}>TI</option>
                            <option value="Compras"${u.departamento==="Compras"?" selected":""}>Compras</option>
                            <option value="Outros"${u.departamento==="Outros"?" selected":""}>Outros</option>
                        </select>
                        <button class="acao-btn senha" onclick="alterarDepartamentoUsuario('${doc.id}')">Salvar</button>
                    </td>
                    <td>
                        <select id="tipo-${doc.id}">
                            <option value="comum"${u.tipo==="comum"?" selected":""}>Comum</option>
                            <option value="gestor"${u.tipo==="gestor"?" selected":""}>Gestor</option>
                            <option value="admin"${u.tipo==="admin"?" selected":""}>Admin</option>
                        </select>
                        <button class="acao-btn senha" onclick="alterarTipoUsuario('${doc.id}')">Salvar</button>
                    </td>
                    <td>
                        <input type="text" id="senha-${doc.id}" value="${u.senha}" readonly style="width:90px;">
                        <button class="acao-btn senha" onclick="editarSenhaUsuario('${doc.id}')">Alterar</button>
                    </td>
                    <td>
                        <button onclick="alterarEmailUsuario('${doc.id}')">Salvar Email</button>
                        <button onclick="removerUsuario('${doc.id}')">Remover</button>
                    </td>
                </tr>
            `;
        });
    });
    
}


window.editarLoginUsuario = function(idAntigo) {
    const input = document.getElementById(`login-${idAntigo}`);
    if (input.disabled) {
        input.disabled = false;
        input.focus();
    } else {
        const novoId = input.value.trim();
        if (!novoId || novoId === idAntigo) {
            input.disabled = true;
            return;
        }

        const usuarioRef = db.collection('usuarios').doc(idAntigo);
        usuarioRef.get().then(doc => {
            if (doc.exists) {
                const dados = doc.data();
                db.collection('usuarios').doc(novoId).set(dados).then(() => {
                    usuarioRef.delete().then(() => {
                        alert("Login atualizado com sucesso!");
                        listarUsuarios();
                    });
                });
            }
        }).catch(err => {
            alert("Erro ao atualizar login: " + err.message);
        });

        input.disabled = true;
    }
}
window.alterarDepartamentoUsuario = function(usuario) {
    const novoDep = document.getElementById('dep-' + usuario).value;
    db.collection('usuarios').doc(usuario).update({
        departamento: novoDep
    }).then(() => {
        alert('Departamento alterado!');
        listarUsuarios();
    });
};
window.alterarTipoUsuario = function(usuario) {
    const novoTipo = document.getElementById('tipo-' + usuario).value;
    db.collection('usuarios').doc(usuario).update({
        tipo: novoTipo
    }).then(() => {
        alert('Tipo alterado!');
        listarUsuarios();
    });
};
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
window.alterarEmailUsuario = function(usuario) {
    const novoEmail = document.getElementById('email-' + usuario).value;
    db.collection('usuarios').doc(usuario).update({
        email: novoEmail
    }).then(() => {
        alert('E-mail alterado!');
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

// ESC só fecha modais (NÃO desloga)
document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") {
        fecharModal();
        fecharModalAdicionarAtividade();
        fecharModalEditarAtividade();
        fecharModalExcluirAtividade();
        fecharModalAjuda && fecharModalAjuda();
        fecharModalPendencias && fecharModalPendencias();
    }
});
// Modal Add
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
    document.getElementById('msgAdicionarAtividade').textContent = "Atividade adicionada com sucesso!";
    setTimeout(() => {
        fecharModalAdicionarAtividade();
        carregarAtividades();
    }, 900);
};
// Modais extras
function fecharModalAjuda() {
    document.getElementById('modalAjuda').style.display = 'none';
}

       let html = '';
    for (const responsavel in agrupado) {
        html += `<h3>${responsavel}</h3><ul>`;
        agrupado[responsavel].forEach(a => {
            html += `<li><b>${a.atividade}</b> — ${a.tipo} — ${a.status || 'pendente'}</li>`;
        });
        html += `</ul><hr>`;
    }

    document.getElementById('dataResumoPDF').textContent = hoje.split('-').reverse().join('/');
    document.getElementById('conteudoResumoPDF').innerHTML = html;
