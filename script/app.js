// app.js (versão completa e corrigida)
(() => {
  'use strict';

  // --- Configurações e elementos ---
  const elementoStatus = document.getElementById('status');
  const songsGridEl = document.getElementById('songsGrid');
  const audioEl = document.getElementById('audio');

  // Elementos do player
  const mainPlayer = document.getElementById('mainPlayer');
  const albumArt = document.getElementById('albumArt');
  const currentTitle = document.getElementById('currentTitle');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const progressTrack = document.getElementById('progressTrack');
  const progressFill = document.getElementById('progressFill');
  const progressHandle = document.getElementById('progressHandle');

  // Elementos de conexão
  const serverUrlInput = document.getElementById('serverUrl');
  const connectBtn = document.getElementById('connectBtn');

  // Elementos de pesquisa
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');

  // --- Estado da aplicação ---
  let musicasCarregadas = [];
  let musicaAtualIndex = -1;
  // --- CORREÇÃO 1: baseUrl deve começar vazia ---
  let baseUrl = ''; 
  let isDragging = false;
  let lastProcessedSongId = null;

  // --- Constantes para localStorage ---
  const LOCAL_STORAGE_KEYS = {
    HISTORICO: 'spotify_facil_history',
    MAIS_TOCADAS: 'mais_tocadas',
    SERVER_URL: 'serverUrl'
  };

  // --- Debug: Verificar elementos ---
  console.log('🔍 Elementos carregados:');
  console.log('- mainPlayer:', mainPlayer);
  console.log('- songsGridEl:', songsGridEl);
  console.log('- audioEl:', audioEl);

  // --- Utilitários ---
  function definirStatus(mensagem, isError = false) {
    if (!elementoStatus) return;
    elementoStatus.textContent = mensagem || '';
    elementoStatus.style.color = isError ? '#ff4444' : '#b388ff';
    if (!isError && mensagem) {
      setTimeout(() => {
        if (elementoStatus.textContent === mensagem) {
          elementoStatus.textContent = '';
        }
      }, 3000);
    }
  }

  function juntarUrl(base, relativo) {
    if (!base) return relativo;
    // Esta função remove a / do final da base e a / do início do relativo para evitar barras duplas
    return base.replace(/\/+$/, '') + '/' + (relativo || '').replace(/^\/+/, '');
  }

  function formatarTempo(segundos) {
    if (!segundos || isNaN(segundos)) return '0:00';
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // --- CORREÇÃO 2: Lógica de getImageUrl corrigida ---
  function getImageUrl(img) {
    const defaultCover = '/static/assets/default-album.png';
    let imagePath = img || defaultCover;

    // Se já for uma URL completa (http ou data), retorne-a.
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // Se o caminho for relativo (ex: /static/...) E a baseUrl (da API) estiver definida,
    // junte a URL da API com o caminho da imagem.
    if (baseUrl) {
        return juntarUrl(baseUrl, imagePath);
    }
    
    // Caso contrário (antes de conectar), apenas retorne o caminho relativo.
    // O navegador vai tentar buscar localmente (e falhar), o que é normal.
    return imagePath;
  }

  // --- FUNÇÃO: Mostrar/Ocultar Player ---
  function mostrarPlayer() {
    console.log('🎵 Mostrando player...');
    if (mainPlayer) {
      mainPlayer.classList.remove('hidden');
      console.log('✅ Player mostrado');
    } else {
      console.error('❌ Elemento mainPlayer não encontrado');
    }
  }

  function ocultarPlayer() {
    console.log('🎵 Ocultando player...');
    if (mainPlayer) {
      mainPlayer.classList.add('hidden');
      if (audioEl) {
        audioEl.pause();
        atualizarIconePlayPause(false);
      }
      console.log('✅ Player ocultado');
    }
  }

  // --- FUNÇÃO: Salvar no histórico ---
  function salvarNoHistorico(musica) {
    try {
      if (!musica || !musica.id) {
        console.warn('salvarNoHistorico: música inválida', musica);
        return;
      }

      if (lastProcessedSongId === musica.id) {
        return;
      }

      lastProcessedSongId = musica.id;

      let historico = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORICO)) || [];

      const novaEntrada = {
        id: musica.id,
        nome: musica.nome || '(Sem título)',
        // Salva o caminho relativo da capa
        capa: musica.capa || '/static/assets/default-album.png', 
        playedAt: new Date().toISOString()
      };

      const historicoFiltrado = historico.filter(entry => entry.id !== musica.id);
      historicoFiltrado.unshift(novaEntrada);

      const historicoLimitado = historicoFiltrado.slice(0, 200);

      localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORICO, JSON.stringify(historicoLimitado));

    } catch (error) {
      console.error('❌ Erro ao salvar no histórico:', error);
    }
  }

  // --- FUNÇÃO: Registrar mais tocadas ---
  function registrarMaisTocadas(musica) {
    try {
      if (!musica || !musica.id) return;

      let maisTocadas = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MAIS_TOCADAS)) || {};

      if (!maisTocadas[musica.id]) {
        maisTocadas[musica.id] = {
          id: musica.id,
          nome: musica.nome || '(Sem título)',
          // Salva o caminho relativo da capa
          capa: musica.capa || '/static/assets/default-album.png',
          contagem: 0,
          ultimoToque: new Date().toISOString()
        };
      }

      maisTocadas[musica.id].contagem++;
      maisTocadas[musica.id].ultimoToque = new Date().toISOString();

      localStorage.setItem(LOCAL_STORAGE_KEYS.MAIS_TOCADAS, JSON.stringify(maisTocadas));

    } catch (error) {
      console.error('❌ Erro ao registrar mais tocadas:', error);
    }
  }

  // --- FUNÇÃO: Forçar registro no histórico ---
  function forcarRegistroHistorico(musica) {
    if (!musica) return;
    salvarNoHistorico(musica);
    registrarMaisTocadas(musica);
  }

  // --- Sistema de Pesquisa ---
  function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const termo = e.target.value.trim();
      filtrarMusicas(termo);
      if (clearSearchBtn) {
        clearSearchBtn.style.display = termo ? 'block' : 'none';
      }
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filtrarMusicas('');
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
      });
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        filtrarMusicas('');
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      }
    });
  }

  function filtrarMusicas(termo) {
    if (!songsGridEl) return;
    const termoLower = (termo || '').toLowerCase();
    const todosOsItens = songsGridEl.querySelectorAll('.song-card');

    todosOsItens.forEach(item => {
      const titulo = item.querySelector('.song-title')?.textContent || '';
      const corresponde = titulo.toLowerCase().includes(termoLower);

      if (termo) {
        item.style.display = corresponde ? 'block' : 'none';
      } else {
        item.style.display = 'block';
      }
    });
  }

  // --- Comunicação com API ---
  async function buscarJSON(url) {
    if (!baseUrl) throw new Error('Servidor não definido (defina IP:porta e clique em Conectar).');
    const urlCompleta = juntarUrl(baseUrl, url);
    console.log('🌐 Buscando:', urlCompleta);
    const res = await fetch(urlCompleta);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // --- Gerenciamento de Player ---
  function atualizarIconePlayPause(tocando) {
    if (!playIcon || !pauseIcon) return;
    playIcon.style.display = tocando ? 'none' : 'block';
    pauseIcon.style.display = tocando ? 'block' : 'none';
  }

  function atualizarProgresso() {
    if (isDragging || !audioEl) return;
    const currentTime = audioEl.currentTime || 0;
    const duration = audioEl.duration || 0;
    if (currentTimeEl) currentTimeEl.textContent = formatarTempo(currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatarTempo(duration);
    if (duration > 0 && progressFill) {
      const pct = (currentTime / duration) * 100;
      progressFill.style.width = `${pct}%`;
      if (progressHandle) progressHandle.style.left = `${pct}%`;
    }
  }

  function definirProgresso(pct) {
    if (!audioEl || isNaN(pct)) return;
    const duration = audioEl.duration || 0;
    if (duration > 0) audioEl.currentTime = (pct / 100) * duration;
  }

  function carregarImagemMusica(musica) {
    if (!albumArt) return;
    try {
      // getImageUrl agora montará a URL completa
      const imgUrl = getImageUrl(musica.capa);
      albumArt.src = imgUrl;
    } catch (err) {
      console.error('Erro ao carregar imagem da música:', err);
      albumArt.src = getImageUrl(null);
    }
  }

  function tocarMusica(index) {
    if (index < 0 || index >= musicasCarregadas.length) return;

    musicaAtualIndex = index;
    const musica = musicasCarregadas[index];

    if (!audioEl || !currentTitle) return;

    // --- CORREÇÃO 3: Usar juntarUrl para o áudio ---
    const audioSrc = juntarUrl(baseUrl, musica.musica);
    audioEl.src = audioSrc;
    currentTitle.textContent = musica.nome;

    carregarImagemMusica(musica);
    mostrarPlayer();

    audioEl.play().then(() => {
      atualizarIconePlayPause(true);
      forcarRegistroHistorico(musica);
    }).catch(err => {
      console.error('Erro ao tocar música:', err);
      definirStatus(`Erro ao tocar: ${err.message}`, true);
      atualizarIconePlayPause(false);
    });
  }

  function setupPlayerControls() {
    if (!playPauseBtn || !prevBtn || !nextBtn || !audioEl) return;

    playPauseBtn.addEventListener('click', () => {
      if (audioEl.paused) {
        audioEl.play().then(() => atualizarIconePlayPause(true));
      } else {
        audioEl.pause();
        atualizarIconePlayPause(false);
      }
    });

    prevBtn.addEventListener('click', () => {
      const novoIndex = (musicaAtualIndex - 1 + musicasCarregadas.length) % musicasCarregadas.length;
      tocarMusica(novoIndex);
    });

    nextBtn.addEventListener('click', () => {
      const novoIndex = (musicaAtualIndex + 1) % musicasCarregadas.length;
      tocarMusica(novoIndex);
    });

    audioEl.addEventListener('timeupdate', atualizarProgresso);
    audioEl.addEventListener('ended', () => {
      nextBtn.click();
    });
    audioEl.addEventListener('pause', () => atualizarIconePlayPause(false));
    audioEl.addEventListener('play', () => atualizarIconePlayPause(true));

    // --- Controles da barra de progresso ---
    if (progressTrack) {
      const progressoClickHandler = (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        definirProgresso(pct);
      };

      progressTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        progressoClickHandler(e);
      });

      document.addEventListener('mousemove', (e) => {
        if (isDragging) progressoClickHandler(e);
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    }
  }

  // --- Renderização ---
  function renderizarMusicas(musicas) {
    if (!songsGridEl) return;
    songsGridEl.innerHTML = '';

    if (!musicas || musicas.length === 0) {
      songsGridEl.innerHTML = '<p class="empty-state">Nenhuma música encontrada.</p>';
      return;
    }

    musicas.forEach((song, index) => {
      const safeName = song.nome || '(Sem título)';
      // getImageUrl agora vai montar a URL completa
      const imageUrl = getImageUrl(song.capa); 

      const card = document.createElement('div');
      card.className = 'song-card';
      card.setAttribute('data-index', index);

      card.innerHTML = `
        <div class="album-art-container">
          <img src="${imageUrl}" alt="Capa de ${safeName}" class="album-art" loading="lazy">
          <div class="play-overlay"><i class="fas fa-play"></i></div>
        </div>
        <div class="song-info">
          <div class="song-title">${safeName}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        tocarMusica(index);
      });

      songsGridEl.appendChild(card);
    });
  }

  // --- Carregamento Inicial ---
  async function carregarMusicas() {
    definirStatus('Carregando músicas...');
    try {
      const data = await buscarJSON('/api/music');
      musicasCarregadas = data || [];
      renderizarMusicas(musicasCarregadas);
      definirStatus(musicasCarregadas.length > 0 ? `${musicasCarregadas.length} músicas carregadas.` : 'Nenhuma música no servidor.');
    } catch (err) {
      console.error('Falha ao carregar músicas:', err);
      definirStatus(`Erro ao conectar: ${err.message}. Verifique o endereço e a conexão.`, true);
      ocultarPlayer();
    }
  }

  function setupConnection() {
    if (!connectBtn || !serverUrlInput) return;

    const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEYS.SERVER_URL);
    if (savedUrl) {
      serverUrlInput.value = savedUrl;
      baseUrl = savedUrl;
      carregarMusicas();
    }

    connectBtn.addEventListener('click', () => {
      const newUrl = serverUrlInput.value.trim();
      if (newUrl) {
        baseUrl = newUrl;
        localStorage.setItem(LOCAL_STORAGE_KEYS.SERVER_URL, newUrl);
        carregarMusicas();
      } else {
        definirStatus('Por favor, insira um endereço de servidor válido.', true);
      }
    });
  }

  // --- Inicialização Geral ---
  function init() {
    console.log('🚀 Spotfácil iniciando...');
    ocultarPlayer();
    setupConnection();
    setupPlayerControls();
    setupSearch();
    // A linha carregarMusicas() foi movida para dentro de setupConnection
    // para garantir que a URL seja carregada do localStorage antes de buscar
  }

  // Inicia a aplicação
  init();

})();
