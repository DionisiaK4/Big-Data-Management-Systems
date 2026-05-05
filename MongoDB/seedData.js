// SEED DATA
 
// First, I manually create ObjectIds for vendors and customers so that references are consistent.
// The order of inserts matters: Vendors → Products → Customers → Orders
// Products will reference real vendor ObjectIds.
// Orders will reference real customer and product ObjectIds.
 
const vendorIds = {
  techHaven: new ObjectId(),
  bookWorld: new ObjectId(),
  styleHub: new ObjectId()
};

const customerIds = {
  eleni: new ObjectId(),
  nikos: new ObjectId(),
  maria: new ObjectId(),
  anna: new ObjectId(),
  peter: new ObjectId(),
  sofia: new ObjectId(),
  luca: new ObjectId(),
  isabel: new ObjectId(),
  kostas: new ObjectId(),
  emma: new ObjectId()
};


//Vendors (at least 3 vendors from different countries)
db.vendors.insertMany([
  {
    _id: vendorIds.techHaven,
    name: "Tech Haven",
    email: "sales@techhaven.example",
    country: "Germany",
    created_at: new Date("2026-01-10")
  },
  {
    _id: vendorIds.bookWorld,
    name: "Book World",
    email: "contact@bookworld.example",
    country: "Greece",
    created_at: new Date("2026-01-15")
  },
  {
    _id: vendorIds.styleHub,
    name: "Style Hub",
    email: "hello@stylehub.example",
    country: "Italy",
    created_at: new Date("2026-01-20")
  }
]);


