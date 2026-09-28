# 💬 Akselera Chat App
Aplikasi real-time chat berbasis web yang dibangun dengan Next.js, Prisma, dan Pusher. Mendukung autentikasi, percakapan privat antar pengguna, dan pengiriman pesan secara instan.
---
## Tech Stack & Infrastruktur
### Core Framework
| Teknologi | Versi | Alasan Dipilih |
|-----------|-------|----------------|
| **Next.js** | 16.x | Full-stack framework React dengan App Router, API Routes built-in, dan server-side rendering. Tidak perlu backend terpisah – semua rute API berjalan dalam satu project. |
| **React** | 19.x | Library UI terbaru dengan concurrent features untuk performa rendering yang lebih baik. |
| **TypeScript** | 5.x | Type safety, autocompletion, dan deteksi error saat development. Mengurangi bug runtime secara signifikan. |
### Database & ORM
| Teknologi | Versi | Alasan Dipilih |
|-----------|-------|----------------|
| **SQLite** | - | Database ringan berbasis file (`dev.db`), tidak memerlukan instalasi server database. Ideal untuk development lokal dan deployment sederhana. |
| **Prisma** | 6.x | ORM modern dengan type-safe query, auto-generated client, dan migration system yang mudah. Mendukung SQLite maupun database lain jika perlu scaling. |
### Autentikasi
| Teknologi | Versi | Alasan Dipilih |
|-----------|-------|----------------|
| **NextAuth.js v5** | beta | Solusi autentikasi terintegrasi untuk Next.js. Mendukung session-based auth, mudah dikonfigurasi, dan aman out-of-the-box. Password di-hash menggunakan `bcryptjs`. |
### Real-time Messaging
| Teknologi | Versi | Alasan Dipilih |
|-----------|-------|----------------|
| **Pusher** | 5.x (server) / 8.x (client) | WebSocket-as-a-Service yang sangat mudah di-setup. Tanpa perlu konfigurasi WebSocket server sendiri. Plan gratis cukup untuk penggunaan development/staging. Cluster `ap1` (Asia Pacific) dipakai agar latensi rendah untuk pengguna Indonesia. |
### Styling
| Teknologi | Versi | Alasan Dipilih |
|-----------|-------|----------------|
| **Tailwind CSS** | 4.x | Utility-first CSS framework. Mempercepat styling tanpa menulis CSS custom, konsisten di seluruh komponen. |
| **next-themes** | 0.4.x | Manajemen dark/light mode yang seamless dengan SSR support. |
---
## Menjalankan Secara Lokal
### Prasyarat
- Node.js **>= 18**
- npm atau pnpm
- Akun [Pusher](https://pusher.com) (gratis) untuk mendapatkan App credentials
### 1. Clone repository & install dependency
```bash
git clone <repo-url>
cd akselerachatapp
npm install
```
### 2. Konfigurasi environment
Buat file `.env` di root project (atau salin dari `.env.example` jika ada):
```env
# Database – SQLite file lokal
DATABASE_URL="file:./dev.db"
# NextAuth – isi dengan random string panjang
AUTH_SECRET="your-very-long-random-secret-change-this"
# Pusher – daftar di https://pusher.com, buat App baru
PUSHER_APP_ID="your-app-id"
PUSHER_APP_KEY="your-app-key"
PUSHER_APP_SECRET="your-app-secret"
PUSHER_APP_CLUSTER="ap1"
# Public (untuk client-side)
NEXT_PUBLIC_PUSHER_APP_KEY="your-app-key"
NEXT_PUBLIC_PUSHER_APP_CLUSTER="ap1"
```
### 3. Setup database
```bash
# Push schema ke SQLite
npx prisma db push
# (Opsional) Buka Prisma Studio untuk lihat data
npx prisma studio
```
### 4. Jalankan development server
```bash
npm run dev
```
Aplikasi akan berjalan di **http://localhost:3000**
### 5. Build production
```bash
npm run build
npm start
```
---
## Struktur Tabel Database
Skema dikelola oleh Prisma (`prisma/schema.prisma`) dengan provider **SQLite**.
### `User`
Menyimpan data akun pengguna.
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | String (cuid) | Primary key, auto-generated |
| `name` | String | Nama lengkap pengguna |
| `email` | String | Unique – digunakan untuk login |
| `passwordHash` | String | Password yang di-hash dengan bcryptjs |
| `createdAt` | DateTime | Waktu registrasi |
Relasi: satu User bisa memiliki banyak `Participant` dan `Message`.
---
### `Conversation`
Mewakili satu sesi percakapan (chat room).
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | String (cuid) | Primary key, auto-generated |
| `createdAt` | DateTime | Waktu percakapan dibuat |
Relasi: satu Conversation memiliki banyak `Participant` dan `Message`.
---
### `Participant`
Tabel pivot/junction antara `User` dan `Conversation`.
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | String (cuid) | Primary key |
| `conversationId` | String | FK → `Conversation.id` (cascade delete) |
| `userId` | String | FK → `User.id` (cascade delete) |
Constraint: `@@unique([conversationId, userId])` – satu user hanya bisa masuk satu kali per conversation.
---
### `Message`
Menyimpan setiap pesan dalam percakapan.
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | String (cuid) | Primary key |
| `body` | String | Isi pesan |
| `read` | Boolean | Status baca (default: `false`) |
| `conversationId` | String | FK → `Conversation.id` (cascade delete) |
| `senderId` | String | FK → `User.id` (cascade delete) |
| `createdAt` | DateTime | Waktu pesan dikirim |

---
## AI Tools yang Dipakai
Proyek ini dikembangkan dengan bantuan AI tools berikut:
| Tool | Fungsi |
|------|--------|
| **Google Gemini (Antigravity)** | Asisten utama pengembangan – scaffolding fitur, debugging, refactoring kode, dan penulisan komponen. Terintegrasi langsung di IDE melalui extension. |
| **Cursor / Claude** | Digunakan untuk code review, penjelasan arsitektur, dan saran implementasi fitur real-time. |
| **GitHub Copilot** | Autocomplete kode saat menulis komponen React dan Prisma queries. |
---
## Struktur Project
```
akselerachatapp/
├── app/
│   ├── (auth)/          # Halaman login & register
│   ├── api/             # API Routes (Next.js)
│   │   ├── auth/        # NextAuth handler
│   │   ├── conversations/  # CRUD percakapan & pesan
│   │   ├── pusher/      # Pusher auth endpoint
│   │   └── users/       # Data pengguna
│   ├── chat/            # Halaman utama chat
│   ├── providers.tsx    # App-level providers (theme, session)
│   └── globals.css      # Global styles
├── components/          # Komponen UI reusable
├── lib/                 # Prisma client & helper functions
├── prisma/
│   ├── schema.prisma    # Definisi skema database
│   └── dev.db           # SQLite database (lokal)
├── public/              # Static assets
├── auth.ts              # Konfigurasi NextAuth
└── middleware.ts        # Route protection middleware
```
---
## Keamanan
- Password di-hash menggunakan **bcryptjs** sebelum disimpan ke database
- Route dilindungi oleh **NextAuth middleware** – pengguna tidak terautentikasi akan di-redirect ke halaman login
- Pusher channel menggunakan **private channel authentication** untuk mencegah akses tidak sah
