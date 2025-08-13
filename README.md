# 📊 SinyalKu Dashboard

SinyalKu Dashboard is a web-based application designed to visualize and monitor signal strength data from various sources.  
The dashboard provides an interactive map interface, analytics, and filtering features to help users understand signal quality distribution in different areas.

⚠ **Note**: This project is still **under development**, and features or structure may change in future releases.

---

## 🚀 Features (Planned & In Progress)
- Interactive map with signal coverage visualization.
- Filter by country, region, or network provider.
- Display best signal in global view or within a selected country.
- Responsive and user-friendly UI.
- Data integration with backend API for live updates.

---

## 🛠 Tech Stack
- **Frontend Framework:** React + TypeScript  
- **Map Library:** React Leaflet  
- **Build Tool:** Vite  
- **Styling:** CSS / Tailwind (if used)  
- **Data Fetching:** Axios (REST API)

---

## 📂 Project Structure
```
Dashboard/
│   ├── src/                # Source code
│   │   ├── App.tsx         # Main App component
│   │   ├── main.tsx        # Entry point
│   │   ├── global.d.ts     # Type declarations
│   │   └── index.css       # Global styles
│   ├── .env.example        # Template for environment variables
│   ├── eslint.config.js    # ESLint configuration
│   ├── index.html          # HTML entry point
│   ├── package.json        # Dependencies and scripts
│   ├── package-lock.json   # Dependency lock file
│   ├── tsconfig.json       # TypeScript config
│   ├── tsconfig.app.json   # App-specific TS config
│   ├── tsconfig.node.json  # Node-specific TS config
│   └── vite.config.ts      # Vite build config
```

---

## 📦 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/sinyalku-dashboard.git
cd dashboard
```

### 2️⃣ Install Dependencies
Make sure you have **Node.js** (v18 or newer recommended) and **npm** or **yarn** installed.  
Then, install dependencies:
```bash
npm install
# or
yarn install
```

### 3️⃣ Configure Environment Variables
Create a `.env.development` file for local development based on `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

⚠ **Important:**  
Do **NOT** commit `.env.production` or `.env.development` to GitHub. They may contain sensitive data.  
Instead, store production variables securely in your deployment platform (Netlify).

---

## ▶ Running the Project

### Development Mode
```bash
npm run dev
# or
yarn dev
```
The application will be available at [http://localhost:5173](http://localhost:5173) (default Vite port).

### Production Build
```bash
npm run build
```
This will generate the production-ready files in the `dist` folder.

To preview the production build locally:
```bash
npm run preview
```

---

## 🌐 Deployment to Netlify

1. **Push your code to GitHub** (without `.env.*` files).  
2. On [Netlify](https://www.netlify.com/), create a **New Site from Git** and connect your repository.  
3. In **Site settings → Build & deploy → Environment variables**, add your production variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```
4. Set **Build command**:  
   ```bash
   npm run build
   ```
5. Set **Publish directory**:  
   ```bash
   dist
   ```
6. Deploy 🚀

---

## 📌 Status
**Current Phase:** Development  
- Core map features under construction  
- API integration in progress  
- UI and filtering system in testing

---

## 📜 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
