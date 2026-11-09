# ZQ Removals — InvoicePlane deployment

This folder is a **deployment-ready infrastructure setup**, not a running production installation.

**Planned portal:** https://invoices.zqremovalsadelaide.com.au  
**Existing website:** https://zqremovalsadelaide.com.au (unchanged)  
**Initial admin email:** admin@zqremovals.au  
**InvoicePlane release:** v1.7.2 (commit aaeea1e4825785c6138fa84be49ac373bac4f0af)

## Architecture

* Dedicated Linux VPS with Docker Engine and Docker Compose v2.
* Official InvoicePlane source at the **pinned v1.7.2 commit**, built from its own maintained Containerfile.
* MariaDB 11.4 in an isolated Docker network. The database has **no published TCP port**.
* Caddy 2.10 for HTTPS and reverse proxy (ports 80/443 only).
* Persistent volumes for SQL data, uploads, storage, and TLS certificates.
* No changes to ZQ's Vercel/Astro website, quote API, GTM or advertising tags.

**Do not run this Compose stack on the ZQ Vercel project.** Vercel does not run persistent MariaDB/PHP services in the required form.

## Prerequisites

1. A Linux VPS controlled by ZQ, with Docker Engine, Compose v2 and Git installed.
2. DNS A record for `invoices.zqremovalsadelaide.com.au` pointing to the VPS IPv4 address (optional AAAA if IPv6 configured).
3. Inbound TCP 80/443 and UDP 443 permitted through server/provider firewalls.
4. Outbound access for Docker builds, TLS, payment gateways and configured mail service.
5. Confirm the legal entity, ABN, GST registration, invoice numbering, payment policies and email sender before sending invoices.

## Install on the VPS

Copy this folder to a private directory on the host, for example `/opt/zq-invoiceplane`. Run from within it:

```bash
cp .env.example .env
chmod 600 .env

# Generate DIFFERENT secrets for each corresponding .env key.
openssl rand -hex 32   # DB_PASSWORD
openssl rand -hex 32   # DB_ROOT_PASSWORD
openssl rand -base64 32 # ENCRYPTION_KEY; keep stable across restores
openssl rand -hex 32   # ADMIN_PASSWORD

nano .env              # Paste generated secrets (never commit or share them)
bash deploy.sh
```

The deployment script refuses placeholder values, clones the upstream **stable release**, verifies the exact source commit SHA and starts the services. Automatic HTTPS requires DNS to be correct and port 80/443 reachable.

```bash
docker compose --env-file .env ps
docker compose --env-file .env logs --tail=100 app
docker compose --env-file .env logs --tail=100 caddy
```

Open `https://invoices.zqremovalsadelaide.com.au`, log in as `admin@zqremovals.au` with the ADMIN_PASSWORD set **before the first startup**, and immediately set up the real business identity.

## ZQ business configuration checklist

1. Business display name: **ZQ Removals**. Verify legal name, postal address, phone and **ABN** before publishing documents.
2. Currency: **AUD**. Set date format and timezone for Adelaide (`Australia/Adelaide`) where supported.
3. Configure **10% GST only if GST-registered**. Choose tax-inclusive or tax-exclusive pricing deliberately, verify rounding and receipt wording; do not assume existing ZQ rates include or exclude GST.
4. Upload the **existing approved ZQ Removals logo** to InvoicePlane; use a clear blue/navy and orange invoice template without changing the source logo.
5. Configure outbound SMTP sender/authentication using ZQ's approved mail service. Verify SPF/DKIM/DMARC before bulk emails; secrets belong in the admin settings/secret store, never Git.
6. Configure Stripe or PayPal credentials in the InvoicePlane settings if ZQ wants online payment. Test with gateway sandbox and confirm amount, currency, webhook/callback handling, reconciliation and duplicate-payment protection before enabling live payment.
7. Create invoice groups/numbering and test a quotation → approved quote → invoice → payment → receipt workflow.
8. Confirm privacy notice, Australian recordkeeping obligations and customer access before issuing real invoices.

Existing ZQ published estimates (2 men + truck $150/hr; 3 men + truck $178/hr; travel/call-out may apply) are **not hard-coded** into invoices. Confirm rates and any GST treatment before defining products.

## Operations

* **Back up:** `bash backup.sh` (SQL plus uploads/storage). Encrypt and copy the result off-host, and securely back up `.env` (contains encryption key). Test restoration before relying on the backup.
* **Routine backup:** schedule `backup.sh` using the VPS scheduler; external retention/off-site upload must also be configured.
* **Logs:** `docker compose --env-file .env logs --tail=150 --no-log-prefix app db caddy`.
* **Updates:** review InvoicePlane release notes and security advisories; change pinned tag, SHA and image tag together; test a restored staging copy before production upgrades.
* **Rollback:** restore both the database and matching uploads/storage and the original encryption key from a verified snapshot. Avoid downgrading migrated databases without a tested recovery plan.
* **Do not run** `docker compose down -v` on a production host; it removes persistent data volumes.

## Security and boundaries

* `compose.yaml` uses mandatory secrets but cannot generate them; `deploy.sh` rejects example values.
* `.env`, SQL backups, uploaded invoices and the cloned upstream checkout are ignored by Git. Verify filesystem permissions and limit server/SSH access.
* Database is reachable only from the app on a private internal Docker network.
* Do not expose invoice content or admin sessions to public ZQ website scripts or GTM.
* InvoicePlane 1.7.2 is the security-fix release for significant vulnerabilities in 1.7.0 and 1.7.1. Apply future fixes promptly.
* There is **no automatic lead-to-invoice sync** with ZQ's current booking API or AI receptionist in this change. Integration must use authenticated server-to-server flows with explicit approval before writing any invoices.
* Existing website DNS should not be changed: only add a record for the **invoices** subdomain.

## Required final actions before going live

A working VPS (or equivalent persistent PHP hosting), its IP address, and control of ZQ's DNS are needed. This repository change alone cannot make the invoice portal accessible. Once deployed, complete the payment and tax verification checklist above before real customer billing.

Upstream references:
* https://github.com/InvoicePlane/InvoicePlane/releases/tag/v1.7.2
* https://github.com/InvoicePlane/InvoicePlane/blob/v1.7.2/.github/docs/CONTAINER_DEPLOYMENT.md
* https://github.com/InvoicePlane/InvoicePlane/security/advisories
