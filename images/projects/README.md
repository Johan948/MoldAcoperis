# Project Images Structure

This folder stores project photos for portfolio items #1 to #29.

## Folder mapping
- Project 1 -> `images/projects/01/`
- Project 2 -> `images/projects/02/`
- ...
- Project 29 -> `images/projects/29/`

## File naming convention
- Main card and hero image (auto-detected in this order):
  - `<project-id>.webp` (example for project 1: `01.webp`)
  - `<project-id>.jpg`
  - `<project-id>.jpeg`
  - `<project-id>.png`
  - `<project-slug>.webp` (example: `capriana-arktica.webp`)
  - `<project-slug>.jpg`
  - `<project-slug>.jpeg`
  - `<project-slug>.png`
  - `cover.webp`
  - `cover.jpg`
  - `cover.jpeg`
  - `cover.png`
- Optional gallery images:
  - Numeric style (recommended):
    - `<project-id>-01.webp` (example: `01-01.webp`)
    - `<project-id>-02.webp`
    - ... up to `<project-id>-06.webp`
  - Same names also work with `.jpg`, `.jpeg`, `.png`
  - Alternative fallback names also accepted:
    - `gallery-01.webp` ... `gallery-06.webp`

## Recommended image specs
- `cover.webp`: 1600x1000 px (or larger, same ratio)
- Compression target: 150-350 KB per image when possible
- Format priority: WebP, with JPEG fallback only if needed

## Notes
- The frontend first tries `/images/projects/XX/XX.(webp|jpg|jpeg|png)`, then slug-based names, then `cover.(webp|jpg|jpeg|png)`.
- For project gallery, the frontend tries `/images/projects/XX/XX-01` ... `XX-06` with extensions `webp|jpg|jpeg|png`.
- If a cover image is missing, the existing visual fallback is shown.
