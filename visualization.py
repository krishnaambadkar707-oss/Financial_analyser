import pandas as pd
import matplotlib.pyplot as plt

FILE_NAME = "expenses.csv"


def show_graphs():

    df = pd.read_csv(FILE_NAME)

    # ---------- CATEGORY GRAPH ----------
    category_data = df.groupby("Category")["Amount"].sum()

    plt.figure(figsize=(8, 5))
    category_data.plot(kind="bar", color="#6366F1")

    plt.title("Category Wise Expenses")
    plt.xlabel("Category")
    plt.ylabel("Amount (₹)")
    plt.tight_layout()

    plt.show()

    # ---------- PIE CHART ----------
    plt.figure(figsize=(7, 7))
    category_data.plot(kind="pie", autopct="%1.1f%%", startangle=140)

    plt.title("Expense Distribution")
    plt.ylabel("")
    plt.tight_layout()

    plt.show()

    # ---------- MONTHLY TREND ----------
    df["Date"] = pd.to_datetime(df["Date"])

    df["Month"] = df["Date"].dt.strftime("%Y-%m")

    monthly = df.groupby("Month")["Amount"].sum()

    plt.figure(figsize=(8, 5))

    plt.plot(monthly.index, monthly.values, marker='o', color="#10B981", linewidth=2)

    plt.title("Monthly Spending Trend")
    plt.xlabel("Month (YYYY-MM)")
    plt.ylabel("Expense (₹)")

    plt.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()

    plt.show()