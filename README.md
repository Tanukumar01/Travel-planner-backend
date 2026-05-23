# Travel-Planner

A MERN-based travel planning app where users can upload booking documents, extract useful trip details, generate an AI-powered itinerary, save history, and share itineraries with a public link.

## Stack

- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Multer
- Frontend: React, TypeScript, Vite, React Router
- AI/Data extraction: OpenAI-compatible API for richer extraction and itinerary generation, with PDF parsing and fallback heuristics when no API key is present

## Features

- JWT authentication with register, login, and profile lookup
- Travel document uploads for PDF and image files
- Booking detail extraction from uploaded documents
- AI-assisted itinerary generation
- MongoDB storage for generated itinerary history
- Shareable public itinerary pages
- Responsive React dashboard with drag-and-drop upload

## Project Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
Frontend/
  src/
    components/
    context/
    lib/
    pages/
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=5001
CLIENT_URL=http://localhost:5173
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=optional_but_recommended
OPENAI_MODEL=gpt-4.1-mini
```

## Run Locally

Install dependencies:

```bash
npm install
npm --prefix Frontend install
```

Start backend and frontend together:

```bash
npm run dev
```

Frontend:

- `http://localhost:5173`

Backend:

- `http://localhost:5001`

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/bookings/upload`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `POST /api/bookings/:id/share`
- `GET /api/bookings/share/:shareId`

## Notes

- PDF extraction works without an AI key for text-based PDFs.
- Image extraction and better itinerary quality work best when `OPENAI_API_KEY` is configured.
- Uploaded files are stored locally in the `uploads/` directory.
