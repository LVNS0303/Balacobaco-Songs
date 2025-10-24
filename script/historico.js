// historico.js - Sistema de Histórico Simplificado (Apenas Leitura)
(() => {
    'use strict';

    // --- Configurações Globais ---
    const LOCAL_STORAGE_KEY = "spotify_facil_history";
    const DEFAULT_COVER = "/static/assets/default-album.svg";

    // --- Elementos da Página de Histórico ---
    let tbody, statusEl, pageInfo, pageSizeSelect, prevPageBtn, nextPageBtn;
    let historico = [];
    let paginaAtual = 1;
    let tamanhoPagina = 10;

    // --- Utilitários ---
    function formatarData(iso) {
        try {
            // Verifica se é um timestamp ou ISO string
            const date = iso instanceof Date ? iso : new Date(iso);

            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }

            return date.toLocaleString("pt-BR");
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return 'Data inválida';
        }
    }

    // --- Gerenciamento do LocalStorage (Apenas Leitura) ---
    function getHistoryFromLocalStorage() {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!stored) return [];

            const parsed = JSON.parse(stored);

            // Processa os itens para garantir que a data seja correta
            const processed = Array.isArray(parsed) ? parsed.map(item => {
                // Tenta converter a data de diferentes formatos
                let date;
                if (item.playedAt) {
                    date = new Date(item.playedAt);
                } else if (item.timestamp) {
                    date = new Date(item.timestamp);
                } else if (item.date) {
                    date = new Date(item.date);
                } else {
                    date = new Date(); // Data atual como fallback
                }

                return {
                    ...item,
                    playedAt: date.toISOString() // Garante formato consistente
                };
            }) : [];

            return processed;
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
            return [];
        }
    }

    // --- Interface da Página de Histórico ---
    function renderizarTabela() {
        if (!tbody) {
            console.error("❌ Elemento tbody não encontrado!");
            return;
        }

        historico = getHistoryFromLocalStorage();
        tamanhoPagina = parseInt(pageSizeSelect?.value || '10', 10);

        tbody.innerHTML = "";

        if (historico.length === 0) {
            statusEl.textContent = "Nenhuma música no histórico.";
            statusEl.style.color = "var(--muted)";
            updatePaginationControls(0);
            return;
        } else {
            statusEl.textContent = "";
        }

        const total = historico.length;
        const inicio = (paginaAtual - 1) * tamanhoPagina;
        const fim = inicio + tamanhoPagina;
        const itensPaginados = historico.slice(inicio, fim);

        itensPaginados.forEach((item) => {
            const tr = document.createElement("tr");
            tr.className = "history-row";
            tr.style.height = "40px"; // Altura reduzida da linha

            // Célula da Música - Imagem e conteúdo compactos
            const songCell = document.createElement("td");
            songCell.className = "song-cell";
            songCell.style.padding = "4px 8px"; // Padding reduzido
            songCell.innerHTML = `
                <div class="song-entry" style="display: flex; align-items: center; gap: 8px; height: 32px;">
                    <img src="${item.image_url || DEFAULT_COVER}" 
                         alt="Capa de ${item.title}" 
                         class="song-cover"
                         style="width: 24px; height: 24px; object-fit: cover; border-radius: 3px; flex-shrink: 0;"
                         onerror="this.src='${DEFAULT_COVER}'">
                    <div class="song-info" style="display: flex; flex-direction: column; justify-content: center; line-height: 1.2; min-height: 0; flex: 1;">
                        <span class="title" style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || 'Sem título'}</span>
                        <span class="artist" style="font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.artist || 'Artista desconhecido'}</span>
                    </div>
                </div>
            `;

            // Célula da Data - Compacta
            const dateCell = document.createElement("td");
            dateCell.className = "date-cell";
            dateCell.style.padding = "4px 8px";
            dateCell.style.fontSize = "12px";
            dateCell.textContent = formatarData(item.playedAt);

            tr.appendChild(songCell);
            tr.appendChild(dateCell);
            tbody.appendChild(tr);
        });

        updatePaginationControls(total);
    }

    function updatePaginationControls(total) {
        const totalPaginas = Math.ceil(total / tamanhoPagina);

        if (pageInfo) {
            pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas} (${total} músicas)`;
        }

        if (prevPageBtn) {
            prevPageBtn.disabled = paginaAtual === 1;
            prevPageBtn.style.opacity = paginaAtual === 1 ? '0.5' : '1';
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = paginaAtual >= totalPaginas;
            nextPageBtn.style.opacity = paginaAtual >= totalPaginas ? '0.5' : '1';
        }
    }

    function criarBotaoLimparHistorico() {
        const clearBtn = document.createElement("button");
        clearBtn.id = "clearHistoryBtn";
        clearBtn.textContent = "🗑️ Limpar Histórico";
        clearBtn.className = "btn btn-danger";
        clearBtn.style.marginLeft = "10px";
        clearBtn.addEventListener("click", limparHistorico);

        return clearBtn;
    }

    function limparHistorico() {
        if (confirm("Tem certeza que deseja limpar todo o histórico de músicas?")) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            historico = [];
            paginaAtual = 1;
            renderizarTabela();

            if (statusEl) {
                statusEl.textContent = "Histórico limpo com sucesso!";
                statusEl.style.color = "#b388ff";

                setTimeout(() => {
                    if (statusEl.textContent === "Histórico limpo com sucesso!") {
                        statusEl.textContent = "Nenhuma música no histórico.";
                    }
                }, 3000);
            }

            console.log('🗑️ Histórico limpo com sucesso');
        }
    }

    // --- Inicialização ---
    function init() {
        // Detecta se estamos na página de histórico
        if (!document.getElementById("tbody")) {
            return;
        }

        console.log('📖 Inicializando página de histórico (modo leitura)...');

        // Configurar elementos da página de histórico
        tbody = document.getElementById("tbody");
        statusEl = document.getElementById("status");
        pageInfo = document.getElementById("pageInfo");
        pageSizeSelect = document.getElementById("pageSize");
        prevPageBtn = document.getElementById("prevPage");
        nextPageBtn = document.getElementById("nextPage");

        // Adicionar botão de limpar histórico
        const controlsContainer = document.querySelector(".pagination-controls");
        if (controlsContainer && !document.getElementById('clearHistoryBtn')) {
            const clearBtn = criarBotaoLimparHistorico();
            controlsContainer.appendChild(clearBtn);
        }

        renderizarTabela();

        // Configurar eventos
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener("change", () => {
                paginaAtual = 1;
                renderizarTabela();
            });
        }

        if (prevPageBtn) {
            prevPageBtn.addEventListener("click", () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarTabela();
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener("click", () => {
                const total = historico.length;
                const totalPaginas = Math.ceil(total / tamanhoPagina);
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarTabela();
                }
            });
        }
    }

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();