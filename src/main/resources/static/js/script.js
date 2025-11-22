// Constantes de Elementos do DOM
const TAREFAS_CONTAINER = document.getElementById('lista-tarefas-container');
const MODAL = document.getElementById('modal-tarefa');
const MODAL_TITLE = document.getElementById('modal-title');
const TAREFA_FORM = document.getElementById('tarefa-form');
const ADD_TAREFA_BTN = document.getElementById('btn-incluir-tarefa');
const API_URL = 'http://localhost:8080/api/tarefas';

// NOVOS ELEMENTOS DO MODAL DE CONFIRMAÇÃO
const CONFIRM_MODAL = document.getElementById('confirm-modal');
const CONFIRM_MESSAGE = document.getElementById('confirm-message');
const BTN_CONFIRM_YES = document.getElementById('btn-confirm-yes');
const BTN_CONFIRM_NO = document.getElementById('btn-confirm-no');

// Variável global temporária para armazenar o ID da tarefa a ser excluída
let tarefaIdParaExcluir = null;

// --- Funções Auxiliares de Formato e Visual ---

/**
 * Converte a data ISO (AAAA-MM-DD) para o formato brasileiro (DD/MM/AAAA).
 */
function formatarDataBR(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Cria a tag "ATRASADA" se a data de término for anterior à data atual.
 */
function checkAtrasada(dataTermino) {
    const hoje = new Date().toISOString().split('T')[0];
    if (dataTermino < hoje) {
        return '<span class="tag-atrasada">ATRASADA</span>';
    }
    return '';
}

/**
 * Converte um objeto Tarefa para o elemento HTML (Card).
 */
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

// --- Funções de API e Manipulação de Dados ---

/**
 * Carrega a lista de tarefas e renderiza os cartões.
 */
async function carregarTarefas() {
    TAREFAS_CONTAINER.innerHTML = '<p>Carregando tarefas...</p>';
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            // Este bloco lida com erros HTTP 4xx, 5xx
            throw new Error('Erro HTTP: ' + response.statusText);
        }
        const tarefas = await response.json();
        
        if (tarefas.length === 0) {
             TAREFAS_CONTAINER.innerHTML = '<p>Nenhuma tarefa cadastrada. Inclua uma nova tarefa!</p>';
        } else {
             TAREFAS_CONTAINER.innerHTML = tarefas.map(criarCardTarefa).join('');
             adicionarEventListeners(); // Adiciona cliques nos botões após a renderização
        }
    } catch (error) {
        // Este bloco lida com erros de conexão (Backend desligado)
        console.error("Erro ao carregar tarefas:", error);
        TAREFAS_CONTAINER.innerHTML = '<p style="color: red; font-weight: bold;">ERRO DE CONEXÃO: Não foi possível acessar o Backend. Verifique se o Spring Boot está rodando em http://localhost:8080.</p>';
    }
}

// FUNÇÕES DO MODAL DE CONFIRMAÇÃO CUSTOMIZADO

/**
 * Abre o modal de confirmação, definindo o ID da tarefa a ser excluída.
 */
function abrirModalConfirmacao(id, titulo) {
    tarefaIdParaExcluir = id;
    CONFIRM_MESSAGE.textContent = `Deseja excluir a tarefa "${titulo}" (ID ${id})?`;
    CONFIRM_MODAL.style.display = 'flex';
}

/**
 * Fecha o modal de confirmação e limpa a variável de ID.
 */
function fecharModalConfirmacao() {
    tarefaIdParaExcluir = null;
    CONFIRM_MODAL.style.display = 'none';
}

/**
 * Envia a requisição DELETE para a API após a confirmação.
 */
async function confirmarExclusao() {
    if (!tarefaIdParaExcluir) return;

    try {
        const response = await fetch(`${API_URL}/${tarefaIdParaExcluir}`, {
            method: 'DELETE',
        });

        fecharModalConfirmacao(); // Fecha o modal imediatamente

        if (response.status === 204) {
            alert(`Tarefa ID ${tarefaIdParaExcluir} excluída com sucesso!`);
            carregarTarefas(); // Recarrega a lista
        } else {
            alert('Erro ao excluir a tarefa. Status: ' + response.status);
        }

    } catch (error) {
        console.error("Erro na requisição DELETE:", error);
        fecharModalConfirmacao();
        alert('ERRO DE CONEXÃO: Não foi possível se comunicar com o servidor.');
    }
}

