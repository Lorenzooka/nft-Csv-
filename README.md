
# All Star NFT – Image & CSV Simulator (Live)

This folder contains a production‑ready **single‑file static site** (`index.html`).
It lets you upload a base image, tune traits (background, aura, chest crystal, rarity), export a 1024×1024 PNG, and build an OpenSea‑compatible CSV.

## Quick local preview
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages (free)
1) Create a repo, e.g. `all-star-nft-live` and put `index.html` in the repo root.  
2) Push:
```bash
git init
git add index.html
git commit -m "All Star NFT – live"
git branch -M main
git remote add origin https://github.com/<your-user>/all-star-nft-live.git
git push -u origin main
```
3) On GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / folder **/**  
4) Your site: `https://<your-user>.github.io/all-star-nft-live/`

## Deploy to Netlify (drag & drop)
1) Zip this folder and drag it into Netlify → Add new site → Deploy manually.  
2) You’ll get `https://<random>.netlify.app`.

## Deploy to Vercel (from GitHub)
1) Push to GitHub.  
2) Vercel → Add New Project → import the repo → Deploy.

---

### Notes
- No server needed. It’s a static canvas app that uses client‑side file uploads and `toDataURL()` to export PNGs and a CSV.  
- Works on all modern browsers. If a mobile browser blocks automatic download, it will still open the PNG in a new tab for manual save.
