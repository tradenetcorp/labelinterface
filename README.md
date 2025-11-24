# Label App

audio labeling application built with React Router and Clerk authentication.

## Tech Stack

- **Framework**: React Router v7
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, pnpm, yarn, or bun

### Installation

1. Clone the repository:
git clone <repository-url>
cd labelapp2. Install dependencies:ash
npm install3. Set up environment variables:
Create a `.env` file in the root directory with your Clerk credentials:
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/### Development

Start the development server:
npm run devThe application will be available at `http://localhost:5173`.

### Building for Production

