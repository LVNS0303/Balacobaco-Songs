// mais_tocadas.js (CORRIGIDO)

document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("lista-mais-tocadas");
    
    // --- CORREÇÃO INICIA AQUI ---
    const DEFAULT_COVER_PATH = "/static/assets/default-album.svg";
    const API_URL = localStorage.getItem('serverUrl') || ''; // Pega a URL da API
    
    // Função helper para montar a URL completa
    function getFullImageUrl(relativePath) {
        if (!relativePath) relativePath = DEFAULT_COVER_PATH;
        
        // Se a API_URL não estiver definida (não conectado), usa o caminho relativo
        if (!API_URL) return relativePath; 
        
        const cleanBase = API_URL.replace(/\/+$/, '');
        const cleanRelative = relativePath.replace(/^\/+/, '');
        return `${cleanBase}/${cleanRelative}`;
    }
    
    const FULL_DEFAULT_COVER_URL = getFullImageUrl(DEFAULT_COVER_PATH);
    // --- FIM DA CORREÇÃO ---

    const LOCAL_STORAGE_KEY = "mais_tocadas";

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) {
            lista.innerHTML = "<li>Nenhuma música tocada ainda 🎶</li>";
            return;
        }

        const maisTocadas = JSON.parse(stored);
        
        const songs = Object.values(maisTocadas)
                            .sort((a, b) => b.contagem - a.contagem);

        if (songs.length === 0) {
            lista.innerHTML = "<li>Nenhuma música tocada ainda 🎶</li>";
            return;
        }

        lista.innerHTML = ''; 

        songs.forEach((song, index) => {
            const li = document.createElement("li");
            li.classList.add("song-item");
            
            // --- CORREÇÃO APLICADA AQUI ---
            const imageUrl = getFullImageUrl(song.capa); // Usa a função helper
            const title = song.nome || "Música desconhecida";
            const playCount = song.contagem || 0;

            li.innerHTML = `
                <div class="song-rank">${index + 1}</div>
                <img src="${imageUrl}" alt="Capa de ${title}" class="song-cover" onerror="this.src='${FULL_DEFAULT_COVER_URL}'">
                <div class="song-details">
                    <span class="song-title">${title}</span>
                </div>
                <span class="song-count">${playCount}x</span>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error("Erro ao ler 'mais tocadas' do LocalStorage:", error);
        lista.innerHTML = "<li>Erro ao carregar músicas mais tocadas.</li>";
    }
});
