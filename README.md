# Slot Booking Application

A modern slot booking application built with Next.js, featuring real-time availability management and a sleek user interface. This project was created as part of the Zelthy Frontend Internship Assignment.

## Features

- 📅 Interactive calendar interface with day, week, and month views
- 🔐 Secure authentication using Clerk
- 💾 Local data persistence with IndexedDB
- 🌓 Dark/Light mode support
- 📱 Responsive design for all devices
- 🤖 Simulated user bookings for demo purposes
- ⚡ Real-time slot management
- 🎨 Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 14
- **Authentication**: Clerk
- **Database**: IndexedDB (via Dexie.js)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Calendar**: FullCalendar
- **State Management**: React Hooks
- **Date Handling**: date-fns
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

git clone https://github.com/yourusername/slot-booking-app.git
cd slot-booking-app

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Clerk credentials:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign in using the authentication system
2. Navigate to the calendar view
3. Click on any time slot to create a booking
4. View, edit, or delete your bookings
5. See other users' availability in different colors
6. Toggle between dark and light modes

## Project Structure

```
src/
├── app/                  # Next.js app directory
├── components/          # Reusable UI components
├── lib/                 # Utilities and database setup
│   ├── constants/      # Application constants
│   ├── db.ts           # IndexedDB configuration
│   └── utils.ts        # Helper functions
└── styles/             # Global styles and CSS modules
```

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Calendar functionality by [FullCalendar](https://fullcalendar.io/)
- Authentication by [Clerk](https://clerk.dev/)

---

Created by [Om Sarraf](https://itsomsarraf.com) - Feel free to connect!
