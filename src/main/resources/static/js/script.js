const TAREFAS_CONTAINER = document.getElementById('lista-tarefas-container');
const MODAL = document.getElementById('modal-tarefa');
const MODAL_TITLE = document.getElementById('modal-title');
const TAREFA_FORM = document.getElementById('tarefa-form');
const ADD_TAREFA_BTN = document.getElementById('btn-incluir-tarefa');
const API_URL = 'http://localhost:8080/api/tarefas';

const CONFIRM_MODAL = document.getElementById('confirm-modal');
const CONFIRM_MESSAGE = document.getElementById('confirm-message');
const BTN_CONFIRM_YES = document.getElementById('btn-confirm-yes');
const BTN_CONFIRM_NO = document.getElementById('btn-confirm-no');

let tarefaIdParaExcluir = null;

function formatarDataBR(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function checkAtrasada(dataTermino) {
    const hoje = new Date().toISOString().split('T')[0];
    if (dataTermino < hoje) {
        return '<span class="tag-atrasada">ATRASADA</span>';
    }
    return '';
}

function criarCardTarefa(tarefa) {
    const dataBR = formatarDataBR(tarefa.dataTermino);
    const tagAtrasada = checkAtrasada(tarefa.dataTermino);
    const isAtrasadaClass = tarefa.dataTermino < new Date().toISOString().split('T')[0] ? 'atrasada' : '';
    
    return `
        <div class="task-card ${isAtrasadaClass}" data-id="${tarefa.id}">
            <h3>${tarefa.titulo} ${tagAtrasada}</h3>
            <p><strong>Responsável:</strong> ${tarefa.responsavel}</p>
            <p><strong>Data de término:</strong> ${dataBR}</p>
            <p>${tarefa.detalhamento || 'Sem detalhamento.'}</p>
            <div class="task-actions" style="margin-top: 15px;">
                <button class="alterar-btn" data-id="${tarefa.id}">Alterar</button>
                <button class="delete-btn" data-id="${tarefa.id}">Excluir</button>
            </div>
        </div>
    `;
}

async function carregarTarefas() {
    TAREFAS_CONTAINER.innerHTML = '<p>Carregando tarefas...</p>';
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Erro HTTP: ' + response.statusText);
        }
        const tarefas = await response.json();
        
        if (tarefas.length === 0) {
             TAREFAS_CONTAINER.innerHTML = '<p>Nenhuma tarefa cadastrada. Inclua uma nova tarefa!</p>';
        } else {
             TAREFAS_CONTAINER.innerHTML = tarefas.map(criarCardTarefa).join('');
             adicionarEventListeners();
        }
    } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
        TAREFAS_CONTAINER.innerHTML = '<p style="color: red; font-weight: bold;">ERRO DE CONEXÃO: Não foi possível acessar o Backend. Verifique se o Spring Boot está rodando em http://localhost:8080.</p>';
    }
}

function abrirModalConfirmacao(id, titulo) {
    tarefaIdParaExcluir = id;
    CONFIRM_MESSAGE.textContent = `Deseja excluir a tarefa "${titulo}" (ID ${id})?`;
    CONFIRM_MODAL.style.display = 'flex';
}

function fecharModalConfirmacao() {
    tarefaIdParaExcluir = null;
    CONFIRM_MODAL.style.display = 'none';
}

async function confirmarExclusao() {
    if (!tarefaIdParaExcluir) return;

    try {
        const response = await fetch(`${API_URL}/${tarefaIdParaExcluir}`, {
            method: 'DELETE',
        });

        fecharModalConfirmacao();

        if (response.status === 204) {
            alert(`Tarefa ID ${tarefaIdParaExcluir} excluída com sucesso!`);
            carregarTarefas();
        } else {
            alert('Erro ao excluir a tarefa. Status: ' + response.status);
        }

    } catch (error) {
        console.error("Erro na requisição DELETE:", error);
        fecharModalConfirmacao();
        alert('ERRO DE CONEXÃO: Não foi possível se comunicar com o servidor.');
    }
}

async function abrirModalAlteracao(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar a tarefa. Status: ${response.status}`);
        }
        
        const tarefa = await response.json();

        document.getElementById('tarefa-id').value = tarefa.id;
        document.getElementById('titulo').value = tarefa.titulo;
        document.getElementById('responsavel').value = tarefa.responsavel;
        document.getElementById('dataTermino').value = tarefa.dataTermino;
        document.getElementById('detalhamento').value = tarefa.detalhamento;

        MODAL_TITLE.textContent = `Alterar Tarefa - ID ${tarefa.id}`;
        MODAL.style.display = 'flex';

    } catch (error) {
        console.error("Erro ao abrir modal de alteração:", error);
        alert('Não foi possível carregar os dados da tarefa para alteração. Verifique o console.');
    }
}

TAREFA_FORM.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('tarefa-id').value;
    const data = {
        titulo: document.getElementById('titulo').value,
        responsavel: document.getElementById('responsavel').value,
        dataTermino: document.getElementById('dataTermino').value,
        detalhamento: document.getElementById('detalhamento').value
    };

    const isUpdate = id !== '';
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Tarefa salva com sucesso!');
            MODAL.style.display = 'none';
            carregarTarefas();
        } else {
            const errorData = await response.json();
            let errorMessage = `Erro ao salvar a tarefa. Status: ${response.status}`;
            
            if (errorData.errors) {
                errorMessage += '\nCampos obrigatórios ou inválidos:\n' + errorData.errors.map(err => `- ${err.field}: ${err.defaultMessage}`).join('\n');
            } else if (errorData.message) {
                 errorMessage += '\n' + errorData.message;
            }
            
            alert(errorMessage);
        }

    } catch (error) {
        console.error("Erro na submissão do formulário:", error);
        alert('ERRO DE CONEXÃO: Não foi possível salvar. Verifique se o Backend (Spring Boot) está rodando!');
    }
});

function adicionarEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            const card = e.target.closest('.task-card');
            const tituloText = card ? card.querySelector('h3').textContent : `ID ${id}`;
            const titulo = tituloText.replace('ATRASADA', '').trim();
            
            abrirModalConfirmacao(id, titulo);
        };
    });
    
    document.querySelectorAll('.alterar-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            abrirModalAlteracao(id);
        };
    });
}

BTN_CONFIRM_YES.addEventListener('click', confirmarExclusao);
BTN_CONFIRM_NO.addEventListener('click', fecharModalConfirmacao);

ADD_TAREFA_BTN.onclick = () => {
    MODAL_TITLE.textContent = 'Incluir Nova Tarefa';
    TAREFA_FORM.reset(); 
    document.getElementById('tarefa-id').value = ''; 
    MODAL.style.display = 'flex';
};

document.querySelector('.close-btn').onclick = () => { MODAL.style.display = 'none'; };
window.onclick = (event) => {
    if (event.target == MODAL) {
        MODAL.style.display = 'none';
    } else if (event.target == CONFIRM_MODAL) {
        fecharModalConfirmacao();
    }
};

document.addEventListener('DOMContentLoaded', carregarTarefas);