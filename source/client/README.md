# MODULE CLIENT

> 📘 _Client đóng vai trò giao diện người dùng trong hệ thống Online Judge, kết nối tới API Gateway để xử lý yêu cầu._

---

## 🎯 MỤC TIÊU

Client chịu trách nhiệm:

- Hiển thị giao diện người dùng (UI)
- Gửi yêu cầu đến server để đăng nhập, đăng ký, đăng xuất, code, xem kết quả và bảng xếp hạng
- Cung cấp giao diện tương tác

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần     | Công nghệ                                                           |
| -------------- | ------------------------------------------------------------------- |
| Ngôn ngữ       | JavaScript                                                          |
| Framework      | ReactJS                                                             |
| Thư viện chính | Axios, React Router DOM, TailwindCSS, Monaco Editor, React Markdown |
| Giao thức      | HTTP                                                                |
| Triển khai     | Docker + Nginx                                                      |

---

## 🚀 HƯỚNG DẪN CHẠY

### Cài đặt

```bash
# Chuyển thư mục đến Folder Client
cd client

# Cài đặt thư viện
npm install
```

### Chạy chương trình

```bash
# Chạy development mode
npm start

```

### Cấu hình (nếu cần)

- Client URL: `http://127.0.0.1:3000` (Với các services không cùng port)
- Nếu chạy bằng Docker: `http://127.0.0.1:80`
- Lưu cấu hình trong file `.env`

---

## 📦 CẤU TRÚC

```
client/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── HomePage.jsx
│   │   ├── LeaderboardPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── Navbar.jsx
│   │   ├── OnlineJudge.jsx
│   │   ├── ProblemPage.jsx
│   │   ├── ProblemsPage.jsx
│   │   └── SubmitForm.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── constants.js
│   ├── App.js
│   ├── index.css
│   └── index.js
├── .env
├── .gitignore
├── Dockerfile
├── nginx.conf
├── package.json
├── postcss.config.js
├── README.md
└── tailwind.config.js
```

---

## 💡 SỬ DỤNG

### Chạy trên localhost

```bash
# Khởi động ứng dụng
npm start
```

Sau khi chạy, mở trình duyệt và truy cập: `http://127.0.0.1:3000`

### Chạy bằng Docker

**Build và chạy container:**

```bash
# Tạo images
docker-compose build frontend
# Chạy container
docker-compose up -d frontend
```

**Dừng container:**

```bash
docker-compose down
```

**Khởi động lại container:**

```bash
docker-compose up -d
```

Sau khi chạy, mở trình duyệt và truy cập: `http://127.0.0.1:80`

### Hướng dẫn sử dụng

1. Đăng nhập tài khoản hoặc đăng ký để sử dụng hệ thống
2. Chọn bài toán, nhập code và gửi
3. Xem kết quả chấm điểm, bảng xếp hạng

---

## 📝 GHI CHÚ

- Đảm bảo server đã chạy trước khi khởi động client
- Vì dự án dùng mô hình microservices nên frontend được coi là một service, được build trên Dockerfile và được chạy bằng docker-compose ở source bên ngoài
- Nếu chạy trên localhost vẫn chạy được bình thường nhưng không thể kết nối được với các services khác vì không có network.
