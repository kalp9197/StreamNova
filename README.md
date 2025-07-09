# StreamNova 🎬  

StreamNova is a powerful full-stack web application for browsing and discovering movies and TV shows. Built using **React (Vite), Node.js, Express, MongoDB, and TailwindCSS**, it features user authentication, search functionality, search history, and a modern, responsive UI. Users can stream almost any new movie or series for free.  

# **🚀 Live Site**  
# 🌐 **[StreamNova - Watch Movies & TV Shows](https://streamnova.onrender.com)**  


## 🚀 Features  
- 🔐 **User Authentication** (JWT-based secure login & signup)  
- 🎥 **Browse Movies & TV Shows** (Protected Routes)  
- 🔍 **Search & Search History** for Movies/TV Shows  
- 🔗 **Stream Almost Any New Movie/Series Free**  
- 🍪 **Secure Sessions with Cookies**  
- 🌐 **HTTPS Endpoint (Runs on localhost:8000)**  
- 📱 **Responsive & Good-Looking UI with TailwindCSS**  

## 🛠 Tech Stack  
- **Frontend:** React (Vite) + TailwindCSS  
- **Backend:** Node.js + Express.js  
- **Database:** Supabase (PostgreSQL)  
- **Authentication:** JWT & Cookies  
- **API:** UsesTMDB api and external movie APIs for db  

## 📌 Installation  

### 1️⃣ Clone the repository  
```sh
git clone https://github.com/kalp9197/StreamNova.git
cd StreamNova

### 2️⃣ Install dependencies:(in root directory)
```sh
npm run build
npm run dev
```

### 3️⃣ Set up environment variables
Click the "Connect to Supabase" button in the top right, then the environment variables will be automatically configured. You can also manually create a `.env` file in the root directory and add:
```env
PORT=8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_secret_key
NODE_ENV=development
TMDB_API_KEY=your_tmdb_api_key
```

## 🔗 API Endpoints
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | /api/v1/auth/signup | Register a new user |
| POST   | /api/v1/auth/login  | Login user          |
| GET    | /api/v1/movie       | Get movies          |
| GET    | /api/v1/tv          | Get TV shows        |
| GET    | /api/v1/search      | Search content      |

## 📷 Screenshots
🚀 Coming soon!

## 🤝 Contributing
Feel free to submit issues and pull requests!

---
Made with ❤️ by [Kalp Patel](https://github.com/kalp9197)

