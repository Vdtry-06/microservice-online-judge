# MODULE SERVER

> 📘 Module xử lý backend cho hệ thống Online Judge

---

## 🎯 MỤC TIÊU

Server chịu trách nhiệm:
- Xử lý yêu cầu xác thực
- Quản lý danh sách bài tập và đề bài
- Tiếp nhận và xử lý bài nộp từ người dùng
- Chấm điểm tự động các bài nộp
- Tính toán và cập nhật bảng xếp hạng
- Trả lại kết quả cho người dùng

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Structure | Microservices | Architecture|
| Server | Node.js 18 + Axios,  | REST API |
| Client | ReactJS + TailwindCSS | Giao tiếp HTTP |
| Deploy | Docker & Docker Compose | Build Service |
| Store Cache & Queue|Redis, RabbitMQ|Cache và hàng đợi|
| Database | MongoDB (3 instance tách biệt users, problems, submissions) | Lưu trữ dữ liệu |
| Reverse proxy / API aggregation|Api-gateway|trung gian|
|RabbitMQ|rabbitmq:3-management-alpine|Hàng đợi xử lý bài nộp (asynchronous jobs)|

### Các Microservices chính

| Service | Công nghệ chính |Framework / Thư viện chính|Chức năng|
|-------- |-----------------|--------------------------|---------|
|API Gateway|Node.js (v18+)|express, axios, ioredis, express-rate-limit, cors|Định tuyến request, rate limiting, kết nối frontend <=> backend|
|User Service|Node.js (v18+)|express, bcryptjs, jsonwebtoken, mongodb, ioredis, dotenv|Quản lý người dùng, xác thực JWT|
|Problem Service|Node.js (v18+)|express, mongodb, ioredis|Quản lý bài tập, dữ liệu bài toán|
|Submission Service|Node.js (v18+)|express, amqplib, mongodb, axios, ioredis|Quản lý bài nộp, tương tác với Judge Worker qua RabbitMQ|
|Judge Worker|Node.js (v18+)|axios, amqplib, ioredis, vm2|Thực thi code của người dùng trong môi trường an toàn (sandbox)|

---

## 🚀 HƯỚNG DẪN CHẠY

### Cài đặt
```bash
# Cài đặt dependencies cho tất cả services
docker-compose build
```

### Khởi động bằng Docker
```bash
docker-compose up -d
```

Các services chạy tại các ports:
- API Gateway: `http://localhost:3000`
- User Service: `http://localhost:3001`
- Problem Service: `http://localhost:3002`
- Submission Service: `http://localhost:3003`

---

## 🔗 API ENDPOINTS

### User Service
| Endpoint | Method | Mô tả |
|----------|--------|--------|
| `/api/auth/login` | POST | Đăng nhập |
| `/api/auth/register` | POST | Đăng ký tài khoản |
| `/api/users` | GET | Lấy danh sách người dùng |
| `/api/leaderboard` | GET | Lấy bảng xếp hạng |

### Problem Service
| Endpoint | Method | Mô tả |
|----------|--------|--------|
| `/api/problems` | GET | Lấy danh sách bài tập |
| `/api/problems/:id` | GET | Lấy chi tiết bài tập |

### Submission Service  
| Endpoint | Method | Mô tả |
|----------|--------|--------|
| `/api/submissions` | POST | Nộp bài giải |
| `/api/submissions/:id` | GET | Xem kết quả chấm bài |

---

## 📦 CẤU TRÚC THƯ MỤC
```
server/
├── api-gateway/     # API Gateway service
├── user-service/    # Xử lý user & auth
├── problem-service/ # Quản lý bài tập
├── submission-service/ # Xử lý bài nộp
├── judge-worker/    # Worker chấm bài
└── load-testing/    # Test hiệu năng
```

---

## 🧪 KIỂM THỬ
```bash
# Test API Gateway
curl http://127.0.0.1/health

# Test các services
docker-compose logs -f api-gateway
docker-compose logs -f problem-service
docker-compose logs -f submission-service
docker-compose logs -f user-service
docker-compose logs -f judge-worker
```

---

## 📝 LƯU Ý

- Cần có Docker và Docker Compose để chạy hệ thống
- Các biến môi trường được cấu hình trong file docker-compose.yml
- Dữ liệu mẫu được seed tự động khi khởi động services
- Tham khảo API docs của từng service để biết thêm chi tiết