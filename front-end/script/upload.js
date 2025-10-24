// Configurações
const SERVER_URL = 'https://api-musica-lv.onrender.com';

// Elementos DOM
const uploadForm = document.getElementById('uploadForm');
const audioFileInput = document.getElementById('audio_file');
const coverImageInput = document.getElementById('image_file');
const audioFileNameSpan = document.getElementById('audioFileName');
const coverFileNameSpan = document.getElementById('imageFileName');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const songsList = document.getElementById('songsList');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const messageDiv = document.getElementById('message');

// --- Variáveis de exclusão REMOVIDAS ---
// const deleteModal = ...
// const cancelDeleteBtn = ...
// const confirmDeleteBtn = ...

// Estado da aplicação
let songs = [];
// --- Estado de exclusão REMOVIDO ---
// let songToDelete = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM carregado, inicializando aplicação...');
    loadSongs();
    setupEventListeners();
});

// Configuração dos event listeners
function setupEventListeners() {
    // Preview de imagem ao selecionar arquivo
    if (coverImageInput) {
        coverImageInput.addEventListener('change', function (e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (previewImage) previewImage.src = e.target.result;
                    if (imagePreview) imagePreview.style.display = 'block';
                    if (previewPlaceholder) previewPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Mostrar nome do arquivo de áudio
    if (audioFileInput) {
        audioFileInput.addEventListener('change', function () {
            updateFileName(this, audioFileNameSpan, 'Nenhum arquivo de áudio');
        });
    }

    // Mostrar nome do arquivo de capa
    if (coverImageInput) {
        coverImageInput.addEventListener('change', function () {
            updateFileName(this, coverFileNameSpan, 'Nenhuma imagem de capa');
        });
    }

    // Submissão do formulário de upload
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');

            if (!audioFileInput.files[0] || !document.getElementById('name').value) {
                showMessage('Nome da música e arquivo de áudio são obrigatórios.', 'error');
                return;
            }

            // Mostrar loader
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline-block';
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('music', audioFileInput.files[0]);
            formData.append('name', document.getElementById('name').value);
            if (coverImageInput.files[0]) {
                formData.append('cover', coverImageInput.files[0]);
            }

            try {
                const response = await fetch(`${SERVER_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const newSong = await response.json();
                    showMessage(`Música "${newSong.nome}" enviada com sucesso!`, 'success');
                    uploadForm.reset();
                    resetFileName(audioFileNameSpan, 'Nenhum arquivo de áudio');
                    resetFileName(coverFileNameSpan, 'Nenhuma imagem de capa');
                    resetPreview();
                    loadSongs(); // Recarregar lista
                } else {
                    const error = await response.json();
                    throw new Error(error.error || `HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error('Erro ao enviar música:', error);
                showMessage(`Erro ao enviar: ${error.message}`, 'error');
            } finally {
                // Esconder loader
                if (btnText) btnText.style.display = 'inline-block';
                if (btnLoader) btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // Filtro de busca
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredSongs = songs.filter(song => song.nome.toLowerCase().includes(searchTerm));
            renderSongs(filteredSongs);
        });
    }

    // Botão de atualizar
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadSongs);
    }

    // --- Listeners de exclusão REMOVIDOS ---
    // if (cancelDeleteBtn) { ... }
    // if (confirmDeleteBtn) { ... }
}

// Funções de UI (Formulário)
function updateFileName(input, span, defaultText) {
    if (span) {
        span.textContent = input.files.length > 0 ? input.files[0].name : defaultText;
    }
}

function resetFileName(span, defaultText) {
    if (span) {
        span.textContent = defaultText;
    }
}

function resetPreview() {
    if (previewImage) previewImage.src = '#';
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewPlaceholder) previewPlaceholder.style.display = 'block';
}

// Carregar músicas da API
async function loadSongs() {
    if (!songsList) return;
    songsList.innerHTML = '<p class="loading">Carregando músicas...</p>';

    try {
        const response = await fetch(`${SERVER_URL}/api/music`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        songs = await response.json();
        
        // Ordena as músicas (opcional, mas bom para consistência)
        songs.sort((a, b) => a.nome.localeCompare(b.nome));
        
        renderSongs(songs);
    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
        songsList.innerHTML = '<p class="error">Falha ao carregar músicas. Tente atualizar.</p>';
    }
}

// Renderizar lista de músicas
function renderSongs(songsToRender) {
    if (!songsList) return;

    if (songsToRender.length === 0) {
        songsList.innerHTML = '<p>Nenhuma música encontrada.</p>';
        return;
    }

    songsList.innerHTML = songsToRender.map(song => {
        const coverUrl = song.capa ? `${SERVER_URL}${song.capa}` : '/static/assets/default-album.svg'; // Use um padrão
        
        return `
            <div class="song-item-manage">
                <img src="${coverUrl}" alt="Capa de ${song.nome}" class="song-cover-manage" onerror="this.src='/static/assets/default-album.svg'">
                <div class="song-info-manage">
                    <span class="song-title-manage">${song.nome}</span>
                    <span class="song-path-manage">${song.musica}</span>
                </div>
                </div>
        `;
    }).join('');
}

// --- Funções de exclusão REMOVIDAS ---
// function openDeleteModal(songId) { ... }
// async function confirmDelete() { ... }

// Exibir mensagens
function showMessage(text, type) {
    if (!messageDiv) return;

    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;

    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 4000);
}
