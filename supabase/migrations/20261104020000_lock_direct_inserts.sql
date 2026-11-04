-- Customers can only read their own orders; creating orders and contact
-- messages goes through the server only.
--
-- Orders are created by the checkout server function (prices recalculated
-- from the catalogue, stock reserved, emails sent) with the service role.
-- The old "Users can insert own orders" policy let a signed-in customer
-- write an order row straight to the database with any total or status,
-- which would then show up in the studio. Contact messages likewise go
-- through the server, where the Turnstile check and the per-email rate limit
-- live; a direct insert skipped both.
-- The site itself never inserted into either table from the browser.

drop policy if exists "Users can insert own orders" on public.orders;
revoke insert on public.orders from anon, authenticated;

drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
revoke insert on public.contact_messages from anon, authenticated;

notify pgrst, 'reload schema';
