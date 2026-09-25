# System Omni: AI-Powered Freelance CRM 🚀

An enterprise-grade, automated client acquisition system designed for freelance web developers. System Omni runs silently in the background, automatically hunting for high-value web development projects across the internet and generating highly customized AI pricing strategies to help you close deals faster.

---

## ✨ Features

- **🌐 The Omni-Cron Aggregator**: A background Node.js engine that automatically scrapes global freelance platforms (Upwork, Freelancer, etc.) and social media (Twitter, Reddit) every 5 minutes.
- **📍 Google Maps "Drip" Engine**: Dynamically scans local businesses in your region, audits their websites, and flags high-priority targets that have `NO_WEBSITE` or are `NOT_MOBILE_FRIENDLY`.
- **🤖 True AI Intelligence**: Integrated with **Google Gemini 1.5 Flash**. Click on any lead to instantly generate a custom project scope and a mathematically calculated pricing strategy.
- **🗂️ Drag-and-Drop Kanban CRM**: Effortlessly track your leads from "Queued" to "Pitched" to "Won" using a seamless HTML5 drag-and-drop pipeline.
- **💎 Premium Glassmorphism UI**: A sleek, dark-mode dashboard built with Tailwind CSS v4, featuring live metrics, glowing accents, and blurred paneling (Vercel/Linear aesthetic).

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite + [Prisma ORM](https://www.prisma.io/)
- **AI Brain:** Google Gemini SDK (`@google/generative-ai`)
- **Icons:** Lucide React

---

## 🚀 Getting Started

Follow these steps to run the Omni-System on your local machine:

### 1. Clone the repository
```bash
git clone https://github.com/naviixraj/system-omni.git
cd freelance-crm
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your free Google Gemini API key:
```env
GEMINI_API_KEY=your_google_api_key_here
```

### 4. Initialize the Database
Push the Prisma schema to generate the local SQLite database (`dev.db`):
```bash
npx prisma db push
```

### 5. Start the Engines
You need to run two commands in separate terminal windows.

**Terminal 1 (The UI):**
```bash
npm run dev
```
**Terminal 2 (The Background Scraper):**
```bash
node cron-runner.js
```

### 6. Hunt Leads
Open [http://localhost:3000](http://localhost:3000) in your browser. Wait a few minutes for the Omni-Cron to populate your database with fresh global and local leads, then click on them to generate AI pitches!

---

## 📝 License
This project was custom-built as a Minimum Viable Product (MVP) for automating freelance web development lead generation.
