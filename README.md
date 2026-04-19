# 🎓 Placement Predictor AI

Full-stack placement prediction system with FastAPI backend, React frontend, and MongoDB Atlas.

---

## 📁 Project Structure

```
placement-predictor/
├── backend/
│   ├── main.py                 ← FastAPI app entry point
│   ├── database.py             ← MongoDB connection
│   ├── config.py               ← Settings / env vars
│   ├── requirements.txt        ← Python packages
│   ├── render.yaml             ← Render deployment config
│   ├── .env.example            ← Copy this to .env
│   ├── routes/
│   │   ├── auth.py             ← Register / Login / JWT
│   │   └── predict.py          ← Single & Bulk prediction
│   ├── utils/
│   │   └── auth_utils.py       ← Password hashing, JWT
│   └── ml_models/
│       ├── model.pkl           ← Trained RandomForest
│       ├── scaler.pkl          ← StandardScaler
│       └── feature_columns.pkl ← Feature names
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── netlify.toml            ← Netlify SPA redirect
    ├── .env.example            ← Copy this to .env
    └── src/
        ├── App.jsx             ← Routing
        ├── main.jsx
        ├── index.css           ← Global styles
        ├── utils/api.js        ← Axios with JWT interceptor
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx   ← Predict + Charts
            ├── BulkUpload.jsx  ← CSV upload
            └── History.jsx     ← Past predictions
```

---

## 🚀 Step-by-Step Setup

### Step 1 — MongoDB Atlas (Free)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a **free cluster** (M0)
3. Create a database user: Security → Database Access → Add New Database User
4. Whitelist all IPs: Security → Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)
5. Get your connection string: Clusters → Connect → Drivers → Copy the URI
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

---

### Step 2 — Run Backend Locally

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Open .env and fill in your MONGO_URL and a random JWT_SECRET

# Start server
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

---

### Step 3 — Run Frontend Locally

```bash
cd frontend

# Install packages
npm install

# Create .env file
cp .env.example .env
# VITE_API_URL=http://localhost:8000   ← for local development

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:3000

---

### Step 4 — Deploy Backend to Render (Free)

1. Push your project to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set these settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `MONGO_URL` → your MongoDB Atlas URI
   - `JWT_SECRET` → any long random string (e.g. `mysupersecretkey123abc`)
   - `DB_NAME` → `placement_db`
6. Click Deploy

Your backend URL will be: `https://your-service.onrender.com`

---

### Step 5 — Deploy Frontend to Netlify (Free)

1. Go to https://netlify.com → Add New Site → Import from Git
2. Connect GitHub repo
3. Set these settings:
   - **Base directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add Environment Variable:
   - `VITE_API_URL` → your Render backend URL (e.g. `https://your-service.onrender.com`)
5. Click Deploy

---

## 📄 Bulk Upload CSV Format

Your CSV must have exactly these column names:

```
CGPA,Internships,Aptitude_Test_Score,Soft_Skills_Rating,Projects
7.5,2,75,7,3
8.1,3,85,8,4
6.2,1,50,5,1
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/predict/single` | Predict one student |
| POST | `/api/predict/bulk` | Predict from CSV |
| GET | `/api/predict/history` | Past predictions |
| GET | `/health` | Health check |

Visit `/docs` on your backend for full interactive API documentation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas + Motor (async) |
| Auth | JWT tokens + bcrypt |
| ML Model | RandomForestClassifier (scikit-learn) |
| Frontend | React + Vite |
| Charts | Recharts |
| Deployment | Render (backend) + Netlify (frontend) |

---

Built with ❤️ by Sneha | Final Year Project
