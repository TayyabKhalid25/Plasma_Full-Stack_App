# Plasma_Full-Stack_App
Created by Wahaj, Saad, Ibrahim and I, Plasma acts as a specialized "Second Screen" web application that aggregates a user's entire gaming identity, both automatic (Steam) and manual (everything else), into a rich, community-focused social hub. 

## [Plasma Figma Design Link](https://www.figma.com/design/46jGV38kP26hGm0blEZoyh/Plasma?node-id=15-33&t=fR8LKhfQBYdGhBHZ-1)

## Environment Variables

This project uses environment variables for configuration. Copy the example files and fill in your actual values:

- `client/.env.example` → `client/.env.local`
- `server/.env.example` → `server/.env`

### Client (Next.js)
- `NEXT_PUBLIC_API_URL`: URL of the backend API
- Other variables as needed for authentication, analytics, etc.

### Server (Node.js)
- `PORT`: Port for the server (default: 5000)
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret key for JWT tokens
- API keys for external services

**Important:** Never commit actual `.env` files to version control. They are ignored via `.gitignore`.