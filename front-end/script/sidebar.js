/**
 * Controle do Menu Lateral de Navegação
 * SpotiFácil - Sistema de navegação entre páginas
 */

class SidebarManager {
    constructor() {
        this.sidebar = null;
        this.toggle = null;
        this.overlay = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.createSidebar();
        this.bindEvents();
        this.setActivePage();
    }

    createSidebar() {
        // Criar estrutura do menu lateral
        const sidebarHTML = `
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <h2 class="sidebar-title">SpotiFácil</h2>
                    <p class="sidebar-subtitle">Sistema de Música</p>
                </div>
                
                <nav class="sidebar-nav">
                    <a href="/" class="nav-item" data-page="index">
                        <div class="nav-icon">🏠</div>
                        <div>
                            <div class="nav-text">Início</div>
                            <div class="nav-description">Página principal</div>
                        </div>
                    </a>

                    <a href="/upload" class="nav-item" data-page="upload">
                        <div class="nav-icon">📤</div>
                        <div>
                            <div class="nav-text">Upload</div>
                            <div class="nav-description">Enviar novas músicas</div>
                        </div>
                    </a>

                    <a href="/historico" class="nav-item" data-page="historico">
                        <div class="nav-icon">📜</div>
                        <div>
                            <div class="nav-text">Histórico</div>
                            <div class="nav-description">Músicas já tocadas</div>
                        </div>
                    </a>

                    <a href="/mais_tocadas" class="nav-item" data-page="mais_tocadas">
                        <div class="nav-icon">🔥</div>
                        <div>
                            <div class="nav-text">Mais tocadas</div>
                            <div class="nav-description">Músicas populares</div>
                        </div>
                    </a>
                </nav>
                
                <div class="sidebar-footer">
                    <p class="sidebar-footer-text">Desenvolvido por Balacobaco</p>
                </div>
            </div>
            
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            
            <button class="sidebar-toggle" id="sidebarToggle">
                <span id="toggleIcon">☰</span>
            </button>
        `;

        // Inserir no body
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

        // Obter referências dos elementos
        this.sidebar = document.getElementById('sidebar');
        this.toggle = document.getElementById('sidebarToggle');
        this.overlay = document.getElementById('sidebarOverlay');
        this.toggleIcon = document.getElementById('toggleIcon');
    }

    bindEvents() {
        // Toggle do menu
        this.toggle.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Fechar com overlay
        this.overlay.addEventListener('click', () => {
            this.closeSidebar();
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });

        // Navegação dos itens
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                setTimeout(() => {
                    this.closeSidebar();
                }, 150);
            });
        });

        // Fechar ao redimensionar (mobile)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeSidebar();
            }
        });
    }

    toggleSidebar() {
        this.isOpen ? this.closeSidebar() : this.openSidebar();
    }

    openSidebar() {
        this.sidebar.classList.add('open');
        this.toggle.classList.add('open');
        this.overlay.classList.add('show');
        this.toggleIcon.textContent = '✕';
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.toggle.classList.remove('open');
        this.overlay.classList.remove('show');
        this.toggleIcon.textContent = '☰';
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    setActivePage() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => item.classList.remove('active'));

        let activePage = "index"; // padrão
        if (currentPath.includes("upload")) activePage = "upload";
        else if (currentPath.includes("historico")) activePage = "historico";
        else if (currentPath.includes("mais_tocadas")) activePage = "mais_tocadas";

        const activeItem = document.querySelector(`[data-page="${activePage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    updateActivePage(page) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.sidebarManager = new SidebarManager();
});

window.toggleSidebar = function () {
    if (window.sidebarManager) {
        window.sidebarManager.toggleSidebar();
    }
};

window.setSidebarActivePage = function (page) {
    if (window.sidebarManager) {
        window.sidebarManager.updateActivePage(page);
    }
};
