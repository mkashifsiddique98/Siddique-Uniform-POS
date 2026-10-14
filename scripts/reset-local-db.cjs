const fs = require("fs");
const path = require("path");
const readline = require("readline");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

function loadDevelopmentEnv() {
  const envPath = path.join(process.cwd(), ".env.development");
  if (!fs.existsSync(envPath)) throw new Error(".env.development was not found");
  const values = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^"']*)["']?\s*$/);
    if (match) values[match[1]] = match[2].trim();
  }
  return values;
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let answer = "";
    const onData = (chunk) => {
      const key = chunk.toString();
      if (key === "\u0003") process.exit(130);
      if (key === "\r" || key === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(answer);
      } else if (key === "\u0008" || key === "\u007f") {
        answer = answer.slice(0, -1);
      } else {
        answer += key;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  if (process.env.RESET_LOCAL_DB !== "YES") {
    throw new Error("Refusing to reset. Set RESET_LOCAL_DB=YES explicitly.");
  }

  const env = loadDevelopmentEnv();
  const uri = env.MONGODB_URI || "";
  const parsed = new URL(uri);
  if (!/^127\.0\.0\.1$|^localhost$/i.test(parsed.hostname) || parsed.pathname !== "/mypos") {
    throw new Error("Refusing to reset: only local database mypos is allowed.");
  }

  const password = await askHidden("New admin password: ");
  if (password.length < 12) throw new Error("Admin password must be at least 12 characters.");

  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const collection of collections) {
    await mongoose.connection.db.collection(collection.name).deleteMany({});
  }

  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    pages: { type: [String], default: [] },
    password: { type: String, required: true },
  }));
  await User.create({
    name: "kashif",
    email: "admin@pos.com",
    role: "admin",
    pages: ["dashboard", "product", "customer", "invoice", "purchase", "utilize", "user", "wholesalers"],
    password: await bcrypt.hash(password, 12),
  });

  await mongoose.disconnect();
  console.log("Local mypos database reset and admin user created.");
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Reset failed");
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
