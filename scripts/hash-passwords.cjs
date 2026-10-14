// One-time, idempotent migration: hashes plain-text user passwords with bcrypt.
// Usage:  node scripts/hash-passwords.cjs [--env=.env.production] [--dry-run]
// Prints counts only. Never prints passwords, hashes or connection strings.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$/;

function loadEnv(file) {
  const envPath = path.join(process.cwd(), file);
  if (!fs.existsSync(envPath)) throw new Error(`${file} was not found`);
  const values = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"']*)["']?\s*$/);
    if (match) values[match[1]] = match[2].trim();
  }
  return values;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const envArg = args.find((a) => a.startsWith("--env="));
  const env = loadEnv(envArg ? envArg.slice(6) : ".env.development");
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is missing in the env file");

  await mongoose.connect(env.MONGODB_URI);
  const users = mongoose.connection.collection("users");

  let total = 0;
  let alreadyHashed = 0;
  let empty = 0;
  const ops = [];

  for await (const user of users.find({}, { projection: { password: 1 } })) {
    total += 1;
    const current = typeof user.password === "string" ? user.password : "";
    if (!current) {
      empty += 1;
    } else if (BCRYPT_RE.test(current)) {
      alreadyHashed += 1;
    } else {
      ops.push({
        updateOne: {
          // Filtering on the old value keeps this safe if the user changed password meanwhile.
          filter: { _id: user._id, password: current },
          update: { $set: { password: await bcrypt.hash(current, 10) } },
        },
      });
    }
  }

  console.log(`Users: ${total}, already hashed: ${alreadyHashed}, empty/missing: ${empty}, to hash: ${ops.length}`);

  if (dryRun) {
    console.log("Dry run: no changes written.");
  } else if (ops.length > 0) {
    const result = await users.bulkWrite(ops, { ordered: false });
    console.log(`Hashed ${result.modifiedCount} password(s).`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Password migration failed");
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
