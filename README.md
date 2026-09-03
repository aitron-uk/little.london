# Little London Appointment Manager

Barber-only appointment calendar for computer/tablet. Appointments are saved to a Supabase (Postgres) database.

## Run

```bash
npm install
npm run dev
```

Then open **http://localhost:5174**

Keep the terminal open while using the app.

## Data

Data is stored in Supabase. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in a `.env` file at the project root (see `.env.example`) — the API server reads these on startup.

## Features

- Day calendar with week strip
- Quick add: name, start time, duration chips (30m–2h)
- Overlap protection (blocks double-booking)
- Edit, mark done, cancel, delete
- Shop hours and open days in Settings
