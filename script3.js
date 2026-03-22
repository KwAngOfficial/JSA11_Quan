
const API_KEY = '7bb2581e1c705a9838b0d65edad56616';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const GENRE_URL = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=vi-VN`;

// 1. Khởi tạo trang web
async function init() {
    try {
        const res = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=vi-VN`);
        const data = await res.json();
        renderMovies(data.results);
        updateAuthUI();
    } catch (err) { console.error("Lỗi khởi tạo:", err); }
}

// 2. Vẽ danh sách phim
function renderMovies(movies) {
    const grid = document.getElementById('movieGrid');
    grid.innerHTML = movies.map(m => `
        <div class="movie-card" onclick="showDetail(${m.id}, '${m.media_type || 'movie'}')">
            <img src="${IMG_URL + m.poster_path}" alt="">
            <p>${m.title || m.name}</p>
        </div>
    `).join('');
}

// 3. Hiển thị Chi tiết & SỬA LỖI XEM PHIM
async function showDetail(id, type) {
    const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=vi-VN`);
    const movie = await res.json();
    
    const modal = document.getElementById('movieModal');
    const body = document.getElementById('modalBody');

    body.innerHTML = `
        <div id="playerBox" style="display:none; width:100%; aspect-ratio:16/9;">
            <iframe id="videoIframe" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
        </div>
        <div id="infoBox" style="display:flex; gap:30px; margin-top:20px;">
            <img src="${IMG_URL + movie.poster_path}" style="width:250px; border-radius:10px;">
            <div>
                <h1>${movie.title || movie.name}</h1>
                <p style="margin:15px 0; color:#ccc;">${movie.overview}</p>
                <button onclick="playMovie('${type}', ${id})" class="btn-login">XEM NGAY</button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

// Hàm này sửa lỗi "player is not defined"
window.playMovie = function(type, id) {
    const playerBox = document.getElementById('playerBox');
    const infoBox = document.getElementById('infoBox');
    const iframe = document.getElementById('videoIframe');

    if (iframe) {
     iframe.src = `https://vidsrc.xyz/embed/${type}/${id}`;
        playerBox.style.display = 'block';
        infoBox.style.display = 'none';
    }
};

// 4. Xử lý Tìm kiếm
window.searchMovies = async function() {
    const query = document.getElementById('searchInput').value.trim();
    if(!query) return;

    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=vi-VN&query=${query}`);
    const data = await res.json();
    
    document.getElementById('sectionTitle').innerText = `Kết quả: ${query}`;
    renderMovies(data.results);
};

document.getElementById('searchBtn').onclick = searchMovies;

// 5. Đăng nhập
// 5. Điều hướng sang trang đăng nhập riêng
window.login = function() {
    // Thay vì dùng prompt, lệnh này sẽ chuyển bạn sang file login.html
    window.location.href = 'login.html'; 
};

window.logout = function() {
    // Xóa dữ liệu người dùng khi thoát
    localStorage.removeItem('user'); 
    updateAuthUI();
};
function updateAuthUI() {
    const auth = document.getElementById('authSection');
    const user = localStorage.getItem('user'); // Lấy đúng key 'user'
    
    if (!auth) return;

    if (user) {
        // Hiển thị tên nếu có user
        auth.innerHTML = `
            <div class="user-info" style="color:white; display:flex; align-items:center; gap:10px;">
                <span>Chào, <b>${user}</b></span>
                <i class="fas fa-sign-out-alt" onclick="logout()" style="cursor:pointer; color:#aaa;"></i>
            </div>`;
    } else {
        // Hiển thị nút đăng nhập nếu không có user
        auth.innerHTML = `<button class="btn-login" onclick="login()">Đăng Xuất</button>`;
    }
}

// QUAN TRỌNG: Phải có dòng này để chạy hàm khi mở trang
document.addEventListener('DOMContentLoaded', updateAuthUI);
// Luôn chạy hàm này khi trang web vừa tải xong để kiểm tra trạng thái
updateAuthUI();
// Đóng modal
document.querySelector('.close-modal').onclick = () => {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('videoIframe').src = '';
};

init();

x
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    const savedAccount = JSON.parse(localStorage.getItem("account"));

    if(savedAccount && user === savedAccount.username && pass === savedAccount.password){
        localStorage.setItem('mindx_user', user);
        alert("Đăng nhập thành công!");
        window.location.href = 'index.html';
    } else {
        alert("Sai tài khoản hoặc mật khẩu!");
    }
});
