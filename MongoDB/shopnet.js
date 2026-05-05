// Select database: it will be created but not shown in the beginning beacuse it is empty
use("shopnest");

// Clear old data collections if they exist
db.products.drop();
db.customers.drop();
db.orders.drop();
db.vendors.drop();

print("ShopNest database initialized successfully.");
 

// Create Basic Indexes

// Ensures each product SKU is unique and supports fast product lookup by SKU.
db.products.createIndex(
  { sku: 1 },
  { unique: true }
);

// Supports retrieving a customer's order history sorted from newest to oldest.
db.orders.createIndex(
  { customer_id: 1, created_at: -1 }
);

// Supports dashboard filters by order status ("pending", "shipped","delivered","cancelled").
db.orders.createIndex(
  { status: 1 }
);
 
// Create Additional Indexes that will be useful for queries
// Supports full-text product search by product name, tags and category.
db.products.createIndex(
  { name: "text", tags: "text", category: "text" }
);

//TODO
// Supports product grouping and vendor-related reporting.
// db.products.createIndex({ vendor_id: 1 });


// Insert Seed Data
load("seedData.js");

// Conditional insert with duplicate detection
async function insertProductSafe(product) {
  // Each call gets a unique attempt marker.
  // If the returned document contains this exact marker, it means this call inserted it.
  const insertAttemptId = new ObjectId();
 
  const productToInsert = {
    _id: product._id || new ObjectId(),
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
    created_at: product.created_at || new Date(),
    insert_attempt_id: insertAttemptId
  };
 
  const result = await db.products.findOneAndUpdate(
    { sku: product.sku },
    {
      $setOnInsert: productToInsert
    },
    {
      upsert: true,
      returnDocument: "after"
    }
  );
 
  if (result.insert_attempt_id && result.insert_attempt_id.equals(insertAttemptId)) {
    console.log(`Inserted: ${product.sku}`);
  } else {
    console.log(`Skipped (exists): ${product.sku}`);
  }
}

// Queries

// Helper function to print query results in a readable format
async function printQueryResults(title, cursor, description) {
  console.log("\n=====================================================");
  console.log(title);
  console.log("=====================================================");
  console.log("Description:");
  console.log(description);
  console.log("\nFirst 3 result documents:");
  printjson(await cursor.limit(3).toArray());
}

// Aggregation Pipelines

// Helper function to print aggregation results in a readable format
async function printAggregationResults(title, collection, pipeline, description) {
  console.log("\n=====================================================");
  console.log(title);
  console.log("=====================================================");
  console.log("Description:");
  console.log(description);
  console.log("\nAggregation results:");
  printjson(await collection.aggregate(pipeline).toArray());
}
 

// 1. Revenue by category
const revenueByCategoryPipeline = [
  {
    $match: {
      status: "delivered"
    }
  },
  {
    $unwind: "$items"
  },
  {
    $lookup: {
      from: "products",
      localField: "items.product_id",
      foreignField: "_id",
      as: "product"
    }
  },
  {
    $unwind: "$product"
  },
  {
    $group: {
      _id: "$product.category",
      total_revenue: {
        $sum: {
          $multiply: ["$items.unit_price", "$items.qty"]
        }
      },
      distinct_products: {
        $addToSet: "$items.product_id"
      }
    }
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      total_revenue: 1,
      products_sold: {
        $size: "$distinct_products"
      }
    }
  },
  {
    $sort: {
      total_revenue: -1
    }
  }
];


// 2. Customer lifetime value 
const customerLifetimeValuePipeline = [
  {
    $facet: {
      orderStats: [
        {
          $group: {
            _id: "$customer_id",
            total_orders: {
              $sum: 1
            },
            total_spent: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "delivered"] },
                  "$total",
                  NumberDecimal("0")
                ]
              }
            },
            avg_order_value: {
              $avg: "$total"
            }
          }
        }
      ],
      favouriteCategories: [
        {
          $match: {
            status: "delivered"
          }
        },
        {
          $unwind: "$items"
        },
        {
          $lookup: {
            from: "products",
            localField: "items.product_id",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
        {
          $group: {
            _id: {
              customer_id: "$customer_id",
              category: "$product.category"
            },
            category_units: {
              $sum: "$items.qty"
            }
          }
        },
        {
          $sort: {
            "_id.customer_id": 1,
            category_units: -1
          }
        },
        {
          $group: {
            _id: "$_id.customer_id",
            favourite_category: {
              $first: "$_id.category"
            },
            favourite_category_units: {
              $first: "$category_units"
            }
          }
        }
      ]
    }
  },
  {
    $unwind: "$orderStats"
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: [
          "$orderStats",
          {
            favourite_category: {
              $let: {
                vars: {
                  favourite: {
                    $first: {
                      $filter: {
                        input: "$favouriteCategories",
                        as: "fc",
                        cond: {
                          $eq: ["$$fc._id", "$orderStats._id"]
                        }
                      }
                    }
                  }
                },
                in: "$$favourite.favourite_category"
              }
            }
          }
        ]
      }
    }
  },
  {
    $lookup: {
      from: "customers",
      localField: "_id",
      foreignField: "_id",
      as: "customer"
    }
  },
  {
    $unwind: "$customer"
  },
  {
    $project: {
      _id: 0,
      customer_id: "$_id",
      customer_name: "$customer.name",
      total_orders: 1,
      total_spent: 1,
      avg_order_value: {
        $round: ["$avg_order_value", 2]
      },
      favourite_category: {
        $ifNull: ["$favourite_category", "N/A"]
      }
    }
  },
  {
    $sort: {
      total_spent: -1
    }
  },
  {
    $limit: 10
  }
];

