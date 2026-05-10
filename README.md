# AI-Powered-Interview-Preparation-Platform
AI-powered interview preparation platform that generates technical questions, behavioral questions, skill gap analysis, preparation roadmap, and ATS-friendly resumes using Gemini AI.

# 🚀 Features

- 🔐 JWT Authentication
- 📄 Resume PDF Upload & Parsing
- 🤖 AI Generated Interview Reports
- 💡 Technical & Behavioral Questions
- 📊 Skill Gap Analysis
- 🛣️ Personalized Preparation Roadmap
- 📑 ATS Friendly Resume Generator
- ☁️ Full Stack Deployment
- 📱 Responsive UI

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Vite
- SCSS
- Axios
- React Router

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer

## AI Integration
- Gemini API

## Deployment
- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas

---

# 📂 Project Structure

```bash
AI-Powered-Interview-Preparation-Platform/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middlewares/
│   │   └── config/
│   │
│   └── package.json
│
└── README.md


⚙️ Environment Variables

Create .env file inside backend folder.
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

📦 Installation
Clone Repository
git clone https://github.com/your-username/AI-Powered-Interview-Preparation-Platform.git

Frontend Setup:-
cd frontend
npm install
npm run dev

Backend Setup:-
cd backend
npm install
npm run dev


🌐 Deployment
Frontend
Deploy using:
Vercel-

Backend
Deploy using:
Render

Database
Use:
MongoDB Atlas

🔥 API Endpoints

Authentication
Method	Endpoint	Description
POST	/api/auth/register	Register User
POST	/api/auth/login	Login User
GET	/api/auth/get-me	Get Current User
POST	/api/auth/logout	Logout User

Interview
Method	Endpoint	Description
POST	/api/interview/	Generate Interview Report
GET	/api/interview/	Get All Reports
GET	/api/interview/report/:id	Get Single Report
POST	/api/interview/resume/pdf/:id	Generate Resume PDF
