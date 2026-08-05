# Supabase database health check

The workflow at `.github/workflows/supabase-database-healthcheck.yml` authenticates as a normal application user and performs a read-only query against that user's own workspace membership.

It does **not** use the Supabase service-role key and does **not** modify rental, payment, tenant, contract, or workspace data.

## Required GitHub Actions secrets

Create these repository secrets under **Settings → Secrets and variables → Actions**:

- `SUPABASE_KEEPALIVE_EMAIL`: the email address of an active Supabase Auth user that belongs to the private rental workspace.
- `SUPABASE_KEEPALIVE_PASSWORD`: that user's Supabase Auth password.

Use a dedicated least-privilege application user when practical. The account only needs normal authenticated read access granted by the existing Row Level Security policies.

## Verify the workflow

1. Open **Actions** in the repository.
2. Select **Supabase database health check**.
3. Choose **Run workflow**.
4. Confirm that the job finishes successfully.

The workflow runs automatically three times per day at `03:17`, `11:17`, and `19:17` UTC. GitHub may delay scheduled jobs during periods of high Actions load.

## Operational limitation

GitHub can automatically disable scheduled workflows in public repositories after 60 days without repository activity. If that happens, re-enable the workflow from the repository's **Actions** tab or move the scheduler to an actively maintained private operations repository.

For production workloads that must remain continuously available, use a paid Supabase plan rather than relying on an inactivity health check.
