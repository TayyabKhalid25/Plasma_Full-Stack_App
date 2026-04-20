# Plasma_Full-Stack_App
Created by Wahaj, Saad, Ibrahim and I, Plasma acts as a specialized "Second Screen" web application that aggregates a user's entire gaming identity, both automatic (Steam) and manual (everything else), into a rich, community-focused social hub. 

## [Plasma Figma Design Link](https://www.figma.com/design/46jGV38kP26hGm0blEZoyh/Plasma?node-id=15-33&t=fR8LKhfQBYdGhBHZ-1)

## Getting Started

### Prerequisites
- Node.js installed

### Running Locally

From the **root** of the repository:

**Step 1 — Install all dependencies** (run once, or after adding new packages):

```bash
npm run install:all
```

This installs dependencies for both the `client/` and `server/` folders.

**Step 2 — Start both services:**

```bash
npm run dev
```

This starts both the client and server in parallel using [`concurrently`](https://github.com/open-cli-tools/concurrently):

| Service | Command | Default URL |
|---------|---------|-------------|
| **Client** (Next.js) | `npm run dev --prefix client` | `http://localhost:3000` |
| **Server** (Node.js / nodemon) | `npm run dev --prefix server` | `http://localhost:5000` |

> Make sure you've set up your `.env` files (see below) before running.

---

## Environment Variables

This project uses environment variables for configuration.

### Manual Setup
Copy the example files and fill in your actual values:

- `client/.env.example` → `client/.env.local`
- `server/.env.example` → `server/.env`

### Automated Setup (Secrets Vault)
The server environment variables can be managed using the built-in vault system, which uses `server/secrets.enc` to securely store configuration.

To automatically create your `.env` file from the encrypted secrets:
```bash
npm run decrypt --prefix server
```

To update the encrypted secrets with your current `.env` values:
```bash
npm run encrypt --prefix server
```


### Client (Next.js)
- `NEXT_PUBLIC_API_URL`: URL of the backend API
- Other variables as needed for authentication, analytics, etc.

### Server (Node.js)
- `PORT`: Port for the server (default: 5000)
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret key for JWT tokens
- API keys for external services

**Important:** Never commit actual `.env` files to version control. They are ignored via `.gitignore`.

---

## Legal & License

For information on terms of service, privacy policies, and licensing, please see:
- [LEGAL.md](LEGAL.md)
- [LICENSE](LICENSE)