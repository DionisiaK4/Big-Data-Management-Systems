Η MongoDB δεν δουλεύει με πίνακες όπως SQL. Αποθηκεύει δεδομένα ως documents, δηλαδή JSON-like αντικείμενα, μέσα σε collections. Ένα database περιέχει collections και κάθε collection περιέχει documents.


Για τις παραγγελίες, η εργασία θέλει τα προϊόντα της παραγγελίας να είναι ενσωματωμένα μέσα στο order: {
  customer_id: ObjectId("..."),
  status: "delivered",
  items: [
    {
      product_id: ObjectId("..."),
      sku: "SNT-1001",
      name: "Wireless Headphones",
      qty: NumberInt(2),
      unit_price: NumberDecimal("89.99")
    }
  ],
Αυτό λέγεται embedding. Αντί να έχεις ξεχωριστό order_items collection, βάζεις τα line items μέσα στο orders.


1. Introduction
2. Schema Design
3. Embedding Decision Justification
4. Indexes
5. Data Population
6. Conditional Insert and Bulk Update
7. Queries
   7.1 Books Query
   7.2 Array Tags Query
   7.3 Full-text Search
   7.4 Nested Customer Query
   7.5 Embedded Array Query
   7.6 Date Range Query
8. Aggregation Pipelines
   8.1 Revenue by Category
   8.2 Customer Lifetime Value
   8.3 Monthly Sales Trend
   8.4 Vendor Performance Report
9. Conclusion



Τα collections δημιουργούνται αυτόματα όταν μπουν δεδομένα


vendors: stores marketplace vendors.
products: stores product listings and references vendors through vendor_id.
customers: stores customer profile and address information.
orders: stores customer purchases, embedding order line items inside each order document.

gia vendors: 
 
Plain Text
{
  _id: ObjectId,
  name: String,
  email: String,
  country: String,
  created_at: Date
}



Το SKU σημαίνει Stock Keeping Unit.



db.products.createIndex(
  { sku: 1 },
  { unique: true }
)
 
 
Χρήση	Περιγραφή
Ταχύτητα	Βρίσκει γρήγορα προϊόν με συγκεκριμένο SKU
Ακεραιότητα	Απαγορεύει duplicates
 
 
db.orders.createIndex(
  { customer_id: 1, created_at: -1 }
)
 
Αυτό λέγεται compound index, γιατί έχει περισσότερα από ένα πεδία.
1	ascending order
 
-1	descending order
Οργάνωσε τα orders πρώτα με βάση τον πελάτη και μετά με ημερομηνία από την πιο πρόσφατη προς την παλαιότερη.
εργασία λέει ότι αυτό υποστηρίζει customer order history lookups.
 
Δείξε μου όλες τις παραγγελίες της Θεοδώρας, από την πιο πρόσφατη στην πιο παλιά.
Χωρίς index, η MongoDB θα ψάξει πολλά orders και μετά θα τα ταξινομήσει.
Με αυτό το index, τα orders είναι ήδη οργανωμένα με τρόπο που βοηθά αυτό το query.
 
 
db.orders.createIndex(
  { status: 1 }
)
 
Βοηθάει queries που φιλτράρουν orders με βάση status.
Στην εργασία, το status μπορεί να είναι:
"pending"
"shipped"
"delivered"
"cancelled"



db.products.createIndex(
  {
    name: "text",
    tags: "text",
    category: "text"
  }
)
 
Επιτρέπει στη MongoDB να ψάχνει λέξεις μέσα σε text fields.
 
 
Index	Γιατί υπάρχει
products.sku unique	Για να μην υπάρχουν duplicate products με ίδιο SKU
orders.customer_id + created_at	Για να βρίσκεις γρήγορα ιστορικό παραγγελιών πελάτη
orders.status	Για να φιλτράρεις γρήγορα orders ανά κατάσταση
products text index	Για να δουλεύει το full-text search προϊόντων
 


 # Insert DATA

vendors
  ↓
products, επειδή κάθε product έχει vendor_id
  ↓
customers
  ↓
orders, επειδή κάθε order έχει customer_id και product_id μέσα στα items


vendors
 {
  _id: ObjectId,
  name: String,
  email: String,
  country: String,
  created_at: Date
}


AWAIT
The order of inserts matters:

vendors → products → customers → orders

Because:

products.vendor_id refers to real vendors._id
orders.customer_id refers to real customers._id
orders.items.product_id refers to real products._id

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
| Field                | Τι σημαίνει                                                 |
| -------------------- | ----------------------------------------------------------- |
| `total_orders`       | πόσες παραγγελίες έχει συνολικά, ανεξάρτητα από status      |
| `total_spent`        | άθροισμα totals μόνο από delivered orders                   |
| `avg_order_value`    | μέσο order total από όλα τα statuses                        |
| `favourite_category` | η category που εμφανίζεται περισσότερο στα delivered orders |
| customer name        | από το `customers` collection με `$lookup`                  |


Να ομαδοποιήσεις orders ανά μήνα και να υπολογίσεις:

total_revenue,
number_of_orders,
avg_order_value.

Η εκφώνηση λέει ότι μπορείς να χρησιμοποιήσεις $dateToString ή $dateTrunc, αλλά στον τίτλο αναφέρει $bucket.