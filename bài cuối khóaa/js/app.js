/* ============================================
   Rạp Phim Vui — Unified Application Logic
   ============================================ */

const API_KEY = '7bb2581e1c705a9838b0d65edad56616';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

// ============================================
// Utility Functions
// ============================================

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s, transform 0.4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function getCurrentPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('movie')) return 'movie';
  if (path.includes('login')) return 'login';
  if (path.includes('register')) return 'register';
  return 'index';
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id'),
    type: params.get('type') || 'movie'
  };
}

// Navigate to dedicated movie page
function goToMovie(id, type = 'movie') {
  window.location.href = `movie.html?id=${id}&type=${type}`;
}

// ============================================
// Auth Logic (shared across all pages)
// ============================================

function getLoggedInUser() {
  return localStorage.getItem('user');
}

function isLoggedIn() {
  return !!getLoggedInUser();
}

function logoutUser() {
  localStorage.removeItem('user');
  updateAuthUI();
  showToast('Đã đăng xuất thành công!');
}

function updateAuthUI() {
  const authSection = document.getElementById('authSection');
  if (!authSection) return;

  const user = getLoggedInUser();

  if (user) {
    authSection.innerHTML = `
      <div class="user-info">
        <span>Chào, <b>${user}</b></span>
        <button class="logout-btn" onclick="logoutUser()" title="Đăng xuất">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>`;
  } else {
    authSection.innerHTML = `
      <a href="login.html" class="btn btn-primary btn-sm">Đăng Nhập</a>`;
  }
}

// Expose to global scope for onclick handlers
window.logoutUser = logoutUser;
window.goToMovie = goToMovie;

// ============================================
// Index Page — Movie Browser
// ============================================

function initIndexPage() {
  loadTrendingMovies();
  updateAuthUI();
  setupSearch();
}

// --- Skeleton loader ---
function showSkeletons(count = 12) {
  const grid = document.getElementById('movieGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () =>
    `<div class="movie-card skeleton-card skeleton"></div>`
  ).join('');
}

// --- Load trending movies ---
async function loadTrendingMovies() {
  showSkeletons();
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=vi-VN`);
    const data = await res.json();
    const movies = data.results.filter(m => m.poster_path);

    renderMovies(movies);
    renderHero(movies[0]);

    const title = document.getElementById('sectionTitle');
    if (title) title.textContent = 'Phim phổ biến';
  } catch (err) {
    console.error('Lỗi tải phim:', err);
    showToast('Không thể tải danh sách phim', 'error');
  }
}

// --- Render hero banner ---
function renderHero(movie) {
  const hero = document.getElementById('heroSection');
  if (!hero || !movie) return;

  hero.innerHTML = `
    <div class="hero-bg" style="background-image: url('${IMG_URL}${movie.backdrop_path}')"></div>
    <div class="hero-content">
      <h1>${movie.title || movie.name}</h1>
      <p>${movie.overview || ''}</p>
      <button class="btn btn-primary" onclick="goToMovie(${movie.id}, 'movie')">
        <i class="fas fa-play"></i> Xem ngay
      </button>
    </div>`;
}

// --- Render movie grid ---
function renderMovies(movies) {
  const grid = document.getElementById('movieGrid');
  if (!grid) return;

  grid.innerHTML = movies.map(m => {
    const title = m.title || m.name || 'Không có tiêu đề';
    const type = m.media_type || 'movie';
    const rating = m.vote_average ? m.vote_average.toFixed(1) : '';
    const poster = m.poster_path ? `${IMG_W500}${m.poster_path}` : '';

    if (!poster) return '';

    return `
      <a href="movie.html?id=${m.id}&type=${type}" class="movie-card">
        <img src="${poster}" alt="${title}" loading="lazy">
        ${rating ? `<div class="movie-card-rating"><i class="fas fa-star"></i> ${rating}</div>` : ''}
        <div class="movie-card-overlay">
          <span class="movie-card-title">${title}</span>
        </div>
      </a>`;
  }).join('');
}

// --- Search ---
function setupSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
}

async function performSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  // If on movie page, redirect to index with search
  if (getCurrentPage() === 'movie') {
    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    return;
  }

  showSkeletons();
  const title = document.getElementById('sectionTitle');
  if (title) title.textContent = `Kết quả: "${query}"`;

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=vi-VN&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results = (data.results || []).filter(m => m.poster_path && (m.media_type === 'movie' || m.media_type === 'tv'));
    renderMovies(results);

    if (results.length === 0) {
      const grid = document.getElementById('movieGrid');
      if (grid) grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align:center; padding: 40px 0;">Không tìm thấy kết quả cho "${query}"</p>`;
    }
  } catch (err) {
    console.error('Lỗi tìm kiếm:', err);
    showToast('Lỗi khi tìm kiếm', 'error');
  }
}

