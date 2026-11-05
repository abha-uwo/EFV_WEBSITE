# EFV Unified Monorepo (Single Service Deployment)

Yeh project **Next.js Frontend (`EFV-F`)** aur **Express.js Backend (`EFV-B`)** ko ek single service container ke roop mein deploy karne ke liye configure kiya gaya hai.

---

## 🌟 Architecture Overview

```
                          [ Incoming Web Request ]
                                     │
                                     ▼
                    [ Express Gateway (Port: 8080 / $PORT) ]
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
      [ /api/*, /uploads/*,                 [ All Frontend Requests ]
       /content/*, /health ]                 (/, /dashboard, /marketplace,
             │                                /_next/*, static pages)
             ▼                                               │
   [ Express Route Handlers & DB ]                           ▼
                                            [ Next.js Standalone (Port: 3000) ]
```

### Key Advantages:
1. **Single Service**: Frontend aur backend dono ek hi container aur ek hi domain/port par chalte hain.
2. **Zero CORS Issues**: Browser same-origin pe calls karta hai, CORS errors aur preflight delays completely eliminate ho jate hain.
3. **Huge Upload Timeouts Preserved**: Audiobooks aur eBooks ke large file uploads direct Express handler ko jate hain (30 min timeout configured).
4. **Google Cloud Run Ready**: Container dynamic `$PORT` environment variable ko support karta hai.

---

## 🛠️ Local Development

### 1. Install All Dependencies:
```bash
npm run install:all
```

### 2. Run Both Services Concurrently:
```bash
npm run dev
```
- **Backend**: Runs on `http://localhost:8080`
- **Frontend**: Runs on `http://localhost:3000`

---

## 🚀 Deployment to Google Cloud Run

### Option A: Via Google Cloud Build (Recommended)
Root folder me `cloudbuild.yaml` file maujood hai. Terminal se deploy karne ke liye:
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Option B: Direct Docker Build & Deploy
```bash
# 1. Build image
docker build -t gcr.io/YOUR_PROJECT_ID/efv-unified:latest .

# 2. Push image
docker push gcr.io/YOUR_PROJECT_ID/efv-unified:latest

# 3. Deploy to Cloud Run
gcloud run deploy efv-unified \
  --image gcr.io/YOUR_PROJECT_ID/efv-unified:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 1800
```

---

## 📁 Repository Directory Structure

```
EFV/
├── Dockerfile              # Multi-stage production container build
├── cloudbuild.yaml         # Cloud Build automated pipeline
├── start.sh                # Container process manager (launches both services)
├── package.json            # Monorepo command runner
├── .dockerignore           # Excludes heavy folders from Docker context
├── .gitignore              # Git ignore rules for root repository
├── EFV-B/                  # Express Backend (APIs, Database, Auth, Payments)
└── EFV-F/                  # Next.js Frontend (Pages, Components, Public Assets)
```
