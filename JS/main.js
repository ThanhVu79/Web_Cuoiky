/* =========================================
   FUNDHUB - MAIN JAVASCRIPT CONTROLLER
   ========================================= */

// --- 1. CẤU HÌNH & HÀM HỖ TRỢ (HELPERS) ---

// Lấy dữ liệu từ LocalStorage
const getStore = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

// Lưu dữ liệu vào LocalStorage
const setStore = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// Định dạng tiền tệ (VNĐ)
const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Chuyển file sang base64 để lưu tạm trong localStorage
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Hiển thị thông báo nổi (Toast Notification)
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast`;
    toast.style.borderLeftColor = type === 'success' ? '#00B862' : '#EF4444';
    
    const icon = type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill';
    const color = type === 'success' ? '#00B862' : '#EF4444';
    
    toast.innerHTML = `<i class="bi bi-${icon}" style="color:${color}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 2. XỬ LÝ XÁC THỰC (AUTHENTICATION) ---

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const users = getStore('users');

    // Tìm user trong database
    const user = users.find(u => u.email === email && u.pass === pass);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showToast(`Đăng nhập thành công! Xin chào ${user.name}`);
        
        // Chuyển hướng dựa trên vai trò
        setTimeout(() => {
            if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
            else window.location.href = 'dashboard.html';
        }, 1000);
    } else {
        showToast('Email hoặc mật khẩu không đúng!', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const pass = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const role = document.getElementById('register-role').value;

    if (pass !== confirm) return showToast('Mật khẩu xác nhận chưa khớp', 'error');
    if (pass.length < 6) return showToast('Mật khẩu tối thiểu 6 ký tự', 'error');

    const users = getStore('users');
    if (users.find(u => u.email === email)) return showToast('Email này đã tồn tại', 'error');

    const avatarFile = document.getElementById('register-avatar').files[0];
    const avatar = await fileToBase64(avatarFile);

    const newUser = {
        email,
        pass,
        name,
        role,
        wallet: 0,
        bio: '',
        avatar
    };

    users.push(newUser);
    setStore('users', users);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    showToast('Đăng ký thành công! Đang chuyển hướng...', 'success');

    setTimeout(() => {
        if (role === 'admin') window.location.href = 'admin-dashboard.html';
        else window.location.href = 'dashboard.html';
    }, 1200);
}

function handleLogout() {
    if(confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// --- 3. ĐIỀU HƯỚNG & KHỞI TẠO (ROUTER & INIT) ---

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // 3.1 Render Navbar (Trừ trang Login)
    if (!path.includes('login.html')) {
        renderNavbar(currentUser);
    }

    // 3.2 LOGIC TRANG CHỦ (index.html)
    if (path.includes('index.html') || path.endsWith('/')) {
        const projects = getStore('projects').filter(p => p.status === 'active');
        
        // Render Grid Dự án
        const grid = document.getElementById('project-grid');
        if (grid) {
            if (projects.length > 0) {
                // Lấy 6 dự án mới nhất
                grid.innerHTML = projects.slice(0, 6).map(p => createProjectCard(p)).join('');
            } else {
                grid.innerHTML = `<p class="text-center" style="grid-column:1/-1; color:#666">Chưa có dự án nào đang hoạt động.</p>`;
            }
        }

        // Setup các chức năng trang chủ
        setupFilters(projects);
        setupLeaderboard(projects);
        setupHowTabs();

        // Ẩn nút "Bắt đầu dự án" nếu không phải Founder
        const createBtn = document.getElementById('hero-create-btn');
        if (createBtn) {
            if (!currentUser || currentUser.role !== 'founder') createBtn.classList.add('hidden');
            else createBtn.classList.remove('hidden');
        }
    }

    // 3.3 LOGIC CHI TIẾT DỰ ÁN
    if (path.includes('project-detail.html')) {
        const id = new URLSearchParams(window.location.search).get('id');
        renderProjectDetail(id, currentUser);
    }

    // 3.4 LOGIC DASHBOARD (USER & FOUNDER)
    if (path.includes('dashboard.html')) {
        if (!currentUser) return window.location.href = 'login.html';
        renderUserDashboard(currentUser);
    }

    // 3.5 LOGIC ADMIN DASHBOARD
    if (path.includes('admin-dashboard.html')) {
        if (!currentUser || currentUser.role !== 'admin') return window.location.href = 'index.html';
        renderAdminDashboard();
    }
    
    // 3.6 LOGIC PROFILE
    if (path.includes('profile.html')) {
        if (!currentUser) return window.location.href = 'login.html';
        document.getElementById('input-name').value = currentUser.name;
        document.getElementById('profile-role-display').innerText = currentUser.role.toUpperCase();
        document.getElementById('profile-email').value = currentUser.email;
        document.getElementById('profile-name-display').innerText = currentUser.name;
        if (document.getElementById('profile-bio')) document.getElementById('profile-bio').value = currentUser.bio || '';
        const avatarSrc = currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=00B862&color=fff`;
        const avatarImg = document.getElementById('profile-avatar-img');
        if (avatarImg) avatarImg.src = avatarSrc;
        const avatarName = document.getElementById('profile-avatar-name');
        if (avatarName) avatarName.innerText = 'Sử dụng ảnh hiện tại';
        const avatarInput = document.getElementById('profile-avatar');
        if (avatarInput) {
            avatarInput.addEventListener('change', () => {
                avatarName.innerText = avatarInput.files[0]?.name || 'Sử dụng ảnh hiện tại';
            });
        }
    }
});

// --- 4. CÁC HÀM RENDER GIAO DIỆN (UI RENDERING) ---

function renderNavbar(user) {
    const container = document.getElementById('nav-auth-container');
    if (!container) return;

    if (user) {
        const avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=00B862&color=fff`;
        // Đã đăng nhập -> Hiển thị User Dropdown
        container.innerHTML = `
            <div class="user-dropdown">
                <div class="user-btn" onclick="this.nextElementSibling.classList.toggle('show')">
                    <img src="${avatar}" class="user-avatar">
                    <span>${user.name}</span>
                    <i class="bi bi-chevron-down"></i>
                </div>
                <div class="dropdown-menu">
                    ${user.role === 'admin' ? '<a href="admin-dashboard.html">Quản trị hệ thống</a>' : ''}
                    <a href="dashboard.html">Dashboard</a>
                    <a href="profile.html">Hồ sơ cá nhân</a>
                    <a href="#" onclick="handleLogout()" style="color:var(--danger)">Đăng xuất</a>
                </div>
            </div>`;
            
        // Click ra ngoài để đóng menu
        window.onclick = (e) => {
            if (!e.target.closest('.user-dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.remove('show'));
            }
        };
    } else {
        // Chưa đăng nhập -> Hiển thị nút Login/Register
        container.innerHTML = `
            <a href="login.html" class="btn-login-nav">Đăng nhập</a>
            <a href="login.html" class="btn-register-nav">Đăng ký</a>
        `;
    }
}

function createProjectCard(p) {
    const percent = Math.round((p.current / p.target) * 100);
    return `
        <div class="project-card">
            <div class="card-img-box">
                <img src="${p.image}" alt="${p.title}">
                <span style="position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.6); color:white; padding:4px 10px; border-radius:20px; font-size:0.75rem">${p.category}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title" title="${p.title}">${p.title}</h3>
                <p style="color:var(--text-soft); font-size:0.9rem; margin-bottom:10px">bởi <b>${p.founder}</b></p>
                
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${Math.min(percent, 100)}%"></div>
                </div>
                
                <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:700">
                    <span class="text-primary">${formatMoney(p.current)}</span>
                    <span>${percent}%</span>
                </div>
                <a href="project-detail.html?id=${p.id}" class="btn btn-outline btn-full" style="margin-top:15px">Xem chi tiết</a>
            </div>
        </div>
    `;
}

// --- 5. LOGIC BẢNG XẾP HẠNG (LEADERBOARD TABS) ---
function setupLeaderboard(projects) {
    const btnProjects = document.getElementById('btn-lb-projects');
    const btnSupporters = document.getElementById('btn-lb-supporters');
    const listContainer = document.getElementById('leaderboard-list');

    if (!btnProjects || !listContainer) return;

    // Mock Data Người ủng hộ
    const topSupporters = [
        { name: "Trần Minh", count: 45, amount: 250000000 },
        { name: "Lê Thị Hồng", count: 38, amount: 210000000 },
        { name: "Phạm Tuấn Anh", count: 32, amount: 185000000 },
        { name: "Nguyễn Hoàng", count: 28, amount: 120000000 },
        { name: "Vũ Thu Hương", count: 25, amount: 95000000 },
    ];

    // Render Top Projects
    const renderTopProjects = () => {
        const topP = [...projects].sort((a, b) => b.current - a.current).slice(0, 5);
        
        listContainer.innerHTML = topP.map((p, i) => {
            const percent = Math.round((p.current / p.target) * 100);
            return `
            <div class="lb-row">
                <div class="lb-idx-box top-${i+1}">${i+1}</div>
                <div class="lb-content">
                    <div class="lb-name">${p.title}</div>
                    <div class="lb-sub">${p.founder}</div>
                </div>
                <div class="lb-val">
                    <span class="lb-meta green">${percent}%</span>
                    <span style="font-size:0.9rem; color:#666; margin-left:10px; display:inline-block; min-width:100px">${p.supporters} người ủng hộ</span>
                    <span class="lb-amount" style="margin-top:5px">${formatMoney(p.current)}</span>
                </div>
            </div>
        `}).join('');
    };

    // Render Top Supporters
    const renderTopSupporters = () => {
        listContainer.innerHTML = topSupporters.map((s, i) => `
            <div class="lb-row">
                <div class="lb-idx-box top-${i+1}">${i+1}</div>
                <div class="lb-content">
                    <div class="lb-name">${s.name}</div>
                    <div class="lb-sub">${s.count} lần ủng hộ</div>
                </div>
                <div class="lb-val">
                    <span class="lb-amount"><i class="bi bi-graph-up-arrow text-primary"></i> ${formatMoney(s.amount)}</span>
                </div>
            </div>
        `).join('');
    };

    // Event Listeners chuyển tab
    btnProjects.addEventListener('click', () => {
        btnProjects.classList.add('active');
        btnSupporters.classList.remove('active');
        renderTopProjects();
    });

    btnSupporters.addEventListener('click', () => {
        btnSupporters.classList.add('active');
        btnProjects.classList.remove('active');
        renderTopSupporters();
    });

    // Mặc định hiển thị Top Projects
    renderTopProjects();
}

// --- 6. LOGIC LỌC DỰ ÁN (FILTER) ---
function setupFilters(projects) {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active class style
            document.querySelector('.filter-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            
            // Filter logic
            const cat = btn.getAttribute('data-cat');
            const filtered = cat === 'all' ? projects : projects.filter(p => p.category === cat);
            
            const grid = document.getElementById('project-grid');
            if (grid) {
                if (filtered.length > 0) {
                    grid.innerHTML = filtered.map(createProjectCard).join('');
                } else {
                    grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:20px">Không tìm thấy dự án nào thuộc danh mục này.</p>';
                }
            }
        });
    });
}

