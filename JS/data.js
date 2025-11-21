/* =========================================
   MOCK DATABASE (Giả lập dữ liệu)
   ========================================= */

// 1. Dữ liệu Dự án (Projects)
const defaultProjects = [
    { 
        id: 1, 
        title: "Hệ thống tưới tiêu thông minh cho nông nghiệp sạch", 
        founder: "Nguyễn Văn A", 
        founderEmail: "founder@fundhub.com",
        category: "Nông nghiệp", 
        target: 50000000, 
        current: 35000000, 
        supporters: 124, 
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800", 
        status: "active",
        deadline: "2024-12-31",
        desc: "Giải pháp IoT giúp tối ưu nước tưới và phân bón theo thời gian thực."
    },
    { 
        id: 2, 
        title: "Phim ngắn: Bóng Đêm Sài Gòn", 
        founder: "Trần Thị B", 
        founderEmail: "founder@fundhub.com",
        category: "Điện ảnh", 
        target: 10000000, 
        current: 7500000, 
        supporters: 69, 
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800", 
        status: "active",
        deadline: "2024-11-15",
        desc: "Một bộ phim khắc họa cuộc sống về đêm của những người lao động."
    },
    { 
        id: 3, 
        title: "Game VR Thần Thoại Việt Nam", 
        founder: "Lê C", 
        founderEmail: "founder@fundhub.com",
        category: "Công nghệ", 
        target: 200000000, 
        current: 180000000, 
        supporters: 215, 
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800", 
        status: "active",
        deadline: "2025-01-20",
        desc: "Trải nghiệm thế giới Sơn Tinh Thủy Tinh qua kính thực tế ảo."
    },
    { 
        id: 4, 
        title: "Xe máy điện thông minh (Chờ duyệt)", 
        founder: "Nguyễn Văn A", 
        founderEmail: "founder@fundhub.com",
        category: "Công nghệ", 
        target: 500000000, 
        current: 0, 
        supporters: 0, 
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c3d?w=800", 
        status: "pending",
        deadline: "2025-03-10",
        desc: "Dự án xe máy điện pin tháo rời, sạc siêu nhanh."
    }
];

// 2. Dữ liệu Người dùng (Users)
const defaultUsers = [
    { email: "contributor@fundhub.com", pass: "123456", name: "Trần Nhà Đầu Tư", role: "contributor", wallet: 100000000, bio: "Nhà đầu tư cá nhân yêu thích công nghệ xanh.", avatar: null },
    { email: "founder@fundhub.com", pass: "123456", name: "Nguyễn Văn A", role: "founder", wallet: 0, bio: "Co-founder Agritech Labs.", avatar: null },
    { email: "admin@fundhub.com", pass: "123456", name: "Admin System", role: "admin", wallet: 0, bio: "Vận hành TreFund", avatar: null }
];

// 3. Khởi tạo dữ liệu vào LocalStorage nếu chưa có
function initData() {
    if (!localStorage.getItem('projects')) {
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('contributions')) {
        localStorage.setItem('contributions', JSON.stringify([])); // Lịch sử đóng góp
    }
}

initData();