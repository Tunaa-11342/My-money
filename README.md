# My-money — Ứng dụng Quản lý Chi tiêu Cá nhân & Nhóm  
*A modern web app for managing personal and group expenses.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-orange?style=flat&logo=clerk)](https://clerk.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## Giới thiệu | Introduction

**My-money** là một ứng dụng web giúp người dùng theo dõi, phân tích và quản lý chi tiêu **cá nhân hoặc theo nhóm**.  
Ứng dụng được thiết kế với giao diện hiện đại, tối ưu cho **desktop và mobile**, hỗ trợ **ngôn ngữ tiếng Việt**.

**My-money** is a modern web application designed for **personal and group expense management**.  
It features an elegant UI, full Vietnamese localization, and a responsive layout for both **desktop** and **mobile**.

---

## Tính năng nổi bật | Key Features

### 👤 Cá nhân
- Quản lý **giao dịch thu và chi**
- Phân loại chi tiêu theo **danh mục, mô tả, ngày, loại**
- Thiết lập và theo dõi **ngân sách hàng tháng**
- Hiển thị **thông báo vượt hạn mức chi tiêu**

### 👥 Nhóm
- Tạo **nhóm chi tiêu** và mời thành viên qua **mã mời hoặc QR code**
- Phân quyền **chủ nhóm / thành viên**
- Ghi nhận chi tiêu chung và **tự động tổng hợp chia sẻ**
- Giao diện thống kê chi tiết cho từng nhóm

### 💡 Khác
- **Đăng nhập an toàn** với Clerk Authentication  
- Dữ liệu được quản lý qua **Prisma + PostgreSQL (NeonDB)**  
- Giao diện xây dựng bằng **Next.js 15 App Router + ShadCN UI**  
- Hỗ trợ định dạng tiền tệ linh hoạt (VNĐ, USD, EUR, ...)

---

## Công nghệ sử dụng | Tech Stack

| Công nghệ | Mục đích | Phiên bản |
|------------|-----------|-----------|
| **Next.js 15** | Framework React chính | Latest |
| **TypeScript** | Kiểm soát kiểu tĩnh | 5.x |
| **Prisma ORM** | Quản lý dữ liệu | 5.x |
| **Neon Database** | PostgreSQL Cloud Database | — |
| **TailwindCSS + ShadCN UI** | Giao diện người dùng | 3.x |
| **Clerk** | Xác thực người dùng | 5.x |
| **React Hook Form + Zod** | Xử lý form và validation | 7.x / 3.x |

---

## Cấu trúc thư mục | Project Structure
```
My-money/
├── app/ # App Router của Next.js
│ ├── (lobby)
| ├───────├── /dashboard/
|         ├── /group/
|         ├── /manage/
|         ├── /transactions/
| ├── (auth) #Đăng nhập, đăng kí, quên mật khẩu
│ ├── api/ # API routes (server actions)
│ ├── wizard/ # Thiết lập cho người dùng mới
│ ├── sync-user 
│
├── components/
│ ├── app-logic
| ├── app-ui
| ├── datatable
| ├── dialog
| ├── group
| ├── layouts
| ├── skeletons
| ├── ui    
├── lib/ # Prisma, Clerk và các tiện ích
├── prisma/ # Schema và migrations
├── enums/ # Hằng số, giá trị cố định
├── public/ # Ảnh và icon tĩnh
├── scripts/ # Seed dữ liệu mặc định
├── sytles/ # TailwindCSS
├── types/ # Thành lập các giá trị
└── package.json
```
---

## ⚙️ Cài đặt & Chạy | Installation & Run

### 1️⃣ Clone repository
```bash
git clone https://github.com/Tunaa-11342/My-money.git
cd My-money
```
### 2️⃣ Cài đặt dependencies
```bash
npm install
```
### 3️⃣ Cấu hình môi trường
Tạo file .env ở thư mục gốc với nội dung mẫu:
```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
```
### 4️⃣ Chạy Prisma & seed dữ liệu
```bash
npx prisma migrate deploy
npx prisma db seed
```
### 5️⃣ Khởi động server
```bash
npm run dev
```
Ứng dụng chạy tại:
👉 http://localhost:3000

### Triển khai | Deployment

Dự án có thể triển khai dễ dàng lên Vercel.
Link demo: https://my-money-blush.vercel.app/
###
### Demo Preview
![Dashboard Preview](https://github.com/Tunaa-11342/My-money/blob/4dc558c5f090b976e4226bdeac245bc3bb33ffb8/public/images/A.jpg)
###
### 👥 Nhóm phát triển | Development Team
|Tác giả | Vai trò |Liên hệ |
|------------|-----------|-----------|
|Tunaa  | Fullstack Developer |GitHub @Tunaa-11342|

---

### 📜 Giấy phép | License
Phát hành dưới giấy phép MIT License.
Bạn được phép sao chép, chỉnh sửa và phân phối lại phần mềm này cho mục đích học tập và phi thương mại.

Released under the MIT License — free for learning and non-commercial use.

###
### Cảm ơn | Acknowledgements
Next.js

Clerk Authentication

Prisma ORM

Neon Postgres

ShadCN UI
