# THOUSAND

Same spot. Every day. An installable web app for tracking faith, marriage, parenting, health, work-life and money with your spouse and a crew of friends.

> “If you hit an oak tree a thousand times in a thousand different places, nothing is going to happen to that tree. But if you hit it a thousand times in the same place, it's going to come down.” — Eric Thomas

## What's in it

- **Sign in** with an email link (no passwords).
- **Onboarding**: profile, photo, birthday, phone, guide choice, and a full baseline across nine chapters. Health answers are checked against published guidelines (CDC, AHA, ADA, HHS, AASM, PHQ-2, GAD-2). Ends with the 119-hour time budget and a baseline report.
- **Goals**: ready-made or custom, each with a measure (down, up, or count), a finish date, the pace needed, and 1 to 3 reps on chosen weekdays. Sundays are the Sabbath and never count.
- **Today**: the daily rep ring, your 3D guide, goal dials with pace, slipping alerts, a 12-week history, milestones, and the Saturday number check-in. Guide moments play at 25/50/75/100% and on a clean sweep.
- **Team**: link with your spouse. See each other's goals, share Marriage reps (one check counts for both), share one household Budget goal, and compare marriage answers side by side.
- **Crew**: invite friends by link. They see Faith, Marriage, Parenting, Work-Life and Health (never Budget), red flags, and a Text button that opens Messages.
- **Me**: edit profile and photo, switch guides, install instructions, unlink household, download your data, delete your account.
- **Demo mode** with sample people, available from the sign-in screen.

## Rules (src/lib/rules.js, tested in tests/)

- Target reps = each rep's scheduled days between start and end, Sundays excluded.
- Pace = reps logged minus reps scheduled before today.
- Slipping: on the 3rd scheduled day in a row with zero reps, the goal starts slipping and each further missed day costs that day's reps. One rep stops it.
- Reps can be logged for today or yesterday.

## Setup

1. **Supabase**: create a free project at supabase.com. Either connect this GitHub repo under **Project Settings → Integrations → GitHub** (Supabase then runs `supabase/migrations` on every push to `main`), or paste `supabase/migrations/20261014000000_thousand_init.sql` into **SQL Editor** and click **Run**.
2. In Supabase **Authentication → URL Configuration**, set **Site URL** to your live address (for example `https://thousandhits.netlify.app`) and add the same address to **Redirect URLs**.
3. **Sign-in email**: in **Authentication → Email Templates → Magic Link**, add the line `Or enter this code: {{ .Token }}` so people using THOUSAND from their home screen can sign in with the code.
4. **Keys**: Project Settings → API. Copy the Project URL and the anon public key.
5. **Netlify**: in the site's **Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.
6. Open the site on your phone and Add to Home Screen.

Optional but recommended before inviting friends: in Supabase **Authentication → Emails**, set up custom SMTP (for example Resend) so sign-in emails aren't limited by Supabase's built-in sender.

## Develop

```bash
npm install
cp .env.example .env   # fill in keys, or leave blank to use demo mode
npm run dev
npm test
npm run build
```

Built with Vite, plain JavaScript modules, Supabase (Postgres with row-level security, auth, storage) and three.js for the guides.
