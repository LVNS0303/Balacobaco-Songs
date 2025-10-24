// floating_player.js (versão completa e corrigida)

(() => {
    'use strict';

    // --- Elementos do Player Flutuante ---
    const floatingPlayer = document.getElementById('floatingPlayer');
    const floatingAlbumArt = document.getElementById('floatingAlbumArt');
    const floatingCurrentTitle = document.getElementById('floatingCurrentTitle');
    const floatingCurrentArtist = document.getElementById('floatingCurrentArtist');
    const floatingPlayPauseBtn = document.getElementById('floatingPlayPauseBtn');
    const floatingPrevBtn = document.getElementById('floatingPrevBtn');
    const floatingNextBtn = document.getElementById('floatingNextBtn');
    const floatingPlayIcon = document.getElementById('floatingPlayIcon');
    const floatingPauseIcon = document.getElementById('floatingPauseIcon');
    const floatingCurrentTimeEl = document.getElementById('floatingCurrentTime');
    const floatingTotalTimeEl = document.getElementById('floatingTotalTime');
    const floatingProgressTrack = document.getElementById('floatingProgressTrack'); // Corrigido de 'floatingProgress'
    const floatingProgressFill = document.getElementById('floatingProgressFill');
    const floatingProgressHandle = document.getElementById('floatingProgressHandle');
    const audioEl = document.getElementById('audio'); // O elemento de áudio principal

    let isDragging = false;
    let currentBaseUrl = ''; // Armazena a URL base recebida do app.js

    // --- Funções Utilitárias ---
    function formatarTempo(segundos) {
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min}:${seg.toString().padStart(2, '0')}`;
    }

    // --- Funções do Player Flutuante ---

    function mostrarFloatingPlayer() {
        if (floatingPlayer) {
            floatingPlayer.classList.remove('hidden');
            floatingPlayer.setAttribute('aria-hidden', 'false');
        }
    }

    function ocultarFloatingPlayer() {
        if (floatingPlayer) {
            floatingPlayer.classList.add('hidden');
            floatingPlayer.setAttribute('aria-hidden', 'true');
        }
    }

    function atualizarIconePlayPauseFloating(tocando) {
        if (floatingPlayIcon) floatingPlayIcon.style.display = tocando ? 'none' : 'inline';
        if (floatingPauseIcon) floatingPauseIcon.style.display = tocando ? 'inline' : 'none';
        if (floatingPlayPauseBtn) floatingPlayPauseBtn.setAttribute('aria-label', tocando ? 'Pausar' : 'Tocar');
    }

    /** Atualiza a barra de progresso e os tempos do player flutuante. */
    function atualizarProgressoFloating() {
        if (!audioEl || isDragging) return;
        const { currentTime, duration } = audioEl;

        if (floatingCurrentTimeEl) floatingCurrentTimeEl.textContent = formatarTempo(currentTime);
        if (floatingTotalTimeEl && !isNaN(duration)) floatingTotalTimeEl.textContent = formatarTempo(duration);

        const percentual = (currentTime / duration) * 100;
        if (floatingProgressFill) floatingProgressFill.style.width = `${percentual}%`;
        if (floatingProgressHandle) floatingProgressHandle.style.left = `calc(${percentual}% - 5px)`;
    }

    /**
     * Função principal para carregar os dados de uma música no player flutuante.
     * Esta função será chamada pelo app.js.
     */
    function carregarMusicaFloating(musica, baseUrl) {
        if (!musica) return;
        currentBaseUrl = baseUrl; // Guarda a URL base para usar na imagem

        if (floatingCurrentTitle) floatingCurrentTitle.textContent = musica.title || '(Sem título)';
        if (floatingCurrentArtist) floatingCurrentArtist.textContent = musica.artist || 'Desconhecido';

        const coverUrl = musica.cover_url ? `${currentBaseUrl}${musica.cover_url}` : '/static/images/default_cover.png';
        if (floatingAlbumArt) {
            floatingAlbumArt.src = coverUrl;
            floatingAlbumArt.alt = `Capa de ${musica.title || 'Desconhecido'}`;
        }

        mostrarFloatingPlayer();
    }

    // --- Event Listeners do Player Flutuante ---

    // Os botões do player flutuante devem se comunicar com as funções globais do app.js
    if (floatingPlayPauseBtn) {
        floatingPlayPauseBtn.addEventListener('click', () => {
            // Delega o controle para o player principal
            if (window.MainPlayer && typeof window.MainPlayer.togglePlayPause === 'function') {
                window.MainPlayer.togglePlayPause();
            }
        });
    }

    if (floatingNextBtn) {
        floatingNextBtn.addEventListener('click', () => {
            if (window.MainPlayer && typeof window.MainPlayer.proximaMusica === 'function') {
                window.MainPlayer.proximaMusica();
            }
        });
    }

    if (floatingPrevBtn) {
        floatingPrevBtn.addEventListener('click', () => {
            if (window.MainPlayer && typeof window.MainPlayer.musicaAnterior === 'function') {
                window.MainPlayer.musicaAnterior();
            }
        });
    }

    // Controle da barra de progresso
    if (floatingProgressTrack) {
        floatingProgressTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = floatingProgressTrack.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            if (window.MainPlayer && typeof window.MainPlayer.definirProgresso === 'function') {
                window.MainPlayer.definirProgresso(pct);
            }
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !floatingProgressTrack) return;
        const rect = floatingProgressTrack.getBoundingClientRect();
        let pct = ((e.clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        if (window.MainPlayer && typeof window.MainPlayer.definirProgresso === 'function') {
            window.MainPlayer.definirProgresso(pct);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Eventos do áudio (escuta o mesmo elemento de áudio do app.js)
    if (audioEl) {
        audioEl.addEventListener('play', () => atualizarIconePlayPauseFloating(true));
        audioEl.addEventListener('pause', () => atualizarIconePlayPauseFloating(false));
        audioEl.addEventListener('timeupdate', atualizarProgressoFloating);
    }

    // --- Interface Global ---
    // Expõe as funções necessárias para serem chamadas pelo app.js
    window.FloatingPlayer = {
        carregarMusica: carregarMusicaFloating,
        mostrar: mostrarFloatingPlayer,
        ocultar: ocultarFloatingPlayer,
    };
})();