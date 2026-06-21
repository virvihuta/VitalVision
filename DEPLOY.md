# Deploy VitalVision

Frontend → Vercel. Backend → Render. ~5 minutes end-to-end.

## 1. Backend on Render

1. Push the repo to GitHub (or use the existing `virvihuta/VitalVision`).
2. Go to [render.com/new/blueprint](https://render.com/new/blueprint).
3. Connect the repo. Render picks up `render.yaml` automatically.
4. Click **Apply**. First build takes ~5–8 min (installing torch).
5. When live, copy the URL — looks like `https://vitalvision-api.onrender.com`.

> **Heads up — the PyTorch model file** (`ai/data/model.pt`, ~16 MB) is gitignored by `*.pt`, so it won't ship to Render. Without it, `/analyze` falls back to a hardcoded mock report.
>
> To ship the real model:
> ```bash
> git add -f ai/data/model.pt
> git commit -m "ship trained model weights for deploy"
> git push
> ```

> **Free plan note**: Render's free instances spin down after 15 min of inactivity. First request after idle takes ~30s to wake.

## 2. Frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the same GitHub repo.
3. In the import screen, set:
   - **Root Directory**: `frontend/vitalvision`
   - **Framework Preset**: Vite (auto-detected)
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://vitalvision-api.onrender.com` (your Render URL from step 1)
5. Click **Deploy**. ~1 min.

## 3. Smoke test

- Visit your Vercel URL.
- Log in with a seeded demo account: `dr.radiolog@vitalvision.al` / `password123`.
- Upload any chest X-ray (or any image). If you shipped `model.pt`, you'll get a real PyTorch prediction; otherwise the mock report.

## Updating

Both Vercel and Render auto-deploy on push to `main`. No further clicks needed.
