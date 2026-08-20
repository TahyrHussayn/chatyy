# Chatyy 💬

A modern, ultra-lightweight, real-time ephemeral chat application and self-destructing secret vault built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, **Bun**, and **Vercel KV**.

---

## 🚀 Features

- **🔒 Stealth Lock**: Invisible keyboard tracking lock screen with zero input fields, smooth cross-fade unblurring, and session persistence.
- **⚡ Ephemeral Live Chat**: 100% in-memory real-time broadcasting via **Server-Sent Events (SSE)**. Zero historical message replay on refresh or incognito.
- **🔐 Secret Vault (`/secret`)**: Self-destructing messages with customizable TTL timers (30s, 5m, 1h, 24h, or View-Once) backed by **Vercel KV / Redis**.
- **🔊 Tactile Audio**: Crisp, 0ms latency procedural Web Audio sound synthesizer with idle auto-suspension (0.0% background CPU).
- **🎨 Frosted Glass UI**: Responsive glassmorphism interface with native OS system typography and custom scrollbars.
- **📱 PWA & OpenGraph**: Dynamic 1200×630 social preview card generator, `manifest.json` for home-screen installation, and `robots.txt` crawler protection for private secret URLs.
- **⚡ Ultra-Optimized**: 0 background polling loops, component-level memoization, and sub-second builds.

---

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment (Optional)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set your stealth lock password:
```env
CHAT_PASSWORD=your_secret_password
```

### 3. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `CHAT_PASSWORD` | Secret password to unlock the stealth lock (Server-side, private) | Unlocked if empty |
| `NEXT_PUBLIC_APP_URL` | Public production domain (used for SEO & OpenGraph) | `VERCEL_URL` / `localhost:3000` |
| `KV_REST_API_URL` | Vercel KV REST API URL (for `/secret` vault) | In-memory fallback |
| `KV_REST_API_TOKEN` | Vercel KV REST API Token | In-memory fallback |

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. (Optional for persistent vault) In your project dashboard, navigate to **Storage** $\rightarrow$ **Create Database** $\rightarrow$ **KV** and connect it to your project.
4. Add `CHAT_PASSWORD` in **Settings** $\rightarrow$ **Environment Variables**.
5. Deploy!

---

## 🧹 Code Quality & Scripts

```bash
# Format code
bun run format

# Run linter checks
bun run lint

# Production build
bun run build
```
