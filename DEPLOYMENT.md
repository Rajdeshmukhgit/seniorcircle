# CI/CD Pipeline — CCA 2 Report

**Course:** Cloud Computing and DevOps (TY CSE) · **Student:** Raj Deshmukh
**Project:** SeniorCircle (Senior–Junior Connect System), our PBL III web app
**Repository:** https://github.com/Rajdeshmukhgit/seniorcircle

Every push to `main` is built, tested, packaged as a Docker image, published to Docker Hub and deployed to a Kubernetes (Minikube) cluster on AWS, with no manual steps.

```
 Developer ──git push──▶ GitHub ──webhook──▶ Jenkins (AWS EC2)
                                               │
      ┌────────────┬────────────┬──────────────┼──────────────┬──────────────┬───────────┐
   Checkout    Install     Lint & Test     Build app     Docker Build   Push Image   Deploy + Verify
   (git)       (npm ci)    (ESLint, tsc,   (next build)  (Dockerfile)   (Docker Hub)  (kubectl → Minikube)
                            6 unit tests)                                   │
                                                                            ▼
                                       Minikube on the same EC2 ◀── pulls rajd27/seniorcircle:<tag>
                                       Deployment (2 pods) + NodePort Service :30080
                                                                            │
                                         Browser ──▶ http://<EC2-IP>:30080 ─┘
```

## 1. The project

SeniorCircle is a college-only platform where seniors and alumni share interview, internship, exam and certification experiences and juniors read, search and connect with them.

