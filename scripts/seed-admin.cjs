const fs = require("fs");
const path = require("path");
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
  const env = loadDevelopmentEnv();
  const uri = env.MONGODB_URI || "";
  const parsed = new URL(uri);
  if (!/^127\.0\.0\.1$|^localhost$/i.test(parsed.hostname) || parsed.pathname !== "/mypos") {
    throw new Error("Refusing to seed: only local database mypos is allowed.");
  }

  const password = await askHidden("Admin password: ");
  if (password.length < 8) throw new Error("Admin password must be at least 8 characters.");

  await mongoose.connect(uri);
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    role: String,
    pages: [String],
    password: String,
  }));

  await User.findOneAndUpdate(
    { email: "admin@pos.com" },
    {
      $set: {
        name: "admin",
        email: "admin@pos.com",
        role: "admin",
        pages: ["customer", "invoice", "pos", "product", "user", "utilize", "purchase", "dashboard", "user/profile"],
        password: await bcrypt.hash(password, 12),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await mongoose.disconnect();
  console.log("Admin user seeded in local mypos.");
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Admin seed failed");
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
