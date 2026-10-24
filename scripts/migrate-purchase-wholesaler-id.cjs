// Links existing purchases to their supplier (Wholesaler) by ID: sets purchase.wholesalerId.
// Order of matching: embedded wholesaler._id, then a unique match on embedded phone, then on name.
// Dry run by default. Use --apply to write.   node scripts/migrate-purchase-wholesaler-id.cjs [--apply]
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const apply = process.argv.includes("--apply") && !process.argv.includes("--dry-run");
const norm = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function loadUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.join(process.cwd(), ".env.development");
  if (!fs.existsSync(envPath)) throw new Error("Set MONGODB_URI or provide .env.development");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*MONGODB_URI\s*=\s*["']?([^"']*)["']?\s*$/);
    if (match) return match[1].trim();
  }
  throw new Error("MONGODB_URI is missing");
}

async function main() {
  await mongoose.connect(loadUri());
  const wholesalers = await mongoose.connection.collection("wholesalers").find({}).toArray();
  const purchases = mongoose.connection.collection("purchases");

  const byId = new Map(wholesalers.map((w) => [String(w._id), w._id]));
  const uniqueBy = (key) => {
    const groups = new Map();
    for (const w of wholesalers) {
      const k = norm(w[key]);
      if (!k) continue;
      groups.set(k, [...(groups.get(k) || []), w._id]);
    }
    return new Map([...groups].filter(([, ids]) => ids.length === 1).map(([k, ids]) => [k, ids[0]]));
  };
  const byPhone = uniqueBy("phone");
  const byName = uniqueBy("name");

  const stats = { byId: 0, byPhone: 0, byName: 0, unmatched: 0 };
  const unmatched = [];
  const cursor = purchases.find({ wholesalerId: { $exists: false } });
  for await (const purchase of cursor) {
    const embedded = purchase.wholesaler || {};
    let target = embedded._id && byId.get(String(embedded._id));
    let how = "byId";
    if (!target) { target = byPhone.get(norm(embedded.phone)); how = "byPhone"; }
    if (!target) { target = byName.get(norm(embedded.name)); how = "byName"; }
    if (!target) {
      stats.unmatched += 1;
      unmatched.push(String(purchase._id));
      continue;
    }
    stats[how] += 1;
    if (apply) await purchases.updateOne({ _id: purchase._id }, { $set: { wholesalerId: target } });
  }
  console.log(apply ? "APPLIED" : "DRY RUN (use --apply to write)", stats);
  if (unmatched.length) console.log("Unmatched purchase ids (need manual review):", unmatched.join(", "));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
