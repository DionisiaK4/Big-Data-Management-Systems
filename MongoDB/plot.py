import matplotlib.pyplot as plt

data = [
    {"month": "2026-03", "total_revenue": 229.91},
    {"month": "2026-04", "total_revenue": 1456.69},
    {"month": "2026-05", "total_revenue": 0.00}
]
 
months = [row["month"] for row in data]
revenues = [row["total_revenue"] for row in data]
 
plt.figure(figsize=(8, 5))
plt.bar(months, revenues)
 
plt.title("Monthly Sales Trend - Delivered Revenue")
plt.xlabel("Month")
plt.ylabel("Total Revenue")
plt.tight_layout()

plt.savefig("monthly_sales_trend.png", dpi=200)
plt.show()
 