// Products (at least 20 products across different categories, referencing the correct vendor ObjectIds)
// Create 20 oproducts across 5 categories (Electronics, Books, Clothing, Home, Wellness)
// for simplicity I use a objects to store the products and then insert them all at once.
const productCatalog = {
  wirelessHeadphones: {
    _id: new ObjectId(),
    sku: "SNT-1001",
    name: "Wireless Headphones",
    category: "Electronics",
    vendor_id: vendorIds.techHaven,
    price: "89.99",
    stock: 120,
    ratings: { average: 4.6, count: 210 },
    tags: ["wireless", "headphones", "featured", "new-arrival"],
    created_at: new Date("2026-02-01")
  },
  bluetoothSpeaker: {
    _id: new ObjectId(),
    sku: "SNT-1002",
    name: "Bluetooth Speaker",
    category: "Electronics",
    vendor_id: vendorIds.techHaven,
    price: "59.99",
    stock: 80,
    ratings: { average: 4.2, count: 150 },
    tags: ["wireless", "audio", "sale"],
    created_at: new Date("2026-02-02")
  },
  smartwatch: {
    _id: new ObjectId(),
    sku: "SNT-1003",
    name: "Smartwatch",
    category: "Electronics",
    vendor_id: vendorIds.techHaven,
    price: "149.99",
    stock: 45,
    ratings: { average: 4.4, count: 98 },
    tags: ["wearable", "featured"],
    created_at: new Date("2026-02-03")
  },
  mechanicalKeyboard: {
    _id: new ObjectId(),
    sku: "SNT-1004",
    name: "Mechanical Keyboard",
    category: "Electronics",
    vendor_id: vendorIds.techHaven,
    price: "109.99",
    stock: 70,
    ratings: { average: 4.7, count: 180 },
    tags: ["keyboard", "gaming", "featured", "sale"],
    created_at: new Date("2026-02-04")
  },
  usbHub: {
    _id: new ObjectId(),
    sku: "SNT-1005",
    name: "USB-C Hub",
    category: "Electronics",
    vendor_id: vendorIds.techHaven,
    price: "24.99",
    stock: 150,
    ratings: { average: 4.1, count: 75 },
    tags: ["accessory", "new-arrival"],
    created_at: new Date("2026-02-05")
  },
 
  mongodbGuidebook: {
    _id: new ObjectId(),
    sku: "SNT-2001",
    name: "MongoDB Practical Guide",
    category: "Books",
    vendor_id: vendorIds.bookWorld,
    price: "25.99",
    stock: 60,
    ratings: { average: 4.5, count: 64 },
    tags: ["database", "featured", "new-arrival"],
    created_at: new Date("2026-02-06")
  },
  javascriptBasics: {
    _id: new ObjectId(),
    sku: "SNT-2002",
    name: "JavaScript Basics",
    category: "Books",
    vendor_id: vendorIds.bookWorld,
    price: "19.99",
    stock: 35,
    ratings: { average: 4.0, count: 85 },
    tags: ["programming", "sale"],
    created_at: new Date("2026-02-07")
  },
  aiHandbook: {
    _id: new ObjectId(),
    sku: "SNT-2003",
    name: "AI Handbook",
    category: "Books",
    vendor_id: vendorIds.bookWorld,
    price: "32.50",
    stock: 25,
    ratings: { average: 4.8, count: 120 },
    tags: ["ai", "featured"],
    created_at: new Date("2026-02-08")
  },
  cookingBook: {
    _id: new ObjectId(),
    sku: "SNT-2004",
    name: "Cooking Book",
    category: "Books",
    vendor_id: vendorIds.bookWorld,
    price: "14.99",
    stock: 40,
    ratings: { average: 3.9, count: 40 },
    tags: ["cooking", "clearance"],
    created_at: new Date("2026-02-09")
  },
  mysteryNovel: {
    _id: new ObjectId(),
    sku: "SNT-2005",
    name: "Mystery Novel",
    category: "Books",
    vendor_id: vendorIds.bookWorld,
    price: "12.99",
    stock: 90,
    ratings: { average: 4.3, count: 210 },
    tags: ["fiction", "new-arrival"],
    created_at: new Date("2026-02-10")
  },
 
  tshirt: {
    _id: new ObjectId(),
    sku: "SNT-3001",
    name: "Cotton T-Shirt",
    category: "Clothing",
    vendor_id: vendorIds.styleHub,
    price: "15.99",
    stock: 200,
    ratings: { average: 4.1, count: 95 },
    tags: ["cotton", "sale"],
    created_at: new Date("2026-02-11")
  },
  jeans: {
    _id: new ObjectId(),
    sku: "SNT-3002",
    name: "Blue Jeans",
    category: "Clothing",
    vendor_id: vendorIds.styleHub,
    price: "39.99",
    stock: 65,
    ratings: { average: 4.0, count: 105 },
    tags: ["denim", "featured"],
    created_at: new Date("2026-02-12")
  },
  sneakers: {
    _id: new ObjectId(),
    sku: "SNT-3003",
    name: "Running Sneakers",
    category: "Clothing",
    vendor_id: vendorIds.styleHub,
    price: "74.99",
    stock: 55,
    ratings: { average: 4.5, count: 160 },
    tags: ["shoes", "new-arrival", "featured"],
    created_at: new Date("2026-02-13")
  },
  jacket: {
    _id: new ObjectId(),
    sku: "SNT-3004",
    name: "Winter Jacket",
    category: "Clothing",
    vendor_id: vendorIds.styleHub,
    price: "99.99",
    stock: 20,
    ratings: { average: 4.6, count: 72 },
    tags: ["winter", "clearance"],
    created_at: new Date("2026-02-14")
  },
  backpack: {
    _id: new ObjectId(),
    sku: "SNT-3005",
    name: "Travel Backpack",
    category: "Clothing",
    vendor_id: vendorIds.styleHub,
    price: "44.99",
    stock: 75,
    ratings: { average: 4.2, count: 130 },
    tags: ["travel", "sale"],
    created_at: new Date("2026-02-15")
  },
 
  coffeeMaker: {
    _id: new ObjectId(),
    sku: "SNT-4001",
    name: "Coffee Maker",
    category: "Home",
    vendor_id: vendorIds.styleHub,
    price: "79.99",
    stock: 35,
    ratings: { average: 4.3, count: 88 },
    tags: ["kitchen", "featured"],
    created_at: new Date("2026-02-16")
  },
  deskLamp: {
    _id: new ObjectId(),
    sku: "SNT-4002",
    name: "LED Desk Lamp",
    category: "Home",
    vendor_id: vendorIds.styleHub,
    price: "34.99",
    stock: 85,
    ratings: { average: 4.1, count: 66 },
    tags: ["office", "new-arrival"],
    created_at: new Date("2026-02-17")
  },
  waterBottle: {
    _id: new ObjectId(),
    sku: "SNT-4003",
    name: "Reusable Water Bottle",
    category: "Home",
    vendor_id: vendorIds.styleHub,
    price: "11.99",
    stock: 160,
    ratings: { average: 4.0, count: 140 },
    tags: ["eco", "sale"],
    created_at: new Date("2026-02-18")
  },
 
  yogaMat: {
    _id: new ObjectId(),
    sku: "SNT-5001",
    name: "Yoga Mat",
    category: "Wellness",
    vendor_id: vendorIds.styleHub,
    price: "29.99",
    stock: 95,
    ratings: { average: 4.4, count: 115 },
    tags: ["fitness", "new-arrival"],
    created_at: new Date("2026-02-19")
  },
  faceCream: {
    _id: new ObjectId(),
    sku: "SNT-5002",
    name: "Hydrating Face Cream",
    category: "Wellness",
    vendor_id: vendorIds.styleHub,
    price: "22.99",
    stock: 50,
    ratings: { average: 4.2, count: 58 },
    tags: ["beauty", "featured", "clearance"],
    created_at: new Date("2026-02-20")
  }
};