// 3. Monthly sales trend
const monthlySalesTrendPipeline = [
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m",
          date: "$created_at"
        }
      },
      total_revenue: {
        $sum: {
          $cond: [
            { $eq: ["$status", "delivered"] },
            "$total",
            NumberDecimal("0")
          ]
        }
      },
      number_of_orders: {
        $sum: 1
      },
      avg_order_value: {
        $avg: "$total"
      }
    }
  },
  {
    $project: {
      _id: 0,
      month: "$_id",
      total_revenue: 1,
      number_of_orders: 1,
      avg_order_value: {
        $round: ["$avg_order_value", 2]
      }
    }
  },
  {
    $sort: {
      month: 1
    }
  }
];
 

// 4. Vendor performance report using $lookup + $group 
const vendorPerformancePipeline = [
  {
    $match: {
      status: "delivered"
    }
  },
  {
    $unwind: "$items"
  },
  {
    $lookup: {
      from: "products",
      localField: "items.product_id",
      foreignField: "_id",
      as: "product"
    }
  },
  {
    $unwind: "$product"
  },
  {
    $lookup: {
      from: "vendors",
      localField: "product.vendor_id",
      foreignField: "_id",
      as: "vendor"
    }
  },
  {
    $unwind: "$vendor"
  },
  {
    $group: {
      _id: {
        vendor_id: "$vendor._id",
        product_id: "$product._id"
      },
      vendor_name: {
        $first: "$vendor.name"
      },
      vendor_email: {
        $first: "$vendor.email"
      },
      product_name: {
        $first: "$product.name"
      },
      units_sold_per_product: {
        $sum: "$items.qty"
      },
      revenue_per_product: {
        $sum: {
          $multiply: ["$items.unit_price", "$items.qty"]
        }
      }
    }
  },
  {
    $sort: {
      "_id.vendor_id": 1,
      units_sold_per_product: -1
    }
  },
  {
    $group: {
      _id: "$_id.vendor_id",
      vendor_name: {
        $first: "$vendor_name"
      },
      vendor_email: {
        $first: "$vendor_email"
      },
      total_units_sold: {
        $sum: "$units_sold_per_product"
      },
      gross_revenue: {
        $sum: "$revenue_per_product"
      },
      top_product: {
        $first: "$product_name"
      }
    }
  },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "vendor_id",
      as: "listed_products"
    }
  },
  {
    $project: {
      _id: 0,
      vendor_name: 1,
      vendor_email: 1,
      total_products_listed: {
        $size: "$listed_products"
      },
      total_units_sold: 1,
      gross_revenue: 1,
      top_product: 1
    }
  },
  {
    $sort: {
      gross_revenue: -1
    }
  }
];

