-- Removes every demo member added by demo_seed.sql, together with their
-- experiences, comments, connect requests, notifications and reports.
-- Real accounts and their content are not touched.

delete from auth.users
where email like 'demo.%@mitwpu.edu.in'
   or email like 'demo.%@example.com';
