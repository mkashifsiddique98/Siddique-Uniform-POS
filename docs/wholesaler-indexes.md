# Wholesaler statement indexes

These indexes are recommendations only. They are not applied automatically and no migration or database command was run.

For the current supplier-purchase statement endpoints, review these additive indexes in the deployment environment:

```javascript
db.wholesalers.createIndex({ name: 1 });
db.wholesalers.createIndex({ phone: 1 });
db.wholesalers.createIndex({ pendingBalance: 1 });
db.purchases.createIndex({ "wholesaler._id": 1, createdAt: 1 });
db.purchases.createIndex({ createdAt: 1 });
db.invoices.createIndex({ "customer.phone": 1, invoiceDate: 1 });
db.invoices.createIndex({ "customer.customerName": 1, "customer.schoolName": 1, invoiceDate: 1 });
```

The index definitions should be reviewed against the actual MongoDB collection names and existing indexes before being applied. No destructive operation is required.

Invoice matching remains a legacy heuristic because invoices do not store a customer reference. The second index supports the fallback lookup but cannot make name matching unambiguous by itself.

Additional schema index definitions now cover invoice date/status/customer lookup, customer phone/name, product school/category and product code lookup, notification read/type/date, and utilize date ordering. Review `autoIndex` behavior and apply them during a maintenance window; the existing `productCode` field contains default `0` values, so a unique barcode index requires a separate duplicate cleanup decision.
