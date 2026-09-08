import pandas as pd
from analysis import category_analysis, monthly_analysis
from visualization import show_graphs
from prediction import predict_expense, overspending_alert

FILE_NAME = "expenses.csv"


# ---------------- ADD EXPENSE ----------------
def add_expense():
    date = input("Enter date (YYYY-MM-DD): ")
    category = input("Enter category: ")
    amount = float(input("Enter amount: "))

    new_data = pd.DataFrame({
        "Date": [date],
        "Category": [category],
        "Amount": [amount]
    })

    try:
        df = pd.read_csv(FILE_NAME)
        df = pd.concat([df, new_data], ignore_index=True)
    except FileNotFoundError:
        df = new_data

    df.to_csv(FILE_NAME, index=False)

    print("✅ Expense Added Successfully")


# ---------------- VIEW DATA ----------------
def view_data():
    try:
        df = pd.read_csv(FILE_NAME)
        print("\n===== EXPENSE DATA =====")
        print(df)
    except:
        print("No data found!")


# ---------------- MAIN MENU ----------------
while True:

    print("\n====== PERSONAL FINANCE ANALYZER ======")
    print("1. Add Expense")
    print("2. View Expenses")
    print("3. Category Analysis")
    print("4. Monthly Analysis")
    print("5. Show Graphs")
    print("6. Predict Next Month Expense")
    print("7. Overspending Alert")
    print("8. Exit")

    choice = input("Enter choice: ")

    if choice == "1":
        add_expense()

    elif choice == "2":
        view_data()

    elif choice == "3":
        category_analysis()

    elif choice == "4":
        monthly_analysis()

    elif choice == "5":
        show_graphs()

    elif choice == "6":
        predict_expense()

    elif choice == "7":
        overspending_alert()

    elif choice == "8":
        print("Thank You!")
        break

    else:
        print("Invalid Choice!")