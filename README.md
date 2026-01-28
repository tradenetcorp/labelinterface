# Label App

Audio labeling application built with React Router and custom email-OTP authentication.

## Tech Stack

- **Framework**: React Router v7
- **Authentication**: Custom email-OTP with cookie sessions
- **Database**: PostgreSQL (via Prisma)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, pnpm, yarn, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd labelapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy the docker-friendly env file, then customize as needed:

```bash
cp .env.docker .env
```

Or create a `.env` file in the root directory with the following:

```env
# Database
DATABASE_URL="postgresql://labelapp:labelapp@localhost:5432/labelapp?schema=public"

# Session
SESSION_SECRET="change-this-to-a-random-string-in-production"

# SMTP Configuration for Email OTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Admin User
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="email"
```

**Important**: 
- Generate a secure random string for `SESSION_SECRET` (e.g., use `openssl rand -base64 32`)
- For Gmail, you'll need to create an App Password: https://support.google.com/accounts/answer/185833
- In development, if SMTP is not configured, OTP codes will be logged to the console

4. Start PostgreSQL (Docker):
```bash
docker compose up -d postgres
```

5. Set up the database:
```bash
# Run migrations
npx prisma migrate dev

# Seed initial admin user
npx prisma db seed
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Docker PostgreSQL Notes

- Data persists in `docker/postgres-data/` (ignored by git)
- To stop the DB: `docker compose down`

### Authentication Flow

1. **Login**: Users enter their email address at `/login`
2. **OTP**: A 6-digit code is sent to their email (or logged to console in dev)
3. **Verify**: Users enter the code at `/verify`
4. **Session**: On successful verification, a session is created and the user is logged in

### Admin Panel

Admin users can access the user management panel at `/admin/users` to:
- View all users
- Create new users
- Update user information (name, role, active status)
- Deactivate users (soft delete)

### Building for Production

```bash
npm run build
npm start
```

## Database Management

- **Migrations**: `npx prisma migrate dev`
- **Studio**: `npx prisma studio` (visual database browser)
- **Seed**: `npx prisma db seed` (creates initial admin user)

admin@mindco.mv
password:email

## Project Structure

```
app/
  lib/
    auth.server.ts      # Authentication utilities
    session.server.ts   # Session management
    otp.server.ts       # OTP generation/verification
    email.server.ts      # Email sending
  routes/
    login.tsx           # Login page (email input)
    verify.tsx          # OTP verification page
    logout.tsx          # Logout handler
    home.tsx            # Protected home page
    admin/
      users.tsx         # Admin user management
prisma/
  schema.prisma         # Database schema
  seed.ts              # Database seed script
scripts/
  asr_scripts/          # ASR and audio processing scripts
```

## Scripts

Python scripts for ASR (Automatic Speech Recognition) and audio processing are located in the `scripts/` directory.

### Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Setup

```bash
cd scripts
uv sync
```

### Available Scripts

**pyannotesplit.py** - Speaker diarization using pyannote.audio
```bash
cd scripts
uv run python asr_scripts/pyannotesplit.py
```
Requires `HF_TOKEN` environment variable for Hugging Face authentication.

**omniasr.py** - Batch ASR transcription
```bash
cd scripts
uv run python asr_scripts/omniasr.py --input-dir <audio-dir> --output-file <output.jsonl>
```
Requires the `omnilingual-asr` package to be installed separately.
