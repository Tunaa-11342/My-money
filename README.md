# 💰 My-money — Ứng dụng Quản lý Chi tiêu Cá nhân & Nhóm  
*A modern web app for managing personal and group expenses.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-orange?style=flat&logo=clerk)](https://clerk.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## 🧭 Giới thiệu | Introduction

**My-money** là một web app giúp người dùng theo dõi, phân tích và quản lý chi tiêu của **cá nhân hoặc nhóm**.  
Ứng dụng được thiết kế với giao diện hiện đại, hỗ trợ tiếng Việt, và tối ưu cho cả **desktop** lẫn **mobile**.

**My-money** is a modern web application designed for **personal and group expense management**.  
It features an elegant UI, full Vietnamese localization, and responsive design for both **desktop** and **mobile**.

---

## ✨ Tính năng nổi bật | Key Features

### 👤 Cá nhân
- Thêm, sửa, xóa **giao dịch thu/chi**
- Phân loại chi tiêu theo **danh mục, mô tả, ngày, loại**
- Thiết lập và theo dõi **ngân sách hàng tháng**
- Hiển thị **thông báo vượt hạn mức chi tiêu**

### 👥 Nhóm
- Tạo **nhóm chi tiêu** và mời thành viên qua **mã mời hoặc QR code**
- Phân quyền **chủ nhóm / thành viên**
- Ghi nhận chi tiêu chung, **tự động chia sẻ và tổng hợp**
- Giao diện trực quan cho từng nhóm và thống kê riêng biệt

### 💡 Khác
- Đăng nhập an toàn với **Clerk Authentication**
- Dữ liệu được quản lý qua **Prisma + PostgreSQL (NeonDB)**
- Giao diện được xây dựng bằng **Next.js 15 App Router** + **ShadCN UI**
- Hỗ trợ định dạng tiền tệ linh hoạt (VNĐ, USD, EUR, ...)

---

## 🧩 Công nghệ sử dụng | Tech Stack

| Công nghệ | Mục đích | Version |
|------------|-----------|---------|
| **Next.js 15** | Framework React chính | Latest |
| **TypeScript** | Kiểm soát kiểu tĩnh | 5.x |
| **Prisma ORM** | Quản lý dữ liệu PostgreSQL | 5.x |
| **Neon Database** | Cơ sở dữ liệu Postgres Cloud | — |
| **TailwindCSS + ShadCN UI** | Giao diện người dùng | 3.x |
| **Clerk** | Xác thực người dùng | 5.x |
| **React Hook Form + Zod** | Kiểm tra và quản lý form | 7.x / 3.x |

---

## 📁 Cấu trúc thư mục | Project Structure
My-money/
├── app/                      # App Router của Next.js
│   ├── (lobby)/dashboard/    # Trang dashboard chính
│   ├── api/                  # API routes (Next.js server actions)
│   ├── wizard/               # Thiết lập ban đầu cho người dùng mới
│   └── groups/               # Quản lý nhóm chi tiêu
│
├── components/               # Các component UI tái sử dụng
├── lib/                      # Prisma, Clerk, và các hàm tiện ích
├── prisma/                   # Schema và migrations
├── public/                   # Ảnh và icon
├── scripts/                  # Seed và lệnh khởi tạo dữ liệu
└── package.json
---

## ⚙️ Cài đặt & Chạy | Installation & Run

### 1️⃣ Clone repository
```bash
git clone https://github.com/Tunaa-11342/My-money.git
cd My-money
npm install
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
npx prisma migrate deploy
npx prisma db seed
npm run dev
Ứng dụng sẽ chạy tại:
👉 http://localhost:3000

⸻

🚀 Triển khai | Deployment

Ứng dụng có thể triển khai dễ dàng lên Vercel
Link chạy thử (demo):
🔗 My-money on Vercel

⸻

📊 Demo Preview

(Bạn có thể chèn ảnh minh họa UI hoặc animation tại đây)
Ví dụ:

📜 Giấy phép | License

Phát hành dưới giấy phép MIT License.
Bạn được phép sao chép, chỉnh sửa và phân phối lại phần mềm này cho mục đích học tập và phi thương mại.

Released under the MIT License — free for learning and non-commercial use.

⸻

❤️ Cảm ơn | Acknowledgements
	•	Next.js
	•	Clerk Authentication
	•	Prisma ORM
	•	Neon Postgres
	•	ShadCN UI
