// historico.js (CORRIGIDO)
(() => {
    'use strict';

    const LOCAL_STORAGE_KEY = "spotify_facil_history";
    
    // --- CORREÇÃO INICIA AQUI ---
    const DEFAULT_COVER_PATH = "/static/assets/default-album.svg";
    const API_URL = localStorage.getItem('serverUrl') || ''; // Pega a URL da API

    // Função helper para montar a URL completa
    function getFullImageUrl(relativePath) {
        if (!relativePath) relativePath = DEFAULT_COVER_PATH;
        if (!API_URL) return relativePath; 
        
        const cleanBase = API_URL.replace(/\/+$/, '');
        const cleanRelative = relativePath.replace(/^\/+/, '');
        return `${cleanBase}/${cleanRelative}`;
    }

    const FULL_DEFAULT_COVER_URL = getFullImageUrl(DEFAULT_COVER_PATH);
    // --- FIM DA CORREÇÃO ---

    let tbody, statusEl, pageInfo, pageSizeSelect, prevPageBtn, nextPageBtn;
    let historico = [];
    let paginaAtual = 1;
    let tamanhoPagina = 10;

    function formatarData(iso) {
        try {
            const date = iso instanceof Date ? iso : new Date(iso);
            if (isNaN(date.getTime())) return 'Data inválida';
            return date.toLocaleString("pt-BR");
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return 'Data inválida';
        }
    }

    function getHistoryFromLocalStorage() {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Erro ao carregar histórico do LocalStorage:", error);
            return [];
        }
    }

    function criarBotaoLimparHistorico() {
        const clearBtn = document.createElement("button");
        clearBtn.id = "clearHistoryBtn";
        clearBtn.className = "btn-clear-history";
        clearBtn.textContent = "Limpar Histórico";
        clearBtn.addEventListener("click", () => {
            if (confirm("Tem certeza que deseja limpar todo o histórico de músicas tocadas? Esta ação não pode ser desfeita.")) {
                try {
                    localStorage.setItem(LOCAL_STORAGE_KEY, "[]");
                    historico = [];
                    paginaAtual = 1;
                    renderizarTabela();
                } catch (error) {
                    console.error("Erro ao limpar o histórico:", error);
                    if (statusEl) statusEl.textContent = "Erro ao limpar o histórico.";
                }
            }
        });
        return clearBtn;
    }

    function renderizarTabela() {
        if (!tbody) return;

        tamanhoPagina = parseInt(pageSizeSelect.value, 10) || 10;
        const total = historico.length;
        const totalPaginas = Math.ceil(total / tamanhoPagina) || 1;
        paginaAtual = Math.min(paginaAtual, totalPaginas);
        if (paginaAtual < 1) paginaAtual = 1;

        const inicio = (paginaAtual - 1) * tamanhoPagina;
        const fim = inicio + tamanhoPagina;
        const itensPagina = historico.slice(inicio, fim);

        if (statusEl) {
            statusEl.textContent = total === 0 ? "Histórico vazio." : `Mostrando ${inicio + 1}–${Math.min(fim, total)} de ${total} registros.`;
        }
        if (pageInfo) {
            pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        }
        if (prevPageBtn) {
            prevPageBtn.disabled = (paginaAtual <= 1);
        }
        if (nextPageBtn) {
            nextPageBtn.disabled = (paginaAtual >= totalPaginas);
        }

        tbody.innerHTML = ""; // Limpar tabela
        if (itensPagina.length === 0 && total > 0) {
            tbody.innerHTML = `<tr><td colspan="3">Nenhum item nesta página.</td></tr>`;
        } else if (itensPagina.length === 0) {
             tbody.innerHTML = `<tr><td colspan="3">Nenhum registro encontrado.</td></tr>`;
        }

        itensPagina.forEach(item => {
            // --- CORREÇÃO APLICADA AQUI ---
            const imgUrl = getFullImageUrl(item.capa); // Usa a função helper
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="song-cell">
                        <img src="${imgUrl}" alt="Capa" class="history-cover" onerror="this.src='${FULL_DEFAULT_COVER_URL}'">
                        <span>${item.nome || '(Sem título)'}</span>
                    </div>
                </td>
                <td>${formatarData(item.playedAt)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function init() {
        historico = getHistoryFromLocalStorage();

        tbody = document.querySelector("#historyTable tbody");
        statusEl = document.getElementById("statusMessage");
        pageInfo = document.getElementById("pageInfo");
        pageSizeSelect = document.getElementById("pageSize");
        prevPageBtn = document.getElementById("prevPage");
        nextPageBtn = document.getElementById("nextPage");

        if (!tbody || !pageSizeSelect || !prevPageBtn || !nextPageBtn) {
            console.error("Erro: Elementos essenciais da paginação não encontrados.");
            return;
        }

        const controlsContainer = document.querySelector(".pagination-controls");
        if (controlsContainer && !document.getElementById('clearHistoryBtn')) {
            const clearBtn = criarBotaoLimparHistorico();
            controlsContainer.appendChild(clearBtn);
        }

        renderizarTabela();

        pageSizeSelect.addEventListener("change", () => {
            paginaAtual = 1;
            renderizarTabela();
        });

        prevPageBtn.addEventListener("click", () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarTabela();
            }
        });

        nextPageBtn.addEventListener("click", () => {
            const total = historico.length;
            const totalPaginas = Math.ceil(total / tamanhoPagina);
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarTabela();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
