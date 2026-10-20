# VM, domain, and deployment administration

Last verified: 2026-10-07

This document is the operating guide for the local "cloud server" VM, its Cloudflare Tunnel, the `corprorate.com` domain, and the applications currently deployed there. It is written for a new administrator or AI agent taking over the environment.

## Read this first

- The VM is a local Ubuntu server running on Ramzi's laptop. It is not a public cloud VM.
- Public web traffic reaches the VM through **Cloudflare Tunnel**. Do not expose router ports or add general port forwarding to the laptop.
- `corprorate.com` remains registered at GoDaddy. DNS is managed at Cloudflare through the Cloudflare nameservers.
- The production reverse proxy is Traefik (`coolify-proxy`), which owns ports 80 and 443. Do not start another host web server on those ports.
- Keep credentials, `.env` files, Cloudflare tokens, database passwords, and private keys out of this repository and out of chat.

## Current topology

```text
Internet
  |
  v
Cloudflare DNS + HTTPS + Cloudflare Tunnel
  |
  v  outbound-only tunnel from the VM
cloudflare-tunnel container
  |
  v  http://127.0.0.1:80
Traefik / coolify-proxy
  |-- corprorate.com, www.corprorate.com -> corprorate-web
  |-- konsult.corprorate.com             -> konsult-edge -> frontend/backend/Supabase services
  `-- companai.corprorate.com            -> companai-platform-app -> /login
```

## Accessing the VM

| Item | Value |
|---|---|
| VM hostname | `platform-server` |
| Guest IP on the laptop's virtual network | `172.28.50.2` |
| SSH user | `ramzi` |
| Private SSH key on the laptop | `C:\Users\Ramzi\Downloads\companai\vms\id_ed25519` |
| Operating system | Ubuntu 24.04.5 LTS |
| Docker | Docker Engine 29.8.2, Docker Compose 5.6.0 |
| VM root disk | 47 GB partition on a 48 GB dynamic virtual disk |

From PowerShell on the laptop:

```powershell
$vm = 'ramzi@172.28.50.2'
$key = 'C:\Users\Ramzi\Downloads\companai\vms\id_ed25519'
ssh -i $key -o BatchMode=yes $vm
```

If SSH rejects the key due to Windows permissions, restrict the private key to the current Windows user. Do not send the key or a password through chat.

Useful first checks after connecting:

```bash
hostnamectl --static
df -h /
free -h
docker ps
docker system df
```

The VM had about 13 GB free on the root disk at the most recent verification. Do not begin image builds when free space is low; Docker builds and image pulls can consume several GB.

## Domain and Cloudflare management

### Ownership and DNS

- Registrar: GoDaddy (`corprorate.com` registration must remain there unless deliberately transferred).
- Authoritative DNS: Cloudflare.
- Cloudflare account: the `Bixmatech@gmail.com` account already open in the Codex browser.
- Cloudflare nameservers observed: `michael.ns.cloudflare.com` and `alexandra.ns.cloudflare.com`.
- Cloudflare Zero Trust Free is active. It has a payment method on file and may charge for usage beyond its free allowance; review its billing settings before enabling usage beyond the plan limits.

### Existing public hostnames

| Hostname | Cloudflare Tunnel service | Expected public result |
|---|---|---|
| `corprorate.com` | `http://127.0.0.1:80` | Existing PHP site, HTTP 200 |
| `www.corprorate.com` | `http://127.0.0.1:80` | Same existing site, HTTP 200 |
| `konsult.corprorate.com` | `http://127.0.0.1:80` | Konsult application, HTTP 200 |
| `companai.corprorate.com` | `http://127.0.0.1:80` | Companai, redirects to `/login` |

All four use proxied Cloudflare Tunnel DNS records for tunnel ID `f68231e5-4d85-4006-9244-ed093de2f08c` (`platform-server-corprorate`).

### Adding another public hostname

Use the tunnel UI, rather than creating a DNS record first:

1. In Cloudflare, open **Zero Trust** > **Networks** > **Tunnels & Mesh**.
2. Open `platform-server-corprorate`.
3. Open **Published application routes** > **Add a published application route**.
4. Enter the desired subdomain, choose `corprorate.com`, leave Path empty, choose `HTTP`, and use `127.0.0.1:80` as the URL.
5. Save. Cloudflare creates the matching proxied tunnel DNS record automatically.
6. Add a Traefik router label for that hostname to the target application, then recreate only that target application.
7. Test local routing first, then public HTTPS.

Do **not** pre-create the CNAME in Cloudflare DNS before adding a tunnel route. Cloudflare rejects the route because the name is already occupied. If this happens, delete only the duplicate subdomain record and add the route through the tunnel screen so Cloudflare recreates it as a tunnel-managed record.

