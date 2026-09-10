# Whole Living Map / Seb's Life

This project was created with Shipper.

## Multi-user setup

The app uses Supabase Auth, Postgres and Row Level Security so every user gets a private, empty dashboard.

1. Create a Supabase project.
2. Run `supabase/migrations/202609100001_multi_user_foundation.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` and add the project URL and public anon key.
4. Add the local and Vercel URLs to Supabase Auth's allowed redirect URLs.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel.

Never put service-role keys, Google secrets, health tokens or Open Banking credentials in variables prefixed with `VITE_`; browser code can read them. Provider secrets must stay in server-side functions.

## 🚀 Tech Stack

- **Framework:** React
- **Package Manager:** bun

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [bun](https://www.npmjs.com/package/bun)

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Run the Development Server

```bash
bun dev
```

The application will start and display the local URL in your terminal.

## 📜 Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun lint` - Run linter

## 🏗️ Building for Production

```bash
bun build
```

## 📚 Learn More

- [React Documentation](https://react.dev)
- [React Tutorial](https://react.dev/learn)
- [React GitHub](https://github.com/facebook/react)
## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using [Shipper](https://shipper.now)