async function main() {
    // Test insertProductSafe: The first call should insert, the second call with the same SKU should skip due to duplicate detection.
    await insertProductSafe({
        sku: "SNT-9999",
        name: "Test Widget",
        category: "Electronics",
        vendor_id: vendorIds.techHaven,
        price: "49.99",
        stock: 10,
        ratings: {
        average: 4.0,
        count: 1
        },
        tags: ["test", "new-arrival"],
        created_at: new Date("2026-05-01")
    });

    await insertProductSafe({
        sku: "SNT-9999",
        name: "Test Widget Duplicate",
        category: "Electronics",
        vendor_id: vendorIds.techHaven,
        price: "59.99",
        stock: 10,
        ratings: {
        average: 3.5,
        count: 1
        },
        tags: ["test", "duplicate"],
        created_at: new Date("2026-05-02")
    });

    // Bulk price update: 10% discount on all Electronics products with stock > 50.
    const discountResult = await db.products.updateMany(
    {
        category: "Electronics",
        stock: { $gt: 50 }
    },
    {
        $mul: {
        price: NumberDecimal("0.90")
        }
    }
    );

    console.log(`Matched documents: ${discountResult.matchedCount}`);
    console.log(`Modified documents: ${discountResult.modifiedCount}`);


    // 1. Simple field filter + projection 
    await printQueryResults(
    "Query 1: Books with good ratings and in stock, sorted by price",
    db.products.find(
        {
        category: "Books",
        "ratings.average": { $gte: 4.0 },
        stock: { $gt: 0 }
        },
        {
        _id: 0,
        name: 1,
        price: 1,
        "ratings.average": 1,
        tags: 1
        }
    ).sort({ price: 1 }),
    "This query returns available Books products with an average rating of at least 4.0 and stock greater than 0, sorted by price in ascending order."
    );

    // 2. Array query operators 
    await printQueryResults(
    "Query 2: Products tagged with both new-arrival and featured",
    db.products.find(
        {
        tags: { $all: ["new-arrival", "featured"] }
        },
        {
        _id: 0,
        sku: 1,
        name: 1,
        category: 1,
        price: 1,
        tags: 1
        }
    ),
    "This query returns products that contain both the new-arrival and featured tags."
    );

    await printQueryResults(
    "Query 2B: Products tagged with either clearance or sale",
    db.products.find(
        {
        tags: { $in: ["clearance", "sale"] }
        },
        {
        _id: 0,
        sku: 1,
        name: 1,
        category: 1,
        price: 1,
        tags: 1
        }
    ),
    "This query returns products that contain either the clearance tag or the sale tag."
    );

    // 3. Full-text search
    await printQueryResults(
    "Query 3: Full-text search for wireless headphones",
    db.products.find(
        {
        $text: { $search: "wireless headphones" }
        },
        {
        _id: 0,
        score: { $meta: "textScore" },
        name: 1,
        price: 1
        }
    ).sort({
        score: { $meta: "textScore" }
    }),
    "This query performs a full-text search for products matching wireless headphones and sorts the results by text relevance score."
    ); 

    // 4. Nested document query
    await printQueryResults(
    "Query 4: Gold customers from Greece or Germany",
    db.customers.find(
        {
        "address.country": { $in: ["Greece", "Germany"] },
        tier: "gold"
        },
        {
        _id: 0,
        name: 1,
        email: 1,
        address: 1
        }
    ),
    "This query returns gold-tier customers whose country is either Greece or Germany."
    );

    // 5. Query on embedded arrays (orders)
    await printQueryResults(
    "Query 5: Orders containing at least one line item with qty > 3",
    db.orders.find(
        {
        items: {
            $elemMatch: {
            qty: { $gt: 3 }
            }
        }
        },
        {
        _id: 1,
        customer_id: 1,
        status: 1,
        created_at: 1,
        total: 1,
        items: 1
        }
    ),
    "This query returns orders that contain at least one embedded line item with a quantity greater than 3."
    );

    // 6. Date range query 
    await printQueryResults(
    "Query 6: Delivered orders in the last 30 days",
    db.orders.find(
        {
        status: "delivered",
        created_at: {
            $gte: ISODate("2026-04-03T00:00:00Z"),
            $lte: ISODate("2026-05-03T23:59:59Z")
        }
        },
        {
        _id: 1,
        customer_id: 1,
        status: 1,
        total: 1,
        created_at: 1,
        items: 1
        }
    ).sort({ created_at: -1 }),
    "This query returns delivered orders placed within the last 30 days of the seed dataset, sorted from newest to oldest."
    );


    await printAggregationResults(
    "Aggregation 1: Revenue by category",
    db.orders,
    revenueByCategoryPipeline,
    "This aggregation computes total delivered-order revenue and the number of distinct products sold for each product category."
    );

    await printAggregationResults(
    "Aggregation 2: Customer lifetime value",
    db.orders,
    customerLifetimeValuePipeline,
    "This aggregation calculates each customer's order count, delivered-order spending, average order value, and favourite delivered-order category, then returns the top 10 customers by spending."
    );

    await printAggregationResults(
    "Aggregation 3: Monthly sales trend",
    db.orders,
    monthlySalesTrendPipeline,
    "This aggregation groups orders by month and computes delivered-order revenue, order count, and average order value for each month in the dataset."
    );

    await printAggregationResults(
        "Aggregation 4: Vendor performance report",
        db.orders,
        vendorPerformancePipeline,
        "This aggregation joins delivered orders with products and vendors to calculate product listing counts, units sold, gross revenue, and the best-selling product for each vendor."
    );
}

main();