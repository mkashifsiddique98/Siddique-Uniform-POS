# Production checklist

## Required decisions

- [ ] Rotate the JWT secret and MongoDB credentials; old values remain in Git history.
- [ ] Confirm whether MongoDB will remain standalone or run as a single-node replica set for transactions.
- [ ] Approve any invoice-numbering format change before changing it.
- [ ] Decide whether to run the optional legacy-password rehash script.
- [ ] Review and apply documented indexes during a maintenance window.

## Before deployment

- [ ] Copy `.env.example` to the environment-specific local file and fill values without committing it.
- [ ] Confirm `JWT_SECRET` is at least 32 characters and `MONGODB_URI` is present.
- [ ] Run `npm test -- --runInBand`.
- [ ] Run `npx tsc --noEmit` and resolve all non-baseline diagnostics.
- [ ] Run `npm run lint` and review all remaining diagnostics.
- [ ] Run `npm run build` with production environment values.
- [ ] Take a verified `mongodump` backup before updates.
- [ ] Use the local `Update-software-pos.bat`; web updates are disabled.
- [ ] Confirm PM2 starts the built app and `/api/health` is available once implemented.

## Post-deployment smoke test

- [ ] Login, logout, and failed-login lockout behave correctly.
- [ ] Employee access is limited to POS-required routes.
- [ ] Product scan, sale, return, invoice lookup, and receipt printing work.
- [ ] Customer balance and invoice history agree for a known fixture.
- [ ] Upload accepts valid images and rejects renamed/non-image files.
- [ ] Restore procedure has been tested against a copy, never live data.
