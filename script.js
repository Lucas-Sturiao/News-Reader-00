//const API_KEY = "13fab6a566a9b447b2672b88c753db56"; // está comentado porque a requisição é limitada.
//const BASE_URL = `https://gnews.io/api/v4/top-headlines?lang=pt&country=br&apikey=${API_KEY}`;

const newsContainer = document.getElementById("newsContainer");
const categoryLinks = document.querySelectorAll(".category-link");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const themeToggle = document.getElementById("themeToggle");
const showFavoritesBtn = document.getElementById("showFavorites");

let darkMode = false;
let showingFavorites = false;

// Carrega favoritos salvos no navegador
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// ====== Função principal: buscar e exibir notícias ======
async function fetchNews(url) {
  showingFavorites = false;
  newsContainer.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div></div>`;

  // Mostra as últimas notícias se estiver offline
  if (!navigator.online) {
    const cachedNews = JSON.parse(localStorage.getItem("lastNews")) || [];
    if (cachedNews.length > 0) {
      newsContainer.innerHTML = `<p class="text-center text-warning mt-3">📴 Sem conexão - exibindo as últimas notícias salvas.</p>`;
      renderNews(cachedNews);
    } else {
      newsContainer.innerHTML = `<p class="text-center mt-5 texte-danger">Sem conexão e nenhum conteúdo salvo.</p>`;
      return;
    }
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.articles || data.articles.length === 0) {
      newsContainer.innerHTML = `<p class="text-center mt-5">Nenhuma notícia encontrada.</p>`;
      return;
    }

    renderNews(data.articles);

    // Salva localmente as últimas notícias
    localStorage.setItem("lastNews", JSON.stringify(data.articles));

  } catch (error) {
    console.error("Erro ao carregar notícias:", error);
    newsContainer.innerHTML = `<p class="text-center mt-5 text-danger">Erro ao carregar notícias.</p>`;
  }
}

// ====== Renderiza lista de notícias (ou favoritos) ======
function renderNews(articles) {
  newsContainer.innerHTML = articles
    .map(
      (article, index) => `
      <div class="col-md-4" style="animation-delay:${index * 0.1}s">
        <div class="card h-100 shadow-sm ${darkMode ? 'bg-dark text-white' : ''}">
          <img src="${article.image || 'https://via.placeholder.com/400x250'}" class="card-img-top" alt="Imagem da notícia">
          <div class="card-body">
            <h5 class="card-title">${article.title}</h5>
            <p class="card-text">${article.description || ''}</p>
            <div class="d-flex justify-content-between">
              <a href="${article.url}" target="_blank" class="btn btn-${darkMode ? 'light' : 'primary'} btn-sm">Ler mais</a>
              <button class="btn btn-${isFavorite(article) ? 'warning' : 'outline-warning'} btn-sm" onclick='toggleFavorite(${JSON.stringify(article).replace(/'/g, "\\'")})'>
                ${isFavorite(article) ? "★" : "☆"}
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

// ====== Verifica se a notícia já está salva ======
function isFavorite(article) {
  return favorites.some((fav) => fav.url === article.url);
}

// ====== Adiciona ou remove dos favoritos ======
function toggleFavorite(article) {
  const exists = favorites.some((fav) => fav.url === article.url);

  if (exists) {
    favorites = favorites.filter((fav) => fav.url !== article.url);
  } else {
    favorites.push(article);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  if (showingFavorites) renderFavorites();
  else document.querySelector(".category-link.active")?.click();
}

// ====== Exibe favoritos salvos ======
function renderFavorites() {
  showingFavorites = true;

  if (favorites.length === 0) {
    newsContainer.innerHTML = `<p class="text-center mt-5">Você ainda não salvou nenhuma notícia.</p>`;
    return;
  }

  renderNews(favorites);
}

// ====== Filtros por categoria ======
categoryLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    categoryLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");

    const category = link.getAttribute("data-category");
    fetchNews(`${BASE_URL}&topic=${category}`);
  });
});

// ====== Busca por palavra-chave ======
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) {
    fetchNews(`https://gnews.io/api/v4/search?q=${query}&lang=pt&country=br&apikey=${API_KEY}`);
  } else {
    fetchNews(BASE_URL);
  }
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// ====== Alternar tema claro/escuro ======
themeToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  document.body.classList.toggle("bg-dark");
  document.body.classList.toggle("text-white");

  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => card.classList.toggle("bg-dark"));
  cards.forEach((card) => card.classList.toggle("text-white"));

  themeToggle.textContent = darkMode ? "☀️" : "🌙";
});

// ====== Mostrar favoritos ======
showFavoritesBtn.addEventListener("click", (e) => {
  e.preventDefault();
  categoryLinks.forEach((l) => l.classList.remove("active"));
  renderFavorites();
});

// ====== Carregar notícias iniciais ======
fetchNews(BASE_URL);

// ====== Detectar mudanças de conexão ======
window.addEventListener("offline", () => {
  const alertBox = document.createElement("div");
  alertBox.className = "alert alert-warning text-center m-0";
  alertBox.textContent = "📴 Você está offline — exibindo últimas notícias salvas.";
  document.body.prepend(alertBox);

  const cachedNews = JSON.parse(localStorage.getItem("lastNews")) || [];
  if (cachedNews.length > 0) renderNews(cachedNews);
});

window.addEventListener("online", () => {
  document.querySelector(".alert")?.remove();
  fetchNews(BASE_URL);
});