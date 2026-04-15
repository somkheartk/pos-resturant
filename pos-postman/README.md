# POS Postman Project

Separate Postman workspace for the POS monorepo.

## Files

- `pos-monorepo.postman_collection.json` - main collection
- `pos-local.postman_environment.json` - local environment variables
- `api-summary.md` - page-by-page API summary with sample data

## Default local URLs

- Backend: `http://localhost:3000/api/v1`
- Web: `http://localhost:3010`

## Quick start

1. Import the collection JSON into Postman.
2. Import the local environment JSON.
3. Run the login request first.
4. The test script will save `accessToken` into the environment automatically.
5. Use the backend folders directly for API testing.

## Default login for local backend

- Email: `admin@pos.local`
- Password: `123456`

## Notes

- Web routes under `/api/*` require an active NextAuth session cookie, so they are mainly for page mapping and browser-side verification.
- Backend routes under `/api/v1/*` are the main endpoints for Postman usage.