// Insert Products into the database. 
db.products.insertMany(
  Object.values(productCatalog).map(product => ({
    _id: product._id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    vendor_id: product.vendor_id,
    price: NumberDecimal(product.price),
    stock: NumberInt(product.stock),
    ratings: {
      average: product.ratings.average,
      count: NumberInt(product.ratings.count)
    },
    tags: product.tags,
    created_at: product.created_at
  }))
);


// Customers (at least 10 customers  with a mix of tiers and countries)
db.customers.insertMany([
  {
    _id: customerIds.eleni,
    email: "eleni.papadopoulou@example.com",
    name: "Eleni Papadopoulou",
    address: {
      city: "Athens",
      country: "Greece"
    },
    tier: "gold",
    joined_at: new Date("2025-11-10")
  },
  {
    _id: customerIds.nikos,
    email: "nikos.georgiou@example.com",
    name: "Nikos Georgiou",
    address: {
      city: "Thessaloniki",
      country: "Greece"
    },
    tier: "silver",
    joined_at: new Date("2025-12-01")
  },
  {
    _id: customerIds.maria,
    email: "maria.christou@example.com",
    name: "Maria Christou",
    address: {
      city: "Nicosia",
      country: "Cyprus"
    },
    tier: "bronze",
    joined_at: new Date("2026-01-05")
  },
  {
    _id: customerIds.anna,
    email: "anna.mueller@example.com",
    name: "Anna Mueller",
    address: {
      city: "Berlin",
      country: "Germany"
    },
    tier: "gold",
    joined_at: new Date("2025-10-15")
  },
  {
    _id: customerIds.peter,
    email: "peter.schmidt@example.com",
    name: "Peter Schmidt",
    address: {
      city: "Munich",
      country: "Germany"
    },
    tier: "silver",
    joined_at: new Date("2026-01-12")
  },
  {
    _id: customerIds.sofia,
    email: "sofia.martin@example.com",
    name: "Sofia Martin",
    address: {
      city: "Paris",
      country: "France"
    },
    tier: "gold",
    joined_at: new Date("2025-09-20")
  },
  {
    _id: customerIds.luca,
    email: "luca.rossi@example.com",
    name: "Luca Rossi",
    address: {
      city: "Rome",
      country: "Italy"
    },
    tier: "bronze",
    joined_at: new Date("2026-02-01")
  },
  {
    _id: customerIds.isabel,
    email: "isabel.garcia@example.com",
    name: "Isabel Garcia",
    address: {
      city: "Madrid",
      country: "Spain"
    },
    tier: "silver",
    joined_at: new Date("2026-02-12")
  },
  {
    _id: customerIds.kostas,
    email: "kostas.dimitriou@example.com",
    name: "Kostas Dimitriou",
    address: {
      city: "Patras",
      country: "Greece"
    },
    tier: "bronze",
    joined_at: new Date("2026-03-01")
  },
  {
    _id: customerIds.emma,
    email: "emma.jansen@example.com",
    name: "Emma Jansen",
    address: {
      city: "Amsterdam",
      country: "Netherlands"
    },
    tier: "gold",
    joined_at: new Date("2025-08-05")
  }
]);



// Orders
// Use helper functions to create orders to avoid manual errors and ensure consistency in the data.

// makeItem(productKey, qty): creates a line item for an order:
function makeItem(productKey, qty) {
  const product = productCatalog[productKey];
 
  return {
    product_id: product._id,
    sku: product.sku,
    name: product.name,
    qty: NumberInt(qty),
    unit_price: NumberDecimal(product.price)
  };
}

// makeOrder(customerId, status, createdAt, itemSpecs): creates an order document calculating the total:
function makeOrder(customerId, status, createdAt, itemSpecs) {
  const items = itemSpecs.map(([productKey, qty]) => makeItem(productKey, qty));
 
  const total = itemSpecs.reduce((sum, [productKey, qty]) => {
    return sum + Number(productCatalog[productKey].price) * qty;
  }, 0);
 
  return {
    _id: new ObjectId(),
    customer_id: customerId,
    status: status,
    items: items,
    total: NumberDecimal(total.toFixed(2)),
    created_at: new Date(createdAt)
  };
}
 

