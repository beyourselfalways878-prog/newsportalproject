# 24x7 Indian News

A modern, Hindi-only news portal built with React and Vite, featuring real-time news updates, user authentication, and SEO optimizations. Designed for Indian audiences with a focus on breaking news, regional coverage, and in-depth analysis.

## 🌟 Features

- **Hindi-Only Content**: Fully localized for Hindi-speaking users with no English fallbacks.
- **Real-Time News**: Live updates from Supabase database with breaking news alerts.
- **User Authentication**: Secure login/signup via Supabase Auth.
- **Admin Dashboard**: Upload and edit articles, manage videos, and user roles.
- **SEO Optimized**: Includes ads.txt, robots.txt, sitemap.xml, and structured data for search engines.
- **Responsive Design**: Mobile-first UI with TailwindCSS and Radix UI components.
- **Performance Focused**: Lazy loading, code splitting, and optimized bundles.
- **Dark/Light Mode**: Theme toggle for better user experience.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite 5, TailwindCSS 4, Radix UI
- **Backend**: Supabase (Auth, Database, Storage)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Document Processing**: Mammoth.js for DOCX uploads
- **Deployment**: Ready for Vercel/Netlify or static hosting

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/beyourselfalways878-prog/newsportalproject.git
   cd newsportalproject
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and API keys:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment & Admin tools

- `npm run check:env` — Validates that required env vars are set and, if `SUPABASE_SERVICE_ROLE_KEY` is available, checks DB/table and storage bucket access.
- `npm run create:profile` — Helper script to create or upsert a `profiles` row for a given user id (edit the script args before running or call with `node scripts/create_profile.mjs --id=<USER_ID> --role=admin --name="Full Name"`).

> Note: For production, add `SUPABASE_SERVICE_ROLE_KEY` and `CREATE_PROFILE_SECRET` as project secrets in your hosting provider (do NOT commit service role keys to the repository).

## 📦 Build for Production

```bash
npm run build
npm run preview  # Preview the build locally
```

The `dist/` folder contains the production-ready files.

## 📖 Usage

- **Homepage**: Browse latest news, featured articles, and trending topics.
- **Categories**: Filter news by categories like Politics, Business, Sports, etc.
- **Articles**: Read full articles with related content and sharing options.
- **Admin Panel**: Log in as admin to upload/edit content (email: pushkarraj207@gmail.com).
- **Search**: Use the search bar for quick access to news.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Email**: divineink@24x7indiannews.online
- **Website**: [https://24x7indiannews.online](https://24x7indiannews.online)
- **GitHub**: [beyourselfalways878-prog](https://github.com/beyourselfalways878-prog)

---

Made with ❤️ for Indian news enthusiasts.