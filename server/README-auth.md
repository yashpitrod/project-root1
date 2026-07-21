# CampusCare Authentication Setup

## Required environment variables

Create a .env file in the server folder with:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
ALLOWED_DOCTOR_EMAILS=doctor@example.com

FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_CLIENT_CERT_URL=...
```

## Install and run

```bash
cd server
npm install
npm run dev
```

## Verify authentication pipeline

```bash
cd server
node scripts/verify-auth.js
```

## Manual browser test

1. Start the server and client.
2. Open the login page.
3. Use the email/password sign-in flow and confirm the backend creates/updates the Mongo user.
4. Use the Google button and confirm the same user record is updated.
5. Open the MongoDB Atlas collection and verify that the user is not duplicated.