// Create at least 30 orders with a mix of statuses, dates, and customers.
// One customer must have placed 5+ orders, and there should be at least 5 cancelled orders to test cancellation-related queries.
db.orders.insertMany([
  // Eleni: 6 orders
  makeOrder(customerIds.eleni, "delivered", "2026-04-30T10:00:00Z", [
    ["wirelessHeadphones", 1],
    ["usbHub", 2]
  ]),
  makeOrder(customerIds.eleni, "delivered", "2026-04-25T12:30:00Z", [
    ["mongodbGuidebook", 1],
    ["javascriptBasics", 1]
  ]),
  makeOrder(customerIds.eleni, "shipped", "2026-04-21T09:15:00Z", [
    ["tshirt", 2],
    ["backpack", 1]
  ]),
  makeOrder(customerIds.eleni, "delivered", "2026-04-10T15:45:00Z", [
    ["coffeeMaker", 1]
  ]),
  makeOrder(customerIds.eleni, "cancelled", "2026-04-03T11:20:00Z", [
    ["smartwatch", 1]
  ]),
  makeOrder(customerIds.eleni, "pending", "2026-05-02T14:00:00Z", [
    ["faceCream", 2]
  ]),
 
  // Nikos: 4 orders
  makeOrder(customerIds.nikos, "delivered", "2026-04-28T10:10:00Z", [
    ["wirelessHeadphones", 2]
  ]),
  makeOrder(customerIds.nikos, "delivered", "2026-04-14T16:00:00Z", [
    ["jeans", 1],
    ["sneakers", 1]
  ]),
  makeOrder(customerIds.nikos, "pending", "2026-05-01T09:00:00Z", [
    ["aiHandbook", 1]
  ]),
  makeOrder(customerIds.nikos, "cancelled", "2026-03-25T13:30:00Z", [
    ["jacket", 1]
  ]),
 
  // Maria: 3 orders
  makeOrder(customerIds.maria, "delivered", "2026-04-12T08:45:00Z", [
    ["waterBottle", 4]
  ]),
  makeOrder(customerIds.maria, "delivered", "2026-03-18T17:20:00Z", [
    ["cookingBook", 2]
  ]),
  makeOrder(customerIds.maria, "shipped", "2026-04-22T18:30:00Z", [
    ["deskLamp", 1]
  ]),
 
  // Anna: 4 orders
  makeOrder(customerIds.anna, "delivered", "2026-04-27T10:50:00Z", [
    ["mechanicalKeyboard", 1],
    ["bluetoothSpeaker", 1]
  ]),
  makeOrder(customerIds.anna, "delivered", "2026-04-05T19:00:00Z", [
    ["mysteryNovel", 3]
  ]),
  makeOrder(customerIds.anna, "pending", "2026-05-03T11:00:00Z", [
    ["yogaMat", 1]
  ]),
  makeOrder(customerIds.anna, "cancelled", "2026-04-01T08:30:00Z", [
    ["usbHub", 3]
  ]),
 
  // Peter: 3 orders
  makeOrder(customerIds.peter, "delivered", "2026-04-29T14:30:00Z", [
    ["smartwatch", 1]
  ]),
  makeOrder(customerIds.peter, "delivered", "2026-04-20T16:45:00Z", [
    ["deskLamp", 1],
    ["backpack", 1]
  ]),
  makeOrder(customerIds.peter, "cancelled", "2026-03-29T10:15:00Z", [
    ["coffeeMaker", 1]
  ]),
 
  // Sofia: 3 orders
  makeOrder(customerIds.sofia, "delivered", "2026-04-18T12:10:00Z", [
    ["aiHandbook", 2]
  ]),
  makeOrder(customerIds.sofia, "shipped", "2026-04-24T09:40:00Z", [
    ["faceCream", 1],
    ["tshirt", 3]
  ]),
  makeOrder(customerIds.sofia, "cancelled", "2026-04-06T15:10:00Z", [
    ["bluetoothSpeaker", 1]
  ]),
 
  // Luca: 3 orders
  makeOrder(customerIds.luca, "delivered", "2026-04-16T13:25:00Z", [
    ["sneakers", 2]
  ]),
  makeOrder(customerIds.luca, "delivered", "2026-03-30T12:00:00Z", [
    ["jeans", 1],
    ["jacket", 1]
  ]),
  makeOrder(customerIds.luca, "pending", "2026-04-26T18:10:00Z", [
    ["mongodbGuidebook", 1]
  ]),
 
  // Isabel: 2 orders
  makeOrder(customerIds.isabel, "delivered", "2026-04-19T11:55:00Z", [
    ["deskLamp", 2]
  ]),
  makeOrder(customerIds.isabel, "delivered", "2026-03-22T09:30:00Z", [
    ["waterBottle", 5]
  ]),
 
  // Kostas: 1 order
  makeOrder(customerIds.kostas, "delivered", "2026-04-23T17:35:00Z", [
    ["backpack", 1],
    ["mysteryNovel", 2]
  ]),
 
  // Emma: 1 order
  makeOrder(customerIds.emma, "delivered", "2026-04-11T10:25:00Z", [
    ["faceCream", 1],
    ["yogaMat", 1]
  ])
]);