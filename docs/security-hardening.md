# Security hardening notes

## Web updates

`POST /api/setting` no longer executes Git, npm, or process commands. Run `Update-software-pos.bat` locally after taking a backup and reviewing the build. Web-triggered deployment is intentionally disabled.

## Secrets

`.env.development` and `.env.production` are ignored and removed from Git tracking. Existing values remain in local files. Rotate `JWT_SECRET` and database credentials because the old values remain in Git history. History rewriting requires explicit approval.

`JWT_SECRET` must be at least 32 characters. `MONGODB_URI` and `JWT_SECRET` are required at runtime.

## Authentication

API access is fail-closed in middleware, with `/api/users/login` as the only public API route. Employee API access is limited to customer, invoice, product, and upload areas required by POS workflows. Login errors are generic and repeated failures receive a temporary in-process lockout.

## Uploads

Uploads require authentication, accept only PNG/JPEG/GIF/WebP content with matching magic bytes, are limited to 5 MB, and receive server-generated UUID filenames. Delete and listing routes reject non-generated filenames.
