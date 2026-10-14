This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

<<<<<<< HEAD
## MongoDB: replica set recommended

Saving, returning and deleting invoices update stock and the invoice atomically. On a replica set this uses a MongoDB transaction. On a standalone `mongod` (which rejects transactions with "Transaction numbers are only allowed on a replica set member") the app automatically falls back to guarded stock updates (`quantity >= qty`) and manually reverses the changes already made if a later step fails. The fallback is not isolated from concurrent edits of the same invoice and cannot recover if the server crashes mid-request, so a replica set is still recommended. A single-node replica set is enough:

1. Start `mongod` with a replica set name (or add `replication:\n  replSetName: rs0` to `mongod.cfg` and restart the MongoDB service):
   ```bash
   mongod --replSet rs0 --dbpath <your-data-dir>
   ```
2. Initiate it once from `mongosh`:
   ```js
   rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
   ```
3. Point the app at it in `.env.development` / `.env.production`:
   ```
   MONGODB_URI="mongodb://127.0.0.1:27017/mypos?replicaSet=rs0"
   ```

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
