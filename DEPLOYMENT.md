# Deploying to Cloudflare Pages

1.  **Log in to Cloudflare Dashboard** and go to **Workers & Pages**.
2.  Click **Create Application** > **Pages** > **Connect to Git**.
3.  Select your repository (`mateodoyle`).
4.  **Configure the build settings**:
    *   **Production branch**: `main` (or `master`)
    *   **Framework preset**: `None`
    *   **Build command**: `npm run build` (or `node build.js`)
    *   **Build output directory**: `dist`
5.  Click **Save and Deploy**.

Cloudflare will verify the build environment, clone your repo, run `npm install` (to set up the environment, even if you have no dependencies), run your build command, and deploy the `dist` folder.