/**
 * Abre o modal de alteração e carrega os dados da tarefa no formulário.
 */
async function abrirModalAlteracao(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar a tarefa. Status: ${response.status}`);
        }
        
        const tarefa = await response.json();

        // 1. Preenche o formulário (Requisito: preencher campos com dados atuais)
        document.getElementById('tarefa-id').value = tarefa.id;
        document.getElementById('titulo').value = tarefa.titulo;
        document.getElementById('responsavel').value = tarefa.responsavel;
        document.getElementById('dataTermino').value = tarefa.dataTermino; // Formato YYYY-MM-DD
        document.getElementById('detalhamento').value = tarefa.detalhamento;

        // 2. Configura e abre o modal
        MODAL_TITLE.textContent = `Alterar Tarefa - ID ${tarefa.id}`;
        MODAL.style.display = 'flex';

    } catch (error) {
        console.error("Erro ao abrir modal de alteração:", error);
        alert('Não foi possível carregar os dados da tarefa para alteração. Verifique o console.');
    }
}

/**
 * Envia os dados do formulário para POST (criação) ou PUT (alteração).
 */
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
            // Lida com erros de validação (400 Bad Request) do Spring Boot
            const errorData = await response.json();
            let errorMessage = `Erro ao salvar a tarefa. Status: ${response.status}`;
            
            if (errorData.errors) {
                // Se houver erros de validação (@NotBlank, @NotNull)
                errorMessage += '\nCampos obrigatórios ou inválidos:\n' + errorData.errors.map(err => `- ${err.field}: ${err.defaultMessage}`).join('\n');
            } else if (errorData.message) {
                 errorMessage += '\n' + errorData.message;
            }
            
            alert(errorMessage); // Requisito: apresentar mensagem de erro
        }

    } catch (error) {
        // Lida com falha de conexão (Backend desligado)
        console.error("Erro na submissão do formulário:", error);
        alert('ERRO DE CONEXÃO: Não foi possível salvar. Verifique se o Backend (Spring Boot) está rodando!');
    }
});


// --- Funções de UI (Interface) e Inicialização ---

/**
 * Adiciona escutadores de eventos de clique para os botões (Excluir e Alterar).
 */
function adicionarEventListeners() {
    // Escutador para Botões de Exclusão (ABRE O NOVO MODAL)
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            // Busca o título para uma mensagem mais amigável
            const card = e.target.closest('.task-card');
            const tituloText = card ? card.querySelector('h3').textContent : `ID ${id}`;
            // Remove a tag "ATRASADA" se existir
            const titulo = tituloText.replace('ATRASADA', '').trim();
            
            abrirModalConfirmacao(id, titulo);
        };
    });
    
    // Escutador para Botões de Alteração
    document.querySelectorAll('.alterar-btn').forEach(button => {
        button.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            abrirModalAlteracao(id);
        };
    });
}

/**
 * Lógica do Modal de Confirmação
 */
BTN_CONFIRM_YES.addEventListener('click', confirmarExclusao);
BTN_CONFIRM_NO.addEventListener('click', fecharModalConfirmacao);


/**
 * Lógica do Modal de Inclusão/Alteração
 */
ADD_TAREFA_BTN.onclick = () => {
    MODAL_TITLE.textContent = 'Incluir Nova Tarefa';
    TAREFA_FORM.reset(); 
    document.getElementById('tarefa-id').value = ''; 
    MODAL.style.display = 'flex';
};

/**
 * Fecha os Modais ao clicar no 'X' ou fora dele.
 */
document.querySelector('.close-btn').onclick = () => { MODAL.style.display = 'none'; };
window.onclick = (event) => {
    if (event.target == MODAL) {
        MODAL.style.display = 'none';
    } else if (event.target == CONFIRM_MODAL) {
        fecharModalConfirmacao();
    }
};

// Inicializa a aplicação carregando as tarefas
document.addEventListener('DOMContentLoaded', carregarTarefas);