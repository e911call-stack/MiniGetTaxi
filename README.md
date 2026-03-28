# YellowWant.jo - Yellow Taxi in Amman

A 100% browser-based web platform connecting passengers directly to licensed yellow taxis in Amman, Jordan.

## Features

- **Arabic First**: Default Arabic language with English switcher
- **Real-time Taxi Finding**: Using PostGIS for 2km radius taxi search
- **Privacy First**: Digital hide option for passengers
- **WhatsApp Integration**: Direct communication between driver and passenger
- **Real-time Updates**: Live status tracking and chat
- **Admin Dashboard**: Complete management interface

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Postgres with PostGIS, Realtime, Storage)
- **Maps**: Leaflet.js + OpenStreetMap
- **i18n**: react-i18next

## Project Structure

```
yellowwant-jo/
├── public/
│   └── taxi-icon.svg
├── src/
│   ├── components/
│   │   ├── LanguageSwitcher.tsx
│   │   └── DriverSignupButton.tsx
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── ar.json
│   │       └── en.json
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── PassengerApp.tsx
│   │   ├── DriverApp.tsx
│   │   └── AdminPanel.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── schema.sql
├── .env.example
├── vercel.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/yellowwant-jo.git
   cd yellowwant-jo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_WHATSAPP_NUMBER=+962790000000
   ```

4. **Set up Supabase**

   a. Create a new Supabase project at [supabase.com](https://supabase.com)

   b. Enable PostGIS extension (in SQL Editor):
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

   c. Run the schema from `supabase/schema.sql`

   d. Copy the URL and anon key from Project Settings > API

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:3000`

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? yellowwant-jo
# - Directory? ./
# - Override settings? No
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the framework (Vite)
6. Add environment variables in project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER`
7. Click "Deploy"

### Option 3: Static Export for Any Hosting

```bash
# Build the static site
npm run build

# The output will be in the 'dist' folder
# Upload this folder to any static hosting service
```

## Supabase Setup

### Enable PostGIS

In your Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Run the Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run"

### Configure Realtime

Enable Realtime for the following tables:
- `requests`
- `messages`

Go to Database > Replication and enable these tables.

### Set up Storage

The schema automatically creates a storage bucket for license photos.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_WHATSAPP_NUMBER` | Business WhatsApp number | Yes |

## Usage

### For Passengers

1. Visit the website
2. Allow location access or select location on map
3. Enter destination
4. Toggle "Digital Privacy" if desired
5. Click "Request Taxi"
6. Wait for driver assignment
7. Chat unlocks when driver arrives

### For Drivers

1. Contact us via WhatsApp to register
2. Receive login credentials
3. Go online to receive requests
4. Accept/reject incoming requests
5. Navigate to pickup location
6. Mark "I'm Here" when arrived
7. Start trip when passenger is in
8. End trip when arrived

### For Admin

1. Access admin panel with credentials
2. View dashboard with real-time stats
3. Manage drivers (verify, suspend)
4. Monitor requests

## Security

- Row Level Security (RLS) enabled on all tables
- Anonymous passengers can request taxis
- Drivers see "Anonymous Passenger" until arrival
- Chat is encrypted and real-time
- Digital hide option for extra privacy

## License

MIT License - see LICENSE file for details

## Support

For support, contact us via WhatsApp or email.

---

Built with love in Amman, Jordan 🇯🇴
