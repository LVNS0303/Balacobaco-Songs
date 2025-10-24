// Cole este código substituindo todo o conteúdo do mais_tocadas.js

document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("lista-mais-tocadas");
    const DEFAULT_COVER = "/static/assets/default-album.png"; // Caminho para sua imagem padrão
    const LOCAL_STORAGE_KEY = "mais_tocadas"; // Chave definida no app.js

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) {
            lista.innerHTML = "<li>Nenhuma música tocada ainda 🎶</li>";
            return;
        }

        const maisTocadas = JSON.parse(stored);

        // Converter o objeto de contagem em um array de músicas
        const songs = Object.values(maisTocadas)
            .sort((a, b) => b.contagem - a.contagem); // Ordenar por mais tocadas

        if (songs.length === 0) {
            lista.innerHTML = "<li>Nenhuma música tocada ainda 🎶</li>";
            return;
        }

        lista.innerHTML = ''; // Limpa a lista

        songs.forEach((song, index) => {
            const li = document.createElement("li");
            li.classList.add("song-item");

            // Usar os dados salvos pelo app.js
            const imageUrl = song.capa || DEFAULT_COVER;
            const title = song.nome || "Música desconhecida";
            const playCount = song.contagem || 0;

            li.innerHTML = `
                <div class="song-rank">${index + 1}</div>
                <img src="${imageUrl}" alt="Capa de ${title}" class="song-cover" onerror="this.src='${DEFAULT_COVER}'">
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
