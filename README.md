# Separ Noavari Platform

## Project Structure
- client/: React 19 + Vite SPA with Ant Design, React Query, and i18n.
- server/: Express 4 API backed by MongoDB (Mongoose), Passport sessions, and multer uploads.

## Getting Started
1. Install dependencies for each workspace (npm install --prefix server and npm install --prefix client).
2. Copy environment files: cp server/.env.example server/.env and cp client/.env.development client/.env.
3. Configure the server .env with at least:
   - NODE_ENV (use development locally)
   - MONGO_URI (for example mongodb://localhost:27017/separnoavari)
   - SESSION_SECRET (long random string)
   - CLIENT_ORIGIN (comma-separated SPA origins)
   - UPLOAD_DIR (defaults to server/uploads/ideas, do not rename)
4. Start the API with npm run dev --prefix server.
5. Start the SPA with npm run dev --prefix client and open http://127.0.0.1:5173 (Vite proxies /api to http://127.0.0.1:5501).

## Server Overview
- Express app with Helmet, rate limiting, CORS, compression, and Passport local auth.
- Sessions stored in MongoDB via connect-mongo.
- Multer writes uploads to server/uploads/ideas/<user-email>/...; naming stays backward compatible.
- Mongoose models cover User, Idea, Judge, Assignment, and Review.
- Controllers, middleware, services, and utilities live under server/src.

### Key NPM Scripts (run with --prefix server)
- npm run dev — start the API with nodemon.
- npm run start — production entry (node ./src/index.js).
- npm run migrate:sqlite-to-mongo — one-off migration from server/database.db into MongoDB.
- npm run test — Jest harness (currently placeholder tests).

## Migration Notes
Run npm run migrate:sqlite-to-mongo --prefix server once to migrate legacy SQLite data. The script copies users and ideas while preserving upload paths, flags non-bcrypt passwords (sets passwordHash = null) so those users must reset credentials, and creates judge profiles for users whose prior role was judge.

Before migrating, ensure MongoDB is running and empty, and back up server/database.db plus the entire server/uploads directory.

## API Highlights
- POST /api/auth/register — create user account.
- POST /api/auth/login and POST /api/auth/logout — manage sessions.
- POST /api/ideas — submit an idea with PDF/Word uploads.
- GET /api/ideas/mine — list the current user's submissions.
- GET /api/ideas/:id/files/:fileId — download original uploaded files.
- GET /api/admin/* — admin dashboards, judge management, bulk assignment (ADMIN only).
- GET /api/judge/ideas and POST /api/judge/reviews — judge assignment and scoring workflow.

Zod validates payloads and all errors return { ok, code, message } envelopes.

## Testing
npm run test --prefix server currently executes a skipped Supertest smoke test. Extend the suite with Mongo-backed integration tests (for example, via mongodb-memory-server).

## Upload Compatibility
The multer middleware keeps the original directory layout and filenames. Anything under server/uploads/ideas remains accessible without moving files.
