import pandas as pd

FILE_NAME = "expenses.csv"


# ---------------- CATEGORY ANALYSIS ----------------
def category_analysis():

    df = pd.read_csv(FILE_NAME)

    result = df.groupby("Category")["Amount"].sum()

    print("\n===== CATEGORY ANALYSIS =====")
    print(result)


# ---------------- MONTHLY ANALYSIS ----------------
def monthly_analysis():

    df = pd.read_csv(FILE_NAME)

    df["Date"] = pd.to_datetime(df["Date"])

    df["Month"] = df["Date"].dt.strftime("%Y-%m")

    result = df.groupby("Month")["Amount"].sum()

    print("\n===== MONTHLY ANALYSIS =====")
    print(result)