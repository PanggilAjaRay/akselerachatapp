# Akselera Chat App

Akselera Chat App adalah platform komunikasi real-time yang dirancang untuk memberikan pengalaman bertukar pesan yang cepat, aman, dan efisien.

# Tech Stack & Infrastruktur

### Frontend
* **[Contoh: React.js / Next.js]**: Dipilih karena kemampuannya membangun UI yang interaktif dan responsif, serta ekosistem yang luas untuk pengembangan aplikasi modern.
* **[Contoh: Tailwind CSS]**: Mempercepat proses *styling* UI dengan pendekatan *utility-first* tanpa perlu menulis CSS dari nol.

### Backend
* **[Contoh: Node.js & Express]**: Sangat ideal untuk menangani aplikasi real-time yang membutuhkan banyak koneksi jaringan konkuren (I/O non-blocking).
* **[Contoh: Socket.io]**: Digunakan untuk menangani komunikasi WebSockets dua arah secara real-time antara klien (pengguna) dan server (pesan langsung masuk tanpa perlu *refresh*).

### Database & Infrastruktur
* **[Contoh: PostgreSQL / MongoDB]**: Database andal untuk menyimpan data pengguna, room chat, dan riwayat pesan secara aman.
* **[Contoh: Vercel / Railway / Heroku]**: Platform *cloud* yang dipilih untuk proses *deployment* yang cepat dan CI/CD yang terintegrasi.

## AI Tools yang Dipakai

* **[Contoh: OpenAI GPT / Gemini API]**: Diintegrasikan untuk memberikan fitur cerdas pada aplikasi chat, seperti [sebutkan fitur: balasan otomatis / ringkasan obrolan / chatbot assistant].
* **[Contoh: GitHub Copilot / ChatGPT]**: Membantu *developer* dalam mempercepat penulisan kode, memberikan saran arsitektur, dan *debugging* selama proses pengembangan.

## Struktur Tabel (Database Schema)

Berikut adalah gambaran relasi dan struktur tabel utama yang digunakan pada sistem ini:

**1. Tabel `users`** (Menyimpan data akun pengguna)
* `id` (Primary Key)
* `username` (String, Unique)
* `email` (String, Unique)
* `password` (String, Hashed)
* `created_at` (Timestamp)

**2. Tabel `rooms` / `chats`** (Menyimpan sesi obrolan)
* `id` (Primary Key)
* `name` (String, Nullable untuk *direct message*)
* `is_group` (Boolean)
* `created_at` (Timestamp)

**3. Tabel `messages`** (Menyimpan riwayat chat)
* `id` (Primary Key)
* `room_id` (Foreign Key ke tabel `rooms`)
* `sender_id` (Foreign Key ke tabel `users`)
* `content` (Text)
* `created_at` (Timestamp)

## Cara Menjalankan

Ikuti langkah-langkah berikut


### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/PanggilAjaRay/akselerachatapp.git
   cd akselerachatapp
   ```

2. **Install Dependensi**
   Jika proyek dipisah menjadi frontend dan backend:
   ```bash
   # Setup Backend
   cd backend
   npm install

   # Setup Frontend
   cd ../frontend
   npm install
   ```

3. **Setup Environment Variables**
   Salin file `.env.example` menjadi `.env` di masing-masing direktori dan isi dengan kredensial lokal Anda.
   ```env
   # Contoh .env
   PORT=5000
   DATABASE_URL=your_database_connection_string
   AI_API_KEY=your_api_key_here
   ```

4. **Jalankan Aplikasi**
   Buka dua terminal terpisah untuk menjalankan *client* dan *server* secara bersamaan:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

5. Akses aplikasi melalui `http://localhost:3000` di browser Anda!