- **Stack:** Next.js 15 (React 19, TypeScript), Tailwind CSS, Supabase (PostgreSQL + Auth with Row Level Security), optional Groq/Gemini AI assistant.
- **Before this CCA:** deployed on Vercel with Supabase as the database (https://seniorcircle.vercel.app).
- **For this CCA:** the same code is now also delivered through a self-hosted pipeline: Jenkins on AWS, Docker, Docker Hub and Kubernetes. It still talks to the same Supabase database.

## 2. Files added for the pipeline

| File | Purpose |
|---|---|
| `Jenkinsfile` | Declarative pipeline with 8 stages (below) |
| `Dockerfile` | 3-stage build: `deps` → `build` → small `runner` image (Next.js standalone, runs as non-root `node`, built-in HEALTHCHECK) |
| `.dockerignore` | Keeps `node_modules`, `.git`, `.env*` and backups out of the image |
| `k8s/deployment.yaml` | Deployment: 2 replicas, rolling update with `maxUnavailable: 0`, readiness/liveness probes on `/api/health`, CPU/memory limits |
| `k8s/service.yaml` | NodePort Service: port 80 → container 3000, exposed on node port 30080 |
| `infra/aws-launch.sh` | AWS CLI script (run in CloudShell): security group, EC2 instance, Elastic IP |
| `infra/ec2-bootstrap.sh` | EC2 user-data: installs Docker, Jenkins, Java 21, Node 22, kubectl, Minikube; starts Minikube as the `jenkins` user; forwards port 30080 |
| `app/api/health/route.ts` | Health endpoint returning status, app version and pod name |
| `tests/utils.test.mjs` | 6 unit tests for shared helpers (Node's built-in test runner) |

## 3. Pipeline stages

| # | Stage | What happens | Command(s) |
|---|---|---|---|
| 1 | Checkout | Jenkins pulls the latest commit from GitHub and makes the image tag `<build>-<commit>` (e.g. `3-4892080`) | `checkout scm`, `git rev-parse --short HEAD` |
| 2 | Install dependencies | Clean, reproducible install from the lockfile | `npm ci` |
| 3 | Lint & Test | Static checks and unit tests; any failure stops the pipeline | `npm run lint` (ESLint, 0 warnings), `npm run typecheck` (tsc), `npm test` (6 tests) |
| 4 | Build app | Production build of the Next.js app | `npm run build` |
| 5 | Docker Build | Image built from the Dockerfile, Supabase public values passed as build args from Jenkins credentials | `docker build -t rajd27/seniorcircle:<tag> -t …:latest .` |
| 6 | Push Image | Logs in with the token stored in Jenkins, pushes both tags | `docker login --password-stdin`, `docker push` |
| 7 | Deploy to Minikube | Puts the exact tag into the manifest, applies Service + Deployment, records the change cause, waits for the rollout | `kubectl apply -f`, `kubectl rollout status` |
| 8 | Verify | Shows deployment, pods, service, image per pod, rollout history; calls the health endpoint | `kubectl get …`, `curl http://$(minikube ip):30080/api/health` |

Post actions always run `docker logout` and prune dangling images.

**Triggers:** `githubPush()` (GitHub webhook → `http://<EC2-IP>:8080/github-webhook/`), with `pollSCM('H/5 * * * *')` as a fallback.

## 4. AWS infrastructure and Jenkins setup

1. **EC2 server:** launched from AWS CloudShell with `infra/aws-launch.sh` (region ap-south-1, Mumbai):
   - **m7i-flex.large** (2 vCPU, 8 GB, Free Tier eligible on accounts created after July 2025), Ubuntu 24.04, 30 GB gp3 disk.
   - **Security group** `seniorcircle-jenkins-sg`: inbound 22 (SSH / EC2 Instance Connect), 8080 (Jenkins), 30080 (application).
   - **Elastic IP** 43.204.146.198, so the address and the GitHub webhook survive stop/start.
2. **Bootstrap** (`infra/ec2-bootstrap.sh`, passed as user-data) installed automatically in ~4 minutes: Java 21, Jenkins 2.580.1 LTS, Docker 29.9, Node 22, kubectl 1.37, Minikube 1.39 (docker driver, 2 CPU / 3 GB), plus a 4 GB swap file. `jenkins` was added to the `docker` group. Systemd services start Minikube and the port forwarder on every boot.
3. **Jenkins first-time setup:** unlocked with `initialAdminPassword`, installed the suggested plugins, created the admin user.
4. **Extra plugins:** Docker Pipeline, Pipeline: Stage View (Git, GitHub, Credentials Binding and Timestamper came with the suggested set).
5. **Credentials** (Manage Jenkins → Credentials → Global). Secrets are masked as `****` in logs and never stored in the repo.

   | ID | Kind | Used for |
   |---|---|---|
   | `dockerhub-creds` | Username with password (Docker Hub access token, Read & Write) | `docker login` / `docker push` |
   | `supabase-url` | Secret text | Build arg `NEXT_PUBLIC_SUPABASE_URL` |
   | `supabase-anon-key` | Secret text | Build arg `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public key, protected by RLS) |

6. **Pipeline job** `seniorcircle-pipeline`: *Pipeline script from SCM* → Git → `https://github.com/Rajdeshmukhgit/seniorcircle.git`, branch `*/main`, script path `Jenkinsfile`. *GitHub hook trigger for GITScm polling* enabled.
7. **GitHub webhook:** repo Settings → Webhooks → `http://43.204.146.198:8080/github-webhook/`, content type JSON, push events.

## 5. Image registry

- Docker Hub repository: **`rajd27/seniorcircle`** (public, so Minikube can pull without a secret).
- Every build pushes a unique, traceable tag `<jenkins-build>-<git-commit>` plus `latest`.
- Pushed tags: `2-1865e0c` (version 1.0.0), `3-4892080` (version 2.0.0).

## 6. Deployment on Minikube and access

- Minikube runs on the EC2 host with the docker driver, owned by the `jenkins` user, so the pipeline can run `kubectl` directly.
- The Deployment pulls `docker.io/rajd27/seniorcircle:<tag>` (`imagePullPolicy: Always`) and runs **2 pods**. Readiness probes stop traffic reaching a pod until `/api/health` answers.
- The Service is a **NodePort** (`80 → 3000`, node port `30080`). Minikube's node IP (`192.168.49.2`) is private to the EC2 host, so a small systemd service (`socat`) forwards `EC2:30080 → minikube:30080`.
- **App URL:** http://43.204.146.198:30080, health check at `/api/health`.

Manual verification on the server:

```bash
sudo -u jenkins kubectl get deployments,pods,services -o wide
sudo -u jenkins kubectl rollout history deployment/seniorcircle
curl http://localhost:30080/api/health
```

## 7. Runs

| Build | Trigger | Commit | Result | Notes |
|---|---|---|---|---|
| #1 | SCM poll (first scan) | `1865e0c` | ❌ Failed at *Build app* | Credentials had been saved without the IDs the Jenkinsfile expects. Lint, typecheck and tests had already passed. Fixed by re-creating them as `supabase-url` / `supabase-anon-key` (Secret text) and `dockerhub-creds`. |
| #2 | Manual (Build Now) | `1865e0c` | ✅ 8/8 stages, ~3 min | First deployment, version **1.0.0**, image `2-1865e0c` |
| #3 | **GitHub push (webhook)** | `4892080` | ✅ 8/8 stages, 2 min 53 s | Code change → version **2.0.0**, image `3-4892080`, zero-downtime rolling update |

### Second run: what changed

Commit `4892080` "Release v2.0.0":
- `lib/constants/site.ts`: `APP_VERSION` `1.0.0` → `2.0.0` (shown in the footer and returned by `/api/health`).
- `components/home/Hero.tsx`: hero label now reads *"MIT · Senior–Junior Connect · Deployed via CI/CD"*.

Pushing this commit started build #3 automatically. Kubernetes replaced the pods one at a time (`maxUnavailable: 0`), so the site never went down, and `kubectl rollout history` shows both revisions with their Jenkins build and commit. `kubectl rollout undo deployment/seniorcircle` would return to version 1.0.0 in seconds.

## 8. Cost and shutdown

- m7i-flex.large is Free Tier eligible (covered by AWS credits). Stop the instance from the EC2 console when not demoing.
- On start, Jenkins, Minikube and the port forwarder come back up automatically; the Elastic IP keeps the same URL.
- After the course: terminate the instance and release the Elastic IP.
