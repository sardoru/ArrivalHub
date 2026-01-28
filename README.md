# ArrivalHub

A modern front desk arrivals management system for buildings, hotels, and short-term rentals. Features real-time guest tracking, iPad self-service check-in, ID verification workflow, and guest flagging capabilities.

## Features

### Admin Panel
- **Arrivals Management** - Add, edit, and remove guest arrivals
- **Bulk Import** - Paste a list of arrivals in `Last, First - Unit#` format
- **Status Tracking** - Track pending, checked-in, and no-show guests
- **Real-time Updates** - Changes sync instantly across all devices
- **Sample Data** - Quick-load test data for demos

### Guest Self-Service Sign-In (iPad)
- **Touch-Optimized Interface** - Large buttons and inputs for easy iPad use
- **Guest Information** - Collects name, phone, and email
- **Building Rules Acceptance** - Guests must accept rules before check-in:
  - No smoking policy ($200 penalty)
  - Quiet hours after 10pm
  - No parties policy
  - Liability acknowledgment
  - 24/7 recording disclosure
  - Fire alarm penalty clause ($400)

### ID Verification Workflow
- **Automatic Highlighting** - Signed-in guests appear at top with orange highlight
- **Verify ID Button** - Staff confirms guest identity before check-in
- **Check-in & Give Keys** - Final step after ID verification

### Guest Flagging System
- **Flag Issues** - Block check-in for problematic guests
- **Quick Reasons** - Pre-set options: Name mismatch, Underage, ID expired, etc.
- **Custom Notes** - Add detailed explanation for flags
- **Clear Flag** - Remove flag if issue is resolved

### Display View
- **Large Format Display** - Designed for lobby monitors
- **Pending Arrivals List** - Shows guests awaiting check-in
- **Adjustable Font Size** - A / A+ / A++ sizing options
- **Live Clock** - Real-time date and time display
- **Quick Check-in** - One-click check-in buttons

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sardoru/ArrivalHub.git
   cd ArrivalHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   Create a new project at [supabase.com](https://supabase.com) and run the following SQL in the SQL Editor:

   ```sql
   -- Create arrivals table
   CREATE TABLE IF NOT EXISTS arrivals (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     last_name text NOT NULL,
     first_name text DEFAULT '',
     unit_number text NOT NULL,
     notes text DEFAULT '',
     status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked-in', 'no-show')),
     arrival_date date NOT NULL DEFAULT CURRENT_DATE,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now(),
     guest_phone text DEFAULT '',
     guest_email text DEFAULT '',
     signed_in_at timestamptz DEFAULT NULL,
     rules_accepted boolean DEFAULT false,
     id_verified boolean DEFAULT false,
     is_flagged boolean DEFAULT false,
     flag_reason text DEFAULT ''
   );

   -- Create index for date queries
   CREATE INDEX IF NOT EXISTS idx_arrivals_arrival_date ON arrivals(arrival_date);

   -- Enable Row Level Security
   ALTER TABLE arrivals ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies for anonymous access
   CREATE POLICY "Allow anonymous read access to arrivals"
     ON arrivals FOR SELECT TO anon
     USING (arrival_date >= CURRENT_DATE - INTERVAL '2 days' AND arrival_date <= CURRENT_DATE + INTERVAL '2 days');

   CREATE POLICY "Allow anonymous insert access to arrivals"
     ON arrivals FOR INSERT TO anon
     WITH CHECK (arrival_date >= CURRENT_DATE - INTERVAL '2 days' AND arrival_date <= CURRENT_DATE + INTERVAL '2 days');

   CREATE POLICY "Allow anonymous update access to arrivals"
     ON arrivals FOR UPDATE TO anon
     USING (arrival_date >= CURRENT_DATE - INTERVAL '2 days' AND arrival_date <= CURRENT_DATE + INTERVAL '2 days')
     WITH CHECK (arrival_date >= CURRENT_DATE - INTERVAL '2 days' AND arrival_date <= CURRENT_DATE + INTERVAL '2 days');

   CREATE POLICY "Allow anonymous delete access to arrivals"
     ON arrivals FOR DELETE TO anon
     USING (arrival_date >= CURRENT_DATE - INTERVAL '2 days' AND arrival_date <= CURRENT_DATE + INTERVAL '2 days');

   -- Create trigger for updated_at
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER update_arrivals_updated_at
     BEFORE UPDATE ON arrivals
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   ```

4. **Enable Realtime**
   
   In Supabase Dashboard, go to Database > Publications > `supabase_realtime` and enable the `arrivals` table.

5. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Custom Domain

After deploying to Vercel:
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS as instructed

## Usage

### Three Views

1. **Admin Panel** - Main management interface for staff
2. **Display View** - Read-only display for lobby monitors
3. **Guest Sign-In** - Self-service kiosk for guest iPad

### Typical Workflow

1. Staff adds expected arrivals via Admin Panel (or bulk import)
2. Guest arrives and uses iPad to sign in via Guest Sign-In view
3. Admin Panel shows the guest highlighted at the top
4. Staff verifies guest's ID and clicks "Verify ID"
5. If ID matches, staff clicks "Check In & Give Keys"
6. If there's an issue, staff clicks "Flag Issue" and enters reason

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript checks
```

## License

Copyright (c) 2026 sardoru. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without prior written permission from the owner.

For licensing inquiries, please contact the repository owner.
