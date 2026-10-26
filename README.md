# BXLACK

Storefront and admin studio for BXLACK, a luxury streetwear label.
Live at https://bxlack-dark-couture.vercel.app.

## Stack

- **App:** [TanStack Start](https://tanstack.com/start) (React 19, file-based routes in `src/routes`, server functions in `src/lib/*.functions.ts`)
- **Styling:** Tailwind CSS v4, Framer Motion, GSAP, Lenis
- **Database, auth and storage:** [Supabase](https://supabase.com) — schema in `supabase/migrations`
- **Hosting:** [Vercel](https://vercel.com) — every push to `main` deploys
- **Email:** [Resend](https://resend.com) — templates in `src/lib/email`

## Run locally

Needs Node.js 22 or newer.

```sh
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:8080
```

`npm run build` produces the Vercel deployment output in `.vercel/output`.

## Environment variables

Listed in `.env.example`. Locally they go in `.env` (never committed); in production, set them in Vercel → Project → Settings → Environment Variables and redeploy.

| Variable | What it is |
| --- | --- |
| `SUPABASE_URL`, `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server only, keep secret |
| `RESEND_API_KEY` | Resend API key; emails are skipped while unset |
| `EMAIL_FROM` | Sender, e.g. `BXLACK <orders@yourdomain.com>` (domain verified in Resend) |
| `EMAIL_REPLY_TO` | Optional reply-to address |
| `ADMIN_NOTIFY_EMAIL` | Where store alerts go; comma-separate several |

## Database

Every schema change is a SQL file in `supabase/migrations`, applied in filename order. With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```sh
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase migration list   # Local vs Remote: anything missing on Remote isn't applied
npx supabase db push          # apply the missing ones
```

Apply new migrations **before** pushing code that depends on them. To change the schema, add a new timestamped file rather than editing an applied one.

## Admin studio

`/admin` — products, stock, orders, returns, customers, discount codes, messages, email templates and launch settings. On a fresh database, `/auth` offers to create the first admin account; after that, admins add other admins from Studio → Team.

## Email

Transactional emails (order confirmed/shipped/delivered/cancelled, returns, contact form, store alerts) are sent from the server through Resend. Their wording can be edited in Studio → Emails. The sign-up confirmation and password-reset emails are sent by Supabase: paste `emails/supabase/*.html` into Supabase → Authentication → Email Templates.
