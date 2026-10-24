# PolicySnap

PWA *crowdsourcing* evaluasi kebijakan publik: warga menilai isu dengan 4 dimensi (Efektivitas, Efisiensi, Keadilan, Responsivitas), menggeser kartu aktor, memberi argumen ber-*upvote*, dan naik level lewat gamifikasi kucing 2D. Spesifikasi lengkap ada di [PS.prd](PS.prd).

## Stack

- Next.js 16 (App Router) + React 19, TypeScript
- Supabase (PostgreSQL + trigger XP) — atau file JSON lokal untuk development
- Sesi server: cookie HttpOnly bertanda tangan HMAC (`src/lib/auth/session.ts`)

## Menjalankan

```bash
npm install
cp .env.example .env   # isi nilainya, lihat tabel di bawah
npm run dev            # http://localhost:3000
```

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Klien Supabase di browser (login Google) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Semua penulisan data lewat API server. Tanpa ini server memakai JSON lokal di `src/data/` |
| `AUTH_SECRET` | Production | ≥ 32 karakter (`openssl rand -hex 32`). Di development dibuat sementara bila kosong |
| `ADMIN_PASSWORD` | Ya, untuk `/admin` | Password admin (diverifikasi server). `ADMIN_EMAIL`/`ADMIN_USERNAME` opsional |
| `DEEPSEEK_API_KEY` | Opsional | AI Auto-Pilot ekstraksi berita di panel admin |
| `ALLOW_DEV_LOGIN` | Opsional | `true` untuk mengizinkan login persona dev di production |

## Database

Database baru: jalankan [supabase/schema.sql](supabase/schema.sql) di Supabase SQL Editor.
Database lama: jalankan migrasi di [supabase/migrations/](supabase/migrations/) secara berurutan.

## Struktur

```
src/
  app/                 halaman (App Router) & API route (app/api/*)
    <halaman>/_components/   komponen khusus halaman itu (evaluate, admin)
  components/          komponen UI bersama (CatAvatar + cat/, Toast, RadarChart, …)
  hooks/               useToast, useCurrentUserId, useHydrated
  lib/                 service sisi server (profile/evaluation/argument), auth/, util bersama
                       (scoring.ts, stance.ts, validation.ts, safeFetch.ts)
  domain/, data/, presentation/   lapisan auth sisi client (use case → repository → context)
supabase/              schema & migrasi
```

Aturan penting:

- **Identitas user selalu dari sesi server** (`requireUser()` / `getSessionUser()`), bukan dari body/query request.
- **Satu sumber data**: Supabase bila dikonfigurasi, selain itu JSON lokal — tidak ada fallback diam-diam.
- XP & level dihitung trigger database (mode Supabase) atau `applyLocalStats` (mode lokal), tidak pernah dari client.

## Skrip

```bash
npm run lint   # ESLint
npx tsc --noEmit
npm run build
```
