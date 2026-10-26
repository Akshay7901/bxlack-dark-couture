# Notes for coding agents

- **Stack:** TanStack Start + React 19, Tailwind v4, Supabase, deployed to Vercel (Nitro `vercel` preset in `vite.config.ts`). npm is the package manager — keep `package-lock.json` as the only lockfile.
- **Routes** live in `src/routes` (see `src/routes/README.md`). `src/routeTree.gen.ts` is generated; never edit it by hand.
- **Server-only code:** server functions in `src/lib/*.functions.ts`; anything using `SUPABASE_SERVICE_ROLE_KEY` or secrets goes in `*.server.ts` files and is loaded with a dynamic `import()` inside a server function handler, so it never reaches the browser bundle.
- **Admin checks:** every admin server function calls `assertCallerIsAdmin` (`src/lib/admin-guard.ts`) before touching data.
- **Database changes** are new timestamped files in `supabase/migrations`; never edit an applied migration. Update `src/integrations/supabase/types.ts` to match. Remind the user to apply migrations before pushing code that needs them.
- **Emails:** templates in `src/lib/email/templates.ts` (table-based, inline styles, no web-only CSS); editable wording and variables in `src/lib/email/copy.ts`.
- **Prices and stock** are always computed on the server (`src/lib/checkout.functions.ts`), never trusted from the client.
