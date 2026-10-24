# Supplier (Wholesaler) statement indexes

These indexes are recommendations only. They are not applied automatically.

Supplier (Wholesaler) statements use only `purchases` and `wholesalerpayments`. Link existing purchases first with `node scripts/migrate-purchase-wholesaler-id.cjs` (dry run) and `--apply`. Review these additive indexes in the deployment environment:

```javascript
db.wholesalers.createIndex({ name: 1 });
db.wholesalers.createIndex({ phone: 1 });
db.wholesalers.createIndex({ pendingBalance: 1 });
db.purchases.createIndex({ wholesalerId: 1, createdAt: 1 });
db.purchases.createIndex({ createdAt: 1 });
db.wholesalerpayments.createIndex({ wholesalerId: 1, date: 1 });
```

Wholesale Customer pages use `invoices` where `customer.type` is exactly `"wholesaler"`, matched by `customer._id`; the existing `{ "customer._id": 1, invoiceDate: -1 }` index covers it.

The index definitions should be reviewed against the actual MongoDB collection names and existing indexes before being applied. No destructive operation is required.

Additional schema index definitions now cover invoice date/status/customer lookup, customer phone/name, product school/category and product code lookup, notification read/type/date, and utilize date ordering. Review `autoIndex` behavior and apply them during a maintenance window; the existing `productCode` field contains default `0` values, so a unique barcode index requires a separate duplicate cleanup decision.
