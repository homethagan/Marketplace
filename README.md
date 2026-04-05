# Agent Marketplace

Agent Marketplace is a full-stack web app where users can browse AI agents, hire one for a timed session, and chat in a workspace. The app includes JWT authentication, session billing logic, and a dashboard for active and past sessions.

## Tech Stack

- Frontend: React (Vite), React Router, Axios, TailwindCSS
- Backend: Node.js, Express, SQLite
- Auth & Security: JWT, bcryptjs
- AI Integration: MiniMax Chat Completion API

## Local Setup

1. Clone the repository and move into the project root.
2. Set up the server:
	- `cd server`
	- `npm install`
	- create `.env` from `.env.example`
3. Set up the client:
	- `cd ../client`
	- `npm install`

## MiniMax API Key Setup

1. Create or sign in to your MiniMax account.
2. Generate an API key from the MiniMax developer console.
3. Open `server/.env` and set:
	- `MINIMAX_API_KEY=your_real_key`
	- `MINIMAX_GROUP_ID=your_group_id`

Your `server/.env` should include:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
```

## Running the App

Start the backend:

```bash
cd server
node server.js
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` and server runs on `http://localhost:5000`.
"# Marketplace" 
