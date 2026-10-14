// Merges legacy separate return lines (mode "return") into returns[] on the matching sale line.
// Usage: node scripts/merge-return-lines.cjs            (dry run, writes nothing)
//        node scripts/merge-return-lines.cjs --apply    (writes the changes)
// Merged entries have no time ("time not recorded"). Invoices with a return line that has no
// matching sale line are reported and left untouched.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { canonicalizeLines, computeReturnStatus, resolveMode } = require("../src/lib/posHelpers");

// Dry run is the default; --dry-run is accepted for clarity and always wins over --apply.
const apply = process.argv.includes("--apply") && !process.argv.includes("--dry-run");

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

const hasReturnLine = (invoice) =>
  (invoice.productDetail || []).some((line) => resolveMode(line) === "return");

async function main() {
  const uri = loadDevelopmentEnv().MONGODB_URI || "";
  if (!uri) throw new Error("MONGODB_URI is missing in .env.development");
  await mongoose.connect(uri);

  const collection = mongoose.connection.collection("invoices");
  const cursor = collection.find({ "productDetail.0": { $exists: true } });
  let candidates = 0;
  let invoicesMerged = 0;
  let linesMerged = 0;
  let orphanLines = 0;

  for await (const invoice of cursor) {
    if (!hasReturnLine(invoice)) continue;
    candidates += 1;

    const lines = canonicalizeLines(invoice.productDetail);
    // Return lines with a sale line are merged. Ones without a sale line stay as visible return rows.
    const orphans = lines.filter((line) => resolveMode(line) === "return").length;
    const merged = invoice.productDetail.filter((line) => resolveMode(line) === "return").length - orphans;
    orphanLines += orphans;
    if (merged <= 0) {
      console.log(`KEEP  invoice ${invoice.invoiceNo}: ${orphans} return line(s) without a sale line, nothing to merge`);
      continue;
    }

    const returnStatus = computeReturnStatus(lines);
    console.log(
      `${apply ? "MERGE" : "WOULD MERGE"} invoice ${invoice.invoiceNo}: ${merged} return line(s) into sale lines (${invoice.productDetail.length} -> ${lines.length} lines), status ${returnStatus}`
    );
    // Stock is not touched: the net units of the invoice are the same before and after the merge
    if (apply) {
      await collection.updateOne({ _id: invoice._id }, { $set: { productDetail: lines, returnStatus } });
    }
    invoicesMerged += 1;
    linesMerged += merged;
  }

  console.log(
    `${apply ? "Applied" : "Dry run"}: ${candidates} invoice(s) have return lines. ` +
      `${invoicesMerged} invoice(s) / ${linesMerged} line(s) ${apply ? "merged" : "would be merged"}, ` +
      `${orphanLines} return line(s) have no sale line and stay as return rows.`
  );
  if (!apply) console.log("Nothing was written. Re-run with --apply to save the changes.");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