function setupHowTabs() {
    const tabs = document.querySelectorAll('.how-tab');
    const panels = document.querySelectorAll('.how-panel');
    if (!tabs.length || !panels.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.target);
            if (target) target.classList.add('active');
        });
    });
}

// --- 7. LOGIC DASHBOARD & CHI TIẾT ---

function renderUserDashboard(user) {
    const content = document.getElementById('dashboard-content');
    if(!content) return;

    // Update Sidebar Info
    document.getElementById('sidebar-name').innerText = user.name;
    const roleBadge = document.getElementById('sidebar-role');
    roleBadge.innerText = user.role.toUpperCase();
    roleBadge.className = `badge badge-${user.role === 'founder' ? 'active' : 'pending'}`;
    const avatarImg = document.getElementById('sidebar-avatar');
    if (avatarImg) {
        avatarImg.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=00B862&color=fff`;
    }

    if (user.role === 'founder') {
        // === GIAO DIỆN FOUNDER ===
        const myProjects = getStore('projects').filter(p => p.founderEmail === user.email);
        
        content.innerHTML = `
            <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px">
                <h2>Dự án của tôi</h2>
                <a href="create-project.html" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Tạo dự án mới</a>
            </div>
            <div class="project-grid">
                ${myProjects.length ? myProjects.map(p => `
                    <div class="project-card">
                        <div class="card-body">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                                <span class="badge badge-${p.status === 'active' ? 'active' : p.status === 'pending' ? 'pending' : 'rejected'}">${p.status}</span>
                                <span style="font-size:0.85rem; color:var(--text-soft)">ID: #${p.id}</span>
                            </div>
                            <h4>${p.title}</h4>
                            <p style="margin:10px 0">Đã gọi: <b class="text-primary">${formatMoney(p.current)}</b> / ${formatMoney(p.target)}</p>
                            <p style="font-size:0.85rem; color:var(--text-soft);">Deadline: ${p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : '—'}</p>
                            ${p.status === 'active' ? `<button class="btn btn-outline btn-full" onclick="showToast('Đã gửi yêu cầu rút vốn cho Admin!')">Yêu cầu rút vốn</button>` : ''}
                             ${p.status === 'rejected' ? `<p style="color:red; font-size:0.9rem">Dự án bị từ chối. Vui lòng liên hệ Admin.</p>` : ''}
                        </div>
                    </div>
                `).join('') : '<p>Bạn chưa có dự án nào.</p>'}
            </div>
        `;
    } else {
        // === GIAO DIỆN CONTRIBUTOR ===
        const history = getStore('contributions').filter(c => c.userEmail === user.email);
        const totalInvested = history.reduce((acc, curr) => acc + curr.amount, 0);
        
        content.innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom:30px; margin-top:0;">
                <div class="stat-box">
                    <span class="stat-label">Tổng số lần góp</span>
                    <span class="stat-number">${history.length}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Tổng tiền đã góp</span>
                    <span class="stat-number text-primary">${formatMoney(totalInvested)}</span>
                </div>
            </div>
            <div class="table-container">
                <h3 style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.08)">Lịch sử đầu tư</h3>
                <table class="admin-table">
                    <thead><tr><th>Dự án</th><th>Số tiền</th><th>Thời gian</th></tr></thead>
                    <tbody>
                        ${history.length ? history.map(h => `
                            <tr>
                                <td style="font-weight:600">${h.projectName}</td>
                                <td class="text-primary">${formatMoney(h.amount)}</td>
                                <td style="color:var(--text-soft)">${h.date}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" class="text-center">Bạn chưa đóng góp vào dự án nào.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }
}

function renderAdminDashboard() {
    const projects = getStore('projects');
    const pending = projects.filter(p => p.status === 'pending');
    
    // Render Stats
    const statsHTML = `
        <div class="stat-box"><span class="stat-number">${projects.length}</span><span class="stat-label">Tổng dự án</span></div>
        <div class="stat-box"><span class="stat-number" style="color:var(--warning)">${pending.length}</span><span class="stat-label">Chờ duyệt</span></div>
        <div class="stat-box"><span class="stat-number text-primary">${formatMoney(projects.reduce((a,b)=>a+b.current, 0))}</span><span class="stat-label">Tổng vốn</span></div>
    `;
    const statsContainer = document.getElementById('admin-stats');
    if(statsContainer) statsContainer.innerHTML = statsHTML;

    // Render Table
    const tbody = document.getElementById('admin-table-body');
    if(!tbody) return;

    if (pending.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:30px; color:#666">Hiện không có dự án nào cần duyệt.</td></tr>`;
    } else {
        tbody.innerHTML = pending.map(p => `
            <tr>
                <td>
                    <div style="font-weight:700">${p.title}</div>
                    <small style="color:#666">Founder: ${p.founder}</small>
                </td>
                <td>${formatMoney(p.target)}</td>
                <td><span class="badge badge-pending">Pending</span></td>
                <td>
                    <button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem" onclick="adminAction(${p.id}, 'approve')">Duyệt</button>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem" onclick="adminAction(${p.id}, 'reject')">Từ chối</button>
                </td>
            </tr>
        `).join('');
    }
}

function renderProjectDetail(id, user) {
    const p = getStore('projects').find(p => p.id == id);
    if (!p) {
        document.body.innerHTML = "<h2 class='text-center' style='margin-top:100px'>Dự án không tồn tại</h2>";
        return;
    }
    
    window.currentProjectId = id; // Lưu ID để dùng khi donate
    
    // Bind data to UI
    document.getElementById('d-title').innerText = p.title;
    document.getElementById('d-founder').innerText = "Founder: " + p.founder;
    document.getElementById('d-img').src = p.image;
    document.getElementById('d-desc').innerText = p.desc || "Chưa có mô tả chi tiết.";
    if (document.getElementById('d-deadline')) {
        document.getElementById('d-deadline').innerText = p.deadline ? `Deadline: ${new Date(p.deadline).toLocaleDateString('vi-VN')}` : '';
    }
    document.getElementById('d-target').innerText = formatMoney(p.target);
    document.getElementById('d-current').innerText = formatMoney(p.current);
    document.getElementById('d-current').style.color = 'var(--primary)';
    
    const percent = Math.min(100, (p.current/p.target)*100);
    document.getElementById('d-progress').style.width = percent + "%";
    
    // Logic hiển thị form đóng góp
    const actionArea = document.getElementById('detail-action-area'); // Cần div này trong HTML nếu muốn custom (hiện tại đang dùng logic login ở form donate trực tiếp)
    
    // Nếu là Founder xem dự án của mình -> Disable donate
    if (user && user.name === p.founder) {
        const btnDonate = document.querySelector('#donate-form button');
        if(btnDonate) {
            btnDonate.disabled = true;
            btnDonate.innerText = "Bạn là chủ dự án này";
            btnDonate.classList.add('btn-outline');
            btnDonate.classList.remove('btn-primary');
        }
    }
}

// --- 8. CÁC HÀNH ĐỘNG (ACTIONS) ---

// Xử lý Đóng góp (Donate)
function handleDonate(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // 1. Chưa đăng nhập
    if (!user) {
        showToast('Vui lòng đăng nhập để đóng góp!', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    // 2. Xử lý đóng góp
    const amount = parseInt(document.getElementById('donate-amount').value);
    if(amount <= 0) return showToast('Số tiền không hợp lệ', 'error');

    const projects = getStore('projects');
    const pIndex = projects.findIndex(p => p.id == window.currentProjectId);
    
    if (pIndex !== -1) {
        // Update Project Data
        projects[pIndex].current += amount;
        projects[pIndex].supporters += 1;
        setStore('projects', projects);
        
        // Update Contribution History
        const contributions = getStore('contributions');
        contributions.push({
            userEmail: user.email,
            projectName: projects[pIndex].title,
            amount: amount,
            date: new Date().toLocaleString('vi-VN')
        });
        setStore('contributions', contributions);
        
        showToast(`Cảm ơn bạn! Đã đóng góp ${formatMoney(amount)} thành công!`);
        setTimeout(() => location.reload(), 1500);
    }
}

// Xử lý Tạo dự án (Founder)
async function handleCreateProject(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'founder') {
        showToast('Chỉ Founder mới có thể tạo dự án', 'error');
        return;
    }
    
    const title = document.getElementById('p-title').value.trim();
    const target = parseInt(document.getElementById('p-target').value, 10);
    const cat = document.getElementById('p-cat').value;
    const desc = document.getElementById('p-desc').value.trim();
    const deadline = document.getElementById('p-deadline').value;
    const mediaFile = document.getElementById('p-media').files[0];
    const media = await fileToBase64(mediaFile);

    if (!deadline) return showToast('Vui lòng chọn deadline', 'error');

    const projects = getStore('projects');
    const activeCount = projects.filter(p => p.founderEmail === user.email && ['pending', 'active'].includes(p.status)).length;
    if (activeCount >= 2) return showToast('Bạn đã đạt giới hạn 2 dự án đang hoạt động/chờ duyệt', 'error');

    const newProject = {
        id: Date.now(),
        title,
        founder: user.name,
        founderEmail: user.email,
        category: cat,
        target,
        current: 0,
        supporters: 0,
        image: media || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
        status: "pending",
        deadline,
        desc
    };

    projects.push(newProject);
    setStore('projects', projects);
    
    showToast('Dự án đã gửi duyệt thành công! Vui lòng chờ Admin.');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
}

// Cập nhật hồ sơ người dùng
async function handleProfileUpdate(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return window.location.href = 'login.html';

    const name = document.getElementById('input-name').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    let avatar = currentUser.avatar;
    const avatarFile = document.getElementById('profile-avatar').files[0];
    if (avatarFile) avatar = await fileToBase64(avatarFile);

    const users = getStore('users');
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx === -1) return;

    users[idx] = { ...users[idx], name, bio, avatar };
    setStore('users', users);
    localStorage.setItem('currentUser', JSON.stringify(users[idx]));

    document.getElementById('profile-avatar-img').src = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00B862&color=fff`;
    document.getElementById('profile-name-display').innerText = name;
    const avatarLabel = document.getElementById('profile-avatar-name');
    if (avatarLabel) avatarLabel.innerText = avatarFile ? avatarFile.name : 'Sử dụng ảnh hiện tại';
    showToast('Đã cập nhật hồ sơ thành công!');
}

// Xử lý Admin Duyệt/Từ chối
function adminAction(id, action) {
    const projects = getStore('projects');
    const p = projects.find(p => p.id == id);
    
    if (p) {
        if (action === 'approve') {
            p.status = 'active';
            showToast(`Đã duyệt dự án: ${p.title}`);
        } else {
            p.status = 'rejected';
            showToast(`Đã từ chối dự án: ${p.title}`, 'error');
        }
        setStore('projects', projects);
        renderAdminDashboard(); // Render lại bảng
    }
}