### DNS and tunnel validation

Run from the laptop:

```powershell
curl.exe -sS -I https://konsult.corprorate.com/
curl.exe -sS -I https://companai.corprorate.com/
curl.exe -sS -I https://corprorate.com/
curl.exe -sS -I https://www.corprorate.com/
curl.exe -sS https://konsult.corprorate.com/api/health
```

Expected final API response:

```json
{"ok":true}
```

On the VM, inspect the tunnel and the route configuration it receives:

```bash
docker ps --filter name=cloudflare-tunnel
docker logs --tail 80 cloudflare-tunnel
curl -H 'Host: konsult.corprorate.com' -I http://127.0.0.1/
curl -H 'Host: companai.corprorate.com' -I http://127.0.0.1/
```

The tunnel must show a healthy connection and an `Updated to new configuration` log entry with all four hostnames.

## Infrastructure directories and ownership

| Directory | Purpose | Handling |
|---|---|---|
| `/opt/sites/.cloudflared` | Docker Compose definition and token mount for the running Cloudflare Tunnel | Do not print or copy `tunnel-token`. The tunnel is Cloudflare-managed; change hostname routes in Cloudflare. |
| `/opt/companai-platform` | Companai deployment and its environment file | Use the provided hostname helper, described below. |
| `/opt/sites/konsult/releases/90f0b4f4ed6a53bc09ed9f451c12eca870f7febf` | Current staged Konsult release | This is a separate deployment copy, not the original source checkout. |
| `/opt/sites/corprorate` | Existing apex PHP site | Do not change when working on Konsult or Companai. |
| `/opt/sites/second-site` and `/opt/sites/demo-site` | Other existing sites | Treat as unrelated services. |

### Traefik and Coolify

Coolify is installed and its `coolify-proxy` Traefik container owns ports 80 and 443. Coolify is available as an operational panel, but it is not a Plesk replacement for importing old WordPress installations and databases automatically.

Before adding a new Docker application, make sure it joins the external Docker network named `coolify` and supplies an explicit Traefik router label for its hostname. Avoid publishing application ports to the host unless there is a specific need.

Check the shared network:

```bash
docker network inspect coolify
docker ps --filter name=coolify-proxy
```

## Current applications

### Konsult

**Public URL:** `https://konsult.corprorate.com`

**Source selected for deployment:**

```text
C:\Users\Ramzi\Downloads\notion-workbuddy\notion\mike-main
```

**Deployed commit:** `90f0b4f4ed6a53bc09ed9f451c12eca870f7febf`

The original checkout was deliberately not changed. The VM release was created from a clean archive of that commit with local `.env` files and `.probe` artifacts excluded.

**VM deployment directory:**

```text
/opt/sites/konsult/releases/90f0b4f4ed6a53bc09ed9f451c12eca870f7febf
```

**Compose command:**

```bash
cd /opt/sites/konsult/releases/90f0b4f4ed6a53bc09ed9f451c12eca870f7febf
docker compose -p konsult -f docker-compose.yml -f deploy/vm/compose.yml <command>
```

**Relevant services:**

- `konsult-edge-1`: internal Nginx edge router, exposed to Traefik through `coolify` network.
- `konsult-frontend-1`: built Konsult frontend.
- `konsult-backend-1`: Node backend, exposes `/health` internally.
- `konsult-db-1`: Supabase PostgreSQL database.
- `konsult-auth-1`, `konsult-rest-1`, `konsult-gateway-1`, `konsult-storage-1`, `konsult-mailpit-1`: Supabase-related services.

Check status and logs:

```bash
cd /opt/sites/konsult/releases/90f0b4f4ed6a53bc09ed9f451c12eca870f7febf
docker compose -p konsult -f docker-compose.yml -f deploy/vm/compose.yml ps
docker logs --tail 100 konsult-backend-1
docker logs --tail 100 konsult-edge-1
curl -H 'Host: konsult.corprorate.com' -I http://127.0.0.1/
```

Restart only the service you changed:

```bash
docker compose -p konsult -f docker-compose.yml -f deploy/vm/compose.yml up -d --no-deps backend
```

Do not use `down -v` against this project. That can remove named volumes and destroy the application database.

**Database and migrations**

The fresh database schema plus 24 later Konsult migrations were applied successfully. For a future new release with migrations, preserve backups first, review every migration, then use the existing staged migration runner. The runner has Windows line endings in the source archive, so normalize it only in a VM temporary path before executing; do not edit the original source to work around this.

```bash
cd /opt/sites/konsult/releases/90f0b4f4ed6a53bc09ed9f451c12eca870f7febf
sed 's/\r$//' deploy/apply-migrations.sh > /tmp/konsult-apply-migrations.sh
chmod 700 /tmp/konsult-apply-migrations.sh
APP_DIR="$PWD" COMPOSE='docker compose -p konsult -f docker-compose.yml -f deploy/vm/compose.yml' \
  bash /tmp/konsult-apply-migrations.sh
```

