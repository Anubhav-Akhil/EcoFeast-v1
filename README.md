# EcoFeast Fullstack

EcoFeast is now wired as a fullstack application:
- `frontend`: React + Vite
- `backend`: Express + file-based JSON database
- `auth`: JWT-based login/signup
- `ai`: Gemini calls are proxied through backend routes

## 1. Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in project root:

```env
PORT=8787
JWT_SECRET=replace-with-a-strong-random-secret
GEMINI_API_KEY=your_gemini_key_optional
FRONTEND_ORIGIN=http://localhost:5173
```

Optional frontend override:

```env
VITE_API_BASE_URL=/api
```

## 2. Run Locally

Run backend + frontend together:

```bash
npm run dev:full
```

Or run separately:

```bash
npm run dev:backend
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8787`

## 3. Core API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/items`
- `POST /api/items`
- `DELETE /api/items/:id`
- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/charities`
- `GET /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/ai/predict-expiry`
- `POST /api/ai/suggest-recipe`
- `POST /api/contact`

## 4. Deployment Notes

- Deploy frontend and backend as separate services, or serve built frontend from backend with `SERVE_STATIC=true`.
- Keep `JWT_SECRET` and `GEMINI_API_KEY` only on backend.
- Persist `backend/data/ecofeast.json` using a volume/disk in production.
