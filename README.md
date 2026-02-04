# 24x7 Indian News

A modern, Hindi-only news portal built with React and Vite, featuring real-time news updates, user authentication, and SEO optimizations. Designed for Indian audiences with a focus on breaking news, regional coverage, and in-depth analysis.

**🚀 Status**: Recently migrated from Supabase to Neon serverless PostgreSQL. See [MIGRATION_STATUS.md](MIGRATION_STATUS.md) for details.

## 🌟 Features

- **Hindi-Only Content**: Fully localized for Hindi-speaking users with no English fallbacks.
- **Real-Time News**: Live updates from Neon PostgreSQL database with breaking news alerts.
- **User Authentication**: Secure JWT-based authentication system.
- **Admin Dashboard**: Upload and edit articles, manage videos, and user roles.
- **Smart Article Uploader**: Auto-extract fields from DOCX, AI-powered suggestions, real-time SEO scoring.
- **Video Management**: Upload, preview, and manage videos with progress tracking.
- **SEO Optimized**: Includes ads.txt, robots.txt, sitemap.xml, and structured data for search engines.
- **Responsive Design**: Mobile-first UI with TailwindCSS and Radix UI components.
- **Performance Focused**: Lazy loading, code splitting, and optimized bundles.
- **Dark/Light Mode**: Theme toggle for better user experience.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite 5, TailwindCSS 4, Radix UI
- **Backend**: Neon serverless PostgreSQL with JWT authentication
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Document Processing**: Mammoth.js for DOCX uploads
- **Authentication**: JWT tokens with secure password hashing
- **Deployment**: Ready for Vercel/Netlify or static hosting

## 🚀 Installation

### Quick Start (10 minutes)

For a complete setup guide, see [QUICK_START.md](QUICK_START.md).

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
   - Add your Neon database connection string:
     ```
     DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
     VITE_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     OPENAI_API_KEY=your-openai-key
     CRICKETDATA_API_KEY=your-cricketdata-key
     ```

4. **Initialize database** (if not already done):
   ```bash
   psql "your-neon-connection-string" < DATABASE_SCHEMA.sql
   ```

5. **Run locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

6. **Sign in with admin credentials**:
   - Email: `admin@example.com`
   - Password: `admin`

### Migration from Supabase

If you're migrating from Supabase, see [DATA_MIGRATION_GUIDE.md](DATA_MIGRATION_GUIDE.md) for detailed instructions.

### Environment & Admin Tools

- `npm run check:env` — Validates that required env vars are set and checks database access.
- `npm run create:profile` — Helper script to create or upsert a user profile.

> **Security Note**: For production, change `JWT_SECRET` to a strong random value and store sensitive keys in your hosting provider's secrets (do NOT commit to repository).

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
- **Admin Panel**: Log in as admin to upload/edit content.
- **Search**: Use the search bar for quick access to news.

## 📚 Documentation

### Getting Started
- [QUICK_START.md](QUICK_START.md) - Get started in 10 minutes
- [DEVELOPER_QUICK_REFERENCE.md](DEVELOPER_QUICK_REFERENCE.md) - Quick reference for developers

### Migration & Setup
- [NEON_MIGRATION_README.md](NEON_MIGRATION_README.md) - Migration overview
- [DATA_MIGRATION_GUIDE.md](DATA_MIGRATION_GUIDE.md) - Data migration instructions
- [MIGRATION_STATUS.md](MIGRATION_STATUS.md) - Current migration status
- [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql) - Database schema

### Features & Improvements
- [ARTICLE_UPLOADER_IMPROVEMENTS.md](ARTICLE_UPLOADER_IMPROVEMENTS.md) - Smart uploader features
- [UPLOADER_QUICK_REFERENCE.md](UPLOADER_QUICK_REFERENCE.md) - Uploader quick reference
- [UPLOADER_VISUAL_GUIDE.md](UPLOADER_VISUAL_GUIDE.md) - Visual guide for uploaders

### Testing & Verification
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Comprehensive testing procedures

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