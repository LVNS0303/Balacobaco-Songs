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
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Estado da aplicação
let songs = [];
let songToDelete = null;

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
            const file = e.target.files[0];
            if (file) {
                coverFileNameSpan.textContent = file.name;
                showImagePreview(file);
            } else {
                coverFileNameSpan.textContent = 'Nenhum arquivo selecionado';
                hideImagePreview();
            }
        });
    }

    // Atualizar nome do arquivo de áudio
    if (audioFileInput) {
        audioFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            audioFileNameSpan.textContent = file ? file.name : 'Nenhum arquivo selecionado';

            // Validação básica do tipo de arquivo
            if (file && !file.type.startsWith('audio/')) {
                showMessage('Por favor, selecione um arquivo de áudio válido', 'error');
                audioFileInput.value = '';
                audioFileNameSpan.textContent = 'Nenhum arquivo selecionado';
            }
        });
    }

    // Envio do formulário
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleMusicUpload);
    }

    // Busca de músicas
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterSongs, 300));
    }

    // Atualizar lista
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            loadSongs();
            showMessage('Lista atualizada', 'success');
        });
    }

    // Modal de confirmação de exclusão
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            songToDelete = null;
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    // Fechar modal clicando fora
    if (deleteModal) {
        deleteModal.addEventListener('click', function (e) {
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
                songToDelete = null;
            }
        });
    }
}

// Debounce para melhor performance na busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exibir pré-visualização da imagem
function showImagePreview(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            previewPlaceholder.style.display = 'none';
            imagePreview.style.display = 'block';
        };

        reader.onerror = function () {
            showMessage('Erro ao carregar a imagem', 'error');
            hideImagePreview();
        };

        reader.readAsDataURL(file);
    } else if (file) {
        showMessage('Por favor, selecione um arquivo de imagem válido', 'error');
        coverImageInput.value = '';
        coverFileNameSpan.textContent = 'Nenhum arquivo selecionado';
        hideImagePreview();
    }
}

// Ocultar pré-visualização
function hideImagePreview() {
    if (imagePreview) {
        imagePreview.style.display = 'none';
        previewImage.style.display = 'none';
        previewPlaceholder.style.display = 'block';
    }
}

// Upload de música com imagem
async function handleMusicUpload(e) {
    e.preventDefault();

    const formData = new FormData();
    const name = document.getElementById("name").value.trim();
    const audioFile = audioFileInput.files[0];
    const coverImage = coverImageInput.files[0];

    // Validações
    if (!name || !audioFile) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }

    // Adicionar dados básicos ao FormData
    formData.append("name", name);
    formData.append("music", audioFile);

    // Adicionar imagem de capa (se existir)
    if (coverImage) {
        formData.append("cover", coverImage);
    }

    // Mostrar estado de carregamento
    const submitBtn = uploadForm.querySelector('.btn-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Música enviada com sucesso!', 'success');

            // Limpar formulário
            uploadForm.reset();
            audioFileNameSpan.textContent = 'Nenhum arquivo selecionado';
            coverFileNameSpan.textContent = 'Nenhum arquivo selecionado';


            hideImagePreview();

            // Recarregar lista de músicas
            loadSongs();
        } else {
            showMessage(`Erro: ${result.detail || 'Falha no upload'}`, 'error');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        showMessage('Erro de conexão com o servidor', 'error');
    } finally {
        // Restaurar estado do botão
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Carregar lista de músicas
async function loadSongs() {
    try {
        if (songsList) {
            songsList.innerHTML = '<p class="loading">Carregando músicas...</p>';
        }

        const response = await fetch(`${SERVER_URL}/api/music`);

        if (response.ok) {
            songs = await response.json();
            renderSongs(songs);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao carregar músicas:', error);
        if (songsList) {
            songsList.innerHTML = '<p class="error">Erro ao carregar músicas. Tente novamente.</p>';
        }
    }
}

// Renderizar músicas na lista
function renderSongs(songsToRender) {
    if (!songsList) return;

    if (songsToRender.length === 0) {
        songsList.innerHTML = '<p class="loading">Nenhuma música encontrada</p>';
        return;
    }

    songsList.innerHTML = '';

    songsToRender.forEach(song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';

        // Garantir valores padrão
        const safeName = song.nome || 'Título desconhecido';
        const safeImageUrl = song.capa || '/static/assets/default-album.png';
        songCard.innerHTML = `
            <img src="${safeImageUrl}" alt="Capa do álbum" class="song-image" 
                 onerror="this.src=\'/static/assets/default-album.png\'\">
            <div class="song-info">
                <div class="song-title">${safeName}</div>
            </div>
            <button class="btn-delete" data-id="${song.id}">Excluir</button>
        `;
        songsList.appendChild(songCard);    });

    // Adicionar event listeners aos botões de exclusão
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
            const songId = this.getAttribute('data-id');
            openDeleteModal(songId);
        });
    });
}

// Filtrar músicas
function filterSongs() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm) {
        const filteredSongs = songs.filter(song =>
            (song.nome && song.nome.toLowerCase().includes(searchTerm))
        );
        renderSongs(filteredSongs);
    } else {
        renderSongs(songs);
    }
}

// Abrir modal de confirmação de exclusão
function openDeleteModal(songId) {
    songToDelete = songId;
    if (deleteModal) {
        deleteModal.style.display = 'flex';
    }
}

// Confirmar exclusão
async function confirmDelete() {
    if (!songToDelete) return;

    // Mostrar estado de carregamento no modal
    const originalText = confirmDeleteBtn.textContent;
    confirmDeleteBtn.textContent = 'Excluindo...';
    confirmDeleteBtn.disabled = true;

    try {
        const response = await fetch(`${SERVER_URL}/api/music/${songToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Música excluída com sucesso!', 'success');
            if (deleteModal) {
                deleteModal.style.display = 'none';
            }
            songToDelete = null;
            loadSongs(); // Recarregar lista
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao excluir música:', error);
        showMessage('Erro ao excluir música', 'error');
    } finally {
        // Restaurar estado do botão
        confirmDeleteBtn.textContent = originalText;
        confirmDeleteBtn.disabled = false;
    }
}

// Exibir mensagens
function showMessage(text, type) {
    if (!messageDiv) return;

    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;

    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 4000);
}

