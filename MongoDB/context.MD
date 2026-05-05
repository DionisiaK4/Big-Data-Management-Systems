Τα collections δημιουργούνται αυτόματα όταν μπουν δεδομένα

vendors: stores marketplace vendors.
products: stores product listings and references vendors through vendor_id.
customers: stores customer profile and address information.
orders: stores customer purchases, embedding order line items inside each order document.

Index Γιατί υπάρχει
products.sku unique Για να μην υπάρχουν duplicate products με ίδιο SKU
orders.customer_id + created_at Για να βρίσκεις γρήγορα ιστορικό παραγγελιών πελάτη
orders.status Για να φιλτράρεις γρήγορα orders ανά κατάσταση
products text index Για να δουλεύει το full-text search προϊόντων

# Insert DATA

vendors
↓
products, επειδή κάθε product έχει vendor_id
↓
customers
↓
orders, επειδή κάθε order έχει customer_id και product_id μέσα στα items

AWAIT
The order of inserts matters:

vendors → products → customers → orders

Because:

products.vendor_id refers to real vendors.\_id
orders.customer_id refers to real customers.\_id
orders.items.product_id refers to real products.\_id

Products
20 products σε 5 categories:

| Category    | Products |
| ----------- | -------: |
| Electronics |        5 |
| Books       |        5 |
| Clothing    |        5 |
| Home        |        3 |
| Wellness    |        2 |

The insertProductSafe function prevents duplicate product insertion by checking the product SKU. It uses findOneAndUpdate with upsert: true and $setOnInsert, so a new product is inserted only when no existing product with the same SKU is found. Calling the function twice with SKU SNT-9999 demonstrates both branches: the first call inserts the product, while the second call skips it.

The updateMany operation applies a 10% discount to all Electronics products with stock greater than 50 by multiplying their price by 0.90. The operation prints both the number of matched documents and the number of modified documents.

Για κάθε product category να υπολογίσεις:

total_revenue: σύνολο unit_price × qty μόνο από delivered orders,
products_sold: αριθμός διαφορετικών products που πουλήθηκαν,
sort by total_revenue descending.

Για κάθε customer να υπολογίσεις:
| Field | Τι σημαίνει |
| -------------------- | ----------------------------------------------------------- |
| `total_orders` | πόσες παραγγελίες έχει συνολικά, ανεξάρτητα από status |
| `total_spent` | άθροισμα totals μόνο από delivered orders |
| `avg_order_value` | μέσο order total από όλα τα statuses |
| `favourite_category` | η category που εμφανίζεται περισσότερο στα delivered orders |
| customer name | από το `customers` collection με `$lookup` |

Να ομαδοποιήσεις orders ανά μήνα και να υπολογίσεις:

total_revenue,
number_of_orders,
avg_order_value.

Η εκφώνηση λέει ότι μπορείς να χρησιμοποιήσεις $dateToString ή $dateTrunc, αλλά στον τίτλο αναφέρει $bucket.

```

```