// Check if index page loaded with search query
function checkSearchParam() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('search');
  if (query) {
    const input = document.getElementById('searchInput');
    if (input) input.value = query;
    // Delay to let page init first
    setTimeout(() => performSearch(), 100);
  }
}

// Expose to global
window.performSearch = performSearch;

// ============================================
// Movie Page — Dedicated Movie Viewer
// ============================================

async function initMoviePage() {
  updateAuthUI();
  setupSearch();

  const { id, type } = getQueryParams();

  if (!id) {
    showToast('Không tìm thấy phim', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  try {
    // Fetch movie details
    const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=vi-VN`);
    const movie = await res.json();

    if (movie.success === false) {
      showToast('Phim không tồn tại', 'error');
      setTimeout(() => window.location.href = 'index.html', 1000);
      return;
    }

    // Update page title
    const movieTitle = movie.title || movie.name || 'Xem phim';
    document.title = `${movieTitle} — Rạp Phim Vui`;

    // Render sections
    renderMovieBackdrop(movie);
    renderMovieInfo(movie);
    setupPlayer(type, id);
    setupLightsToggle();

    // Load similar movies
    loadSimilarMovies(type, id);

  } catch (err) {
    console.error('Lỗi tải phim:', err);
    showToast('Không thể tải thông tin phim', 'error');
  }
}

// --- Render backdrop ---
function renderMovieBackdrop(movie) {
  const backdrop = document.getElementById('movieBackdrop');
  if (!backdrop) return;

  const bgImage = movie.backdrop_path
    ? `${IMG_URL}${movie.backdrop_path}`
    : (movie.poster_path ? `${IMG_URL}${movie.poster_path}` : '');

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const genres = (movie.genres || []).map(g => g.name).join(', ');

  backdrop.innerHTML = `
    <div class="movie-backdrop-bg" style="background-image: url('${bgImage}')"></div>
    <div class="movie-backdrop-content">
      <h1 class="movie-backdrop-title">${title}</h1>
      <div class="movie-backdrop-meta">
        <span class="meta-badge meta-rating"><i class="fas fa-star"></i> ${rating}</span>
        ${year ? `<span class="meta-badge"><i class="fas fa-calendar-alt"></i> ${year}</span>` : ''}
        ${movie.runtime ? `<span class="meta-badge"><i class="fas fa-clock"></i> ${movie.runtime} phút</span>` : ''}
        ${genres ? `<span class="meta-badge"><i class="fas fa-tags"></i> ${genres}</span>` : ''}
      </div>
    </div>`;
}

// --- Render movie info card ---
function renderMovieInfo(movie) {
  const infoDiv = document.getElementById('movieInfo');
  if (!infoDiv) return;

  const title = movie.title || movie.name;
  const overview = movie.overview || 'Chưa có mô tả cho phim này.';
  const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const voteCount = movie.vote_count ? movie.vote_count.toLocaleString() : '0';
  const runtime = movie.runtime ? `${movie.runtime} phút` : '';
  const genres = (movie.genres || []).map(g =>
    `<span class="genre-tag">${g.name}</span>`
  ).join('');
  const poster = movie.poster_path ? `${IMG_W500}${movie.poster_path}` : '';
  const language = movie.original_language ? movie.original_language.toUpperCase() : '';
  const status = movie.status || '';

  infoDiv.innerHTML = `
    <div class="movie-detail-inner">
      ${poster ? `<div class="movie-detail-poster"><img src="${poster}" alt="${title}"></div>` : ''}
      <div class="movie-detail-text">
        <h2 class="movie-detail-title">${title}</h2>
        <div class="movie-detail-meta">
          <span class="rating-badge"><i class="fas fa-star"></i> ${rating}</span>
          <span class="vote-count">(${voteCount} đánh giá)</span>
          ${year ? `<span><i class="fas fa-calendar-alt"></i> ${year}</span>` : ''}
          ${runtime ? `<span><i class="fas fa-clock"></i> ${runtime}</span>` : ''}
          ${language ? `<span><i class="fas fa-globe"></i> ${language}</span>` : ''}
        </div>
        ${genres ? `<div class="movie-detail-genres">${genres}</div>` : ''}
        <div class="movie-detail-overview">
          <h3>Nội dung phim</h3>
          <p>${overview}</p>
        </div>
        ${movie.tagline ? `<div class="movie-tagline"><i class="fas fa-quote-left"></i> ${movie.tagline}</div>` : ''}
        <div class="movie-detail-extra">
          ${status ? `<div class="extra-item"><strong>Trạng thái:</strong> ${status}</div>` : ''}
          ${movie.production_companies && movie.production_companies.length > 0
            ? `<div class="extra-item"><strong>Sản xuất:</strong> ${movie.production_companies.map(c => c.name).join(', ')}</div>`
            : ''}
        </div>
      </div>
    </div>`;
}

// --- Setup player ---
function setupPlayer(type, id) {
  const playBtn = document.getElementById('playBtn');
  const iframe = document.getElementById('videoIframe');
  const placeholder = document.getElementById('playerPlaceholder');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (!iframe) return;

      iframe.src = `https://vidsrc.xyz/embed/${type}/${id}`;
      iframe.sandbox = 'allow-scripts allow-same-origin allow-popups';
      iframe.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';

      playBtn.innerHTML = '<i class="fas fa-redo"></i> TẢI LẠI';
      playBtn.classList.add('playing');

      // Scroll to player
      const playerWrapper = document.getElementById('playerWrapper');
      if (playerWrapper) {
        playerWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// --- Lights toggle ---
function setupLightsToggle() {
  const toggle = document.getElementById('lightToggle');
  const overlay = document.getElementById('lightsOverlay');

  if (toggle && overlay) {
    let lightsOff = false;

    toggle.addEventListener('click', () => {
      lightsOff = !lightsOff;

      if (lightsOff) {
        overlay.classList.add('active');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
        toggle.title = 'Bật đèn';
      } else {
        overlay.classList.remove('active');
        toggle.innerHTML = '<i class="fas fa-lightbulb"></i>';
        toggle.title = 'Tắt đèn';
      }
    });
  }
}

// --- Load similar movies ---
async function loadSimilarMovies(type, id) {
  const container = document.getElementById('similarMovies');
  if (!container) return;

  try {
    const res = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}&language=vi-VN`);
    const data = await res.json();
    const movies = (data.results || []).filter(m => m.poster_path).slice(0, 8);

    if (movies.length === 0) {
      container.innerHTML = `<p class="no-similar">Không có phim liên quan.</p>`;
      return;
    }

    container.innerHTML = movies.map(m => {
      const title = m.title || m.name || 'Không có tiêu đề';
      const mType = m.media_type || type;
      const rating = m.vote_average ? m.vote_average.toFixed(1) : '';
      const poster = `${IMG_W500}${m.poster_path}`;
      const year = (m.release_date || m.first_air_date || '').split('-')[0];

      return `
        <a href="movie.html?id=${m.id}&type=${mType}" class="similar-card">
          <img src="${poster}" alt="${title}" loading="lazy">
          <div class="similar-card-info">
            <span class="similar-card-title">${title}</span>
            <div class="similar-card-meta">
              ${rating ? `<span class="similar-rating"><i class="fas fa-star"></i> ${rating}</span>` : ''}
              ${year ? `<span>${year}</span>` : ''}
            </div>
          </div>
        </a>`;
    }).join('');
  } catch (err) {
    console.error('Lỗi tải phim liên quan:', err);
    container.innerHTML = `<p class="no-similar">Không thể tải phim liên quan.</p>`;
  }
}

// ============================================
// Login Page
// ============================================

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    if (!userInput || !passInput) return;

    const user = userInput.value.trim();
    const pass = passInput.value;

    if (!user || !pass) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    const savedAccount = JSON.parse(localStorage.getItem('account'));

    if (savedAccount && user === savedAccount.username && pass === savedAccount.password) {
      localStorage.setItem('user', user);
      showToast('Đăng nhập thành công!');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } else {
      showToast('Sai tài khoản hoặc mật khẩu!', 'error');
    }
  });
}

// ============================================
// Register Page
// ============================================

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    if (!userInput || !passInput) return;

    const user = userInput.value.trim();
    const pass = passInput.value;

    if (!user || !pass) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    if (pass.length < 4) {
      showToast('Mật khẩu phải có ít nhất 4 ký tự', 'error');
      return;
    }

    const account = { username: user, password: pass };
    localStorage.setItem('account', JSON.stringify(account));

    showToast('Đăng ký thành công! Đang chuyển hướng...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  });
}

// ============================================
// Page Router — Auto-init based on current page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const page = getCurrentPage();

  switch (page) {
    case 'movie':
      initMoviePage();
      break;
    case 'login':
      initLoginPage();
      break;
    case 'register':
      initRegisterPage();
      break;
    default:
      initIndexPage();
      checkSearchParam();
      break;
  }
});
