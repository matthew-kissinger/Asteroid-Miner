# Public Directory

This directory contains static assets that are served directly without processing by Vite.

## Structure

- `assets/`: Game textures and visual assets
- `css/`: Stylesheets
- `sounds/`: Game audio files

In development, these files are served directly. In production, they are copied as-is to the output directory.

v0.7.0 notes:
- Assets under `public/` mirror `assets/` and `sounds/` for Vite static serving.
- No changes required for Hybrid-Tightening beyond keeping assets in-place.

During build, Vite will copy everything in this directory to the root of the build output. 