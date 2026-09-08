import pandas as pd
import numpy as np

FILE_NAME = "expenses.csv"


# ---------------- PREDICTION ----------------
def predict_expense():

    df = pd.read_csv(FILE_NAME)

    df["Date"] = pd.to_datetime(df["Date"])

    df["Month"] = df["Date"].dt.strftime("%Y-%m")

    monthly = df.groupby("Month")["Amount"].sum()

    values = monthly.values

    if len(values) < 3:
        print(f"\n⚠️ Need at least 3 months of data for 3-month moving average prediction (currently {len(values)} month(s)).")
        print(f"Current Average Spending: ₹{np.mean(values):.2f}")
        return

    # Moving Average Prediction
    last_3 = values[-3:]

    prediction = np.mean(last_3)

    print("\n===== PREDICTED NEXT MONTH EXPENSE =====")
    print(f"Predicted Expense: ₹{prediction:.2f}")


# ---------------- OVERSPENDING ALERT ----------------
def overspending_alert():

    df = pd.read_csv(FILE_NAME)

    df["Date"] = pd.to_datetime(df["Date"])

    df["Month"] = df["Date"].dt.strftime("%Y-%m")

    monthly = df.groupby("Month")["Amount"].sum()

    avg = np.mean(monthly.values)

    current = monthly.values[-1]

    print("\n===== OVERSPENDING CHECK =====")

    if current > avg * 1.2:
        print("🚨 ALERT: Overspending Detected!")
        print(f"Current Spending: ₹{current:.2f}")
        print(f"Average Spending: ₹{avg:.2f}")
    else:
        print("✅ Spending is under control.")
        print(f"Current Spending: ₹{current:.2f}")
        print(f"Average Spending: ₹{avg:.2f}")