The deployment’s `.env` files contain generated secrets and are intentionally mode-restricted. Do not add them to Git.

**Known operational limitation:** Google authentication is disabled. Signup is currently enabled with automatic email confirmation, but no production SMTP service is configured; password-reset and real confirmation email flows must be configured before treating it as a customer-facing registration service.

### Companai

**Public URL:** `https://companai.corprorate.com`

The expected root response is a `307` redirect to `/login`.

**Deployed 2026-10-20, 12:37–12:41 UTC — a fresh instance, commit `86c2b1ed`.** The `companai-platform`
stack was removed (containers, network, and the six `mercato-*-wan` volumes) and rebuilt from a clean
`git archive` of that commit: image `open-mercato/app:wan`
(`sha256:ed7544dd4e32fba0c09a8a782cb89079fe13a8ace31bca2af30c42c654a5cf9a`), schema created from zero and
seeded (1 tenant, 3 users). The outgoing image is preserved as `open-mercato/app:wan-20261020T121954Z`;
the pre-deploy database is at `/home/ramzi/companai-backup-20261020T121335Z/db.dump` (2.4 MB, verified
readable). **Full record: [`library/development/DEPLOY-2026-10-20.md`](library/development/DEPLOY-2026-10-20.md)**
— read it before the next deploy and write the next entry there.

**Update procedure for a new version:** `git archive HEAD` from the codebase → copy to
`/home/ramzi/build-src` → `docker build -t open-mercato/app:wan -f /home/ramzi/build-src/Dockerfile
/home/ramzi/build-src` → `cd /opt/companai-platform && ./deploy.sh` → `./verify.sh`. The build takes
~15 minutes on this VM and needs free disk (the image is ~3 GB).

Current application container:

```text
companai-platform-app-1
```

The hostname is set through the helper at:

```text
/opt/companai-platform/set-host.sh
```

For a hostname change, first create a timestamped backup of `/opt/companai-platform/.env`, then run:

```bash
cd /opt/companai-platform
cp -a .env ".env.before-host-change.$(date -u +%Y%m%dT%H%M%SZ)"
./set-host.sh new-subdomain.corprorate.com
```

The helper changes its VM deployment configuration and recreates the Companai app; it does not delete the app database volumes. After changing it, update Cloudflare Tunnel and Traefik routing to use the same hostname, then verify:

```bash
curl -H 'Host: companai.corprorate.com' -I http://127.0.0.1/
docker logs --tail 100 companai-platform-app-1
```

Companai depends on its existing `mercato-postgres-wan`, `mercato-redis-wan`, and `mercato-meilisearch-wan` containers. Do not remove or recreate those casually.

### Existing corprorate.com PHP site

The apex site is `corprorate-web-1` and is separate from Konsult and Companai. Confirm it remains healthy after any infrastructure work:

```bash
docker ps --filter name=corprorate-web-1
curl -H 'Host: corprorate.com' -I http://127.0.0.1/
curl -H 'Host: www.corprorate.com' -I http://127.0.0.1/
```

## Normal release procedure for Konsult

1. Determine and record the selected Git commit in the original checkout. Do not deploy uncommitted files by accident.
2. Archive the selected commit into a clean staging release. Exclude `.env`, `.env.*`, and `.probe` content.
3. Copy the archive to a new uniquely named release directory under `/opt/sites/konsult/releases/`.
4. Copy only the VM-specific deployment configuration required for that release. Generate or preserve secrets in the VM, never in Git.
5. Build and security-check the images before replacing running containers.
6. Review and back up the database before applying migrations.
7. Run Compose configuration validation, then update only affected containers.
8. Verify local host routing, public HTTPS routing, API health, logs, and the existing apex/www sites.
9. Keep the previous release directory until the new release has been stable and a rollback decision is no longer needed.

## Safe diagnostics and recovery posture

### Quick service overview

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
docker stats --no-stream
df -h /
```

### Reverse proxy routing test

These do not leave the VM and are the fastest way to separate an application issue from a Cloudflare issue:

```bash
curl -H 'Host: corprorate.com' -I http://127.0.0.1/
curl -H 'Host: www.corprorate.com' -I http://127.0.0.1/
curl -H 'Host: konsult.corprorate.com' -I http://127.0.0.1/
curl -H 'Host: companai.corprorate.com' -I http://127.0.0.1/
```

Expected status codes are 200 for corprorate/www/Konsult and 307 for Companai.

### If a hostname returns Cloudflare 404

1. Confirm its row exists under Cloudflare Tunnel > `platform-server-corprorate` > Published application routes.
2. Confirm the matching Cloudflare DNS record is a proxied **Tunnel** record to the same tunnel.
3. Check `docker logs --tail 80 cloudflare-tunnel`; its received configuration must include the hostname.
4. Verify the local Host-header route works on `127.0.0.1:80`.

### If a hostname returns 502 or 503

1. Test its local Host-header route.
2. Check the relevant application container status and logs.
3. Check `coolify-proxy` logs and the target container’s Traefik labels.
4. Do not restart all containers as a first response; restart only the affected service after identifying the cause.

### Backup and destructive-operation rules

- Before changing a database schema, take a PostgreSQL dump and confirm it can be read.
- Before updating an environment file, make a timestamped copy with permissions preserved.
- Never run `docker compose down -v`, `docker volume prune`, `docker system prune -a`, or `docker system prune --volumes` in this environment without an explicit backup and a precise review of the target data.
- Never delete Docker volumes attached to `konsult-db-1`, `mercato-postgres-wan`, Coolify, or the existing PHP site unless the user explicitly intends data loss.
- Prefer `docker compose up -d --no-deps <service>` for a single-service restart.

## Current verification record

On 2026-10-07, the following were verified from outside the VM:

- `https://konsult.corprorate.com` returned HTTP 200.
- `https://konsult.corprorate.com/api/health` returned `{"ok":true}`.
- `https://companai.corprorate.com` returned the expected redirect to `/login`.
- `https://corprorate.com` and `https://www.corprorate.com` both returned HTTP 200.
- The Cloudflare Tunnel was healthy and had all four hostname rules.
- Konsult, Companai, Cloudflare Tunnel, the existing PHP site, and required supporting containers were running.

### companai platform updates (historical — superseded by the 2026-10-20 fresh deploy above)

companai.corprorate.com exposes a platform that was already deployed on the VM before this session.
Evidence:
- Its supporting database and search services were already running for about 44 hours before today.
- The Companai application image was created about 16 hours before today.
- Its deployment files date to October 5.
- I did not deploy its code, create its database, or initialize its data.
What I did during domain setup was run its existing VM helper:
/opt/companai-platform/set-host.sh companai.corprorate.com
That helper rewrote only hostname-related values in the existing deployment configuration and recreated the existing app container. It explicitly leaves PostgreSQL, Redis, Meilisearch, and their volumes untouched. I then mapped the requested public subdomain through Cloudflare Tunnel.
So the platform appeared because an existing Companai deployment was published under companai.corprorate.com; it was not newly deployed by this work.

# Docker cleanup report
No files, containers, images, volumes, DNS, routes, or application settings were changed.
The VM currently has about 13 GB free. Docker reports:
Category	Total	Safely reclaimable according to Docker
Images	16.86 GB	1.33 GB
Containers	21.71 MB	1.07 MB
Volumes	534 MB	0 B automatically reclaimable
Build cache	10.69 GB	5.72 GB


Clear candidates, pending your approval
1. Stopped companai-teststack test environment
   Four stopped containers from October 4–5:
   - teststack-wordpress
   - teststack-phpmyadmin
   - teststack-mariadb
   - teststack-static
   Its compose file identifies it as a test setup using wp.test, pma.test, and app.test. It has three persistent volumes:
   - WordPress files: 110 MB
   - MariaDB data: 156 MB
   - phpMyAdmin config: 8 MB
   It also keeps these images because the stopped containers still reference them:
   - WordPress: 1.12 GB
   - MariaDB: 467 MB
   - phpMyAdmin: 251 MB
   Removing this test stack, its volumes, and its now-unused images would likely recover about 2.1 GB. This deletes the test WordPress files and test database, so it needs an explicit decision.
2. Unused images
   Docker shows these images have no container references:
   - amazon/aws-cli:latest — 648 MB
   - coollabsio/coolify-helper:1.0.17 — 652 MB
   - node:22-slim — 329 MB
   - coollabsio/sentinel:1.0.1 — 42 MB
   Total: about 1.67 GB. They can be re-pulled if needed. The Coolify helper is unused now but may be used automatically by Coolify later.
3. Unused build cache
   Docker marks 5.72 GB of build cache as reclaimable. Clearing it does not delete running applications or database data, but it removes cached build layers and makes the next builds slower.
Preserve
- All Konsult containers, images, volumes, and the 131 MB staged release directory.
- All Companai containers and mercato-* volumes.
- Coolify, Traefik, Cloudflare Tunnel, and corprorate-web-1.
- Existing corprorate.com, www, Konsult, and Companai DNS/tunnel routes.
The full operating record remains in [vm-setup.md](C:/Users/Ramzi/Downloads/notion-workbuddy/vm-setup.md).