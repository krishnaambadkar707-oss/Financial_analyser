import os
import io
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Response
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

FILE_NAME = "expenses.csv"

app = FastAPI(
    title="Personal Finance & Expense Tracker API",
    description="Backend API for personal expense analysis, visualization, predictions, and management.",
    version="1.0.0"
)

# Enable CORS for local development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disable browser caching for static files during development
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# Pydantic Schemas
class ExpenseCreate(BaseModel):
    Date: str = Field(..., json_schema_extra={"example": "2026-05-10"})
    Category: str = Field(..., json_schema_extra={"example": "Food"})
    Amount: float = Field(..., gt=0, json_schema_extra={"example": 250.0})

class ExpenseItem(BaseModel):
    id: int
    Date: str
    Category: str
    Amount: float


# Helper Functions
def load_data() -> pd.DataFrame:
    if not os.path.exists(FILE_NAME):
        return pd.DataFrame(columns=["Date", "Category", "Amount"])
    try:
        df = pd.read_csv(FILE_NAME)
        # Ensure correct column presence
        for col in ["Date", "Category", "Amount"]:
            if col not in df.columns:
                df[col] = []
        df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0.0)
        df["Category"] = df["Category"].astype(str).str.strip()
        df["Date"] = df["Date"].astype(str).str.strip()
        return df
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return pd.DataFrame(columns=["Date", "Category", "Amount"])

def save_data(df: pd.DataFrame):
    df.to_csv(FILE_NAME, index=False)


# API Endpoints

@app.get("/api/expenses")
def get_expenses(category: Optional[str] = None):
    df = load_data()
    if df.empty:
        return []
    
    if category and category.lower() != "all":
        df = df[df["Category"].str.lower() == category.lower()]
    
    # Sort by date descending
    df_sorted = df.copy()
    try:
        df_sorted["ParsedDate"] = pd.to_datetime(df_sorted["Date"], errors="coerce")
        df_sorted = df_sorted.sort_values(by="ParsedDate", ascending=False).drop(columns=["ParsedDate"])
    except Exception:
        pass

    results = []
    for index, row in df_sorted.iterrows():
        results.append({
            "id": int(index),
            "Date": str(row["Date"]),
            "Category": str(row["Category"]),
            "Amount": float(row["Amount"])
        })
    return results


@app.post("/api/expenses", status_code=201)
def add_expense(expense: ExpenseCreate):
    # Validate date format if possible
    try:
        datetime.strptime(expense.Date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    
    df = load_data()
    formatted_category = expense.Category.strip().title()
    new_row = pd.DataFrame([{
        "Date": expense.Date,
        "Category": formatted_category,
        "Amount": round(float(expense.Amount), 2)
    }])
    
    if df.empty:
        df = new_row
    else:
        df = pd.concat([df, new_row], ignore_index=True)
    
    save_data(df)
    
    new_index = len(df) - 1
    return {
        "message": "Expense added successfully",
        "expense": {
            "id": new_index,
            "Date": expense.Date,
            "Category": formatted_category,
            "Amount": round(float(expense.Amount), 2)
        }
    }


@app.delete("/api/expenses/{index}")
def delete_expense(index: int):
    df = load_data()
    if index not in df.index:
        raise HTTPException(status_code=404, detail="Expense not found at specified index.")
    
    df = df.drop(index).reset_index(drop=True)
    save_data(df)
    return {"message": "Expense deleted successfully"}


@app.delete("/api/expenses/clear/all")
def clear_all_expenses():
    df = pd.DataFrame(columns=["Date", "Category", "Amount"])
    save_data(df)
    return {"message": "All expense records cleared successfully."}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), mode: str = Form("merge")):
    filename = file.filename.lower()
    contents = await file.read()
    
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Only CSV (.csv) and Excel (.xlsx, .xls) files are supported.")
    
    try:
        if filename.endswith(".csv"):
            new_df = pd.read_csv(io.BytesIO(contents))
        else:
            new_df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")
    
    if new_df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Normalize column names
    col_map = {}
    for col in new_df.columns:
        c_clean = str(col).strip().lower()
        if c_clean in ["date", "dt", "time", "transaction_date"]:
            col_map[col] = "Date"
        elif c_clean in ["category", "cat", "type", "description", "item"]:
            col_map[col] = "Category"
        elif c_clean in ["amount", "amt", "cost", "price", "value", "expense"]:
            col_map[col] = "Amount"
            
    new_df = new_df.rename(columns=col_map)
    
    required_cols = ["Date", "Category", "Amount"]
    missing = [c for c in required_cols if c not in new_df.columns]
    if missing:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns in file: {', '.join(missing)}. File must contain columns for Date, Category, and Amount."
        )

    # Clean data
    clean_rows = []
    for _, row in new_df.iterrows():
        try:
            raw_date = str(row["Date"]).strip()
            parsed_dt = pd.to_datetime(raw_date, errors="coerce")
            if pd.isna(parsed_dt):
                continue
            date_str = parsed_dt.strftime("%Y-%m-%d")
            
            cat_str = str(row["Category"]).strip().title()
            if not cat_str or cat_str.lower() in ["nan", "none", "null"]:
                cat_str = "Uncategorized"
                
            amt_val = float(row["Amount"])
            if np.isnan(amt_val) or amt_val <= 0:
                continue
                
            clean_rows.append({
                "Date": date_str,
                "Category": cat_str,
                "Amount": round(amt_val, 2)
            })
        except Exception:
            continue

    if not clean_rows:
        raise HTTPException(status_code=400, detail="No valid expense rows found in file.")

    processed_df = pd.DataFrame(clean_rows)

    if mode == "replace":
        final_df = processed_df
    else: # merge
        current_df = load_data()
        if current_df.empty:
            final_df = processed_df
        else:
            final_df = pd.concat([current_df, processed_df], ignore_index=True)
            final_df = final_df.drop_duplicates(subset=["Date", "Category", "Amount"]).reset_index(drop=True)

    save_data(final_df)
    
    total_amount = float(processed_df["Amount"].sum())
    categories_found = sorted(list(processed_df["Category"].unique()))
    
    return {
        "message": f"Successfully imported {len(clean_rows)} expense record(s) ({mode} mode).",
        "imported_count": len(clean_rows),
        "total_count": len(final_df),
        "total_amount": round(total_amount, 2),
        "categories_found": categories_found
    }


@app.get("/api/export")
def export_data(format: str = Query("csv", regex="^(csv|excel)$")):
    df = load_data()
    if format == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Expenses')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=expenses_export.xlsx"}
        )
    else:
        return FileResponse(
            FILE_NAME,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=expenses_export.csv"}
        )


@app.get("/api/analytics/overview")
def get_overview_stats():
    df = load_data()
    if df.empty:
        return {
            "total_spending": 0.0,
            "total_transactions": 0,
            "average_expense": 0.0,
            "top_category": "N/A",
            "monthly_average": 0.0
        }
    
    total_spending = float(df["Amount"].sum())
    total_transactions = int(len(df))
    average_expense = float(df["Amount"].mean()) if total_transactions > 0 else 0.0
    
    # Top Category
    cat_sum = df.groupby("Category")["Amount"].sum()
    top_category = str(cat_sum.idxmax()) if not cat_sum.empty else "N/A"
    
    # Monthly Average
    df_copy = df.copy()
    df_copy["ParsedDate"] = pd.to_datetime(df_copy["Date"], errors="coerce")
    df_valid_dates = df_copy.dropna(subset=["ParsedDate"])
    
    if not df_valid_dates.empty:
        df_valid_dates["YearMonth"] = df_valid_dates["ParsedDate"].dt.to_period("M")
        monthly_sums = df_valid_dates.groupby("YearMonth")["Amount"].sum()
        monthly_average = float(monthly_sums.mean())
    else:
        monthly_average = total_spending

    return {
        "total_spending": round(total_spending, 2),
        "total_transactions": total_transactions,
        "average_expense": round(average_expense, 2),
        "top_category": top_category,
        "monthly_average": round(monthly_average, 2)
    }


@app.get("/api/analytics/category")
def get_category_analytics():
    df = load_data()
    if df.empty:
        return []
    
    cat_summary = df.groupby("Category")["Amount"].sum().reset_index()
    total_amount = cat_summary["Amount"].sum()
    
    results = []
    for _, row in cat_summary.iterrows():
        amt = float(row["Amount"])
        pct = (amt / total_amount * 100) if total_amount > 0 else 0
        results.append({
            "category": str(row["Category"]),
            "amount": round(amt, 2),
            "percentage": round(pct, 1)
        })
    
    # Sort descending by amount
    results.sort(key=lambda x: x["amount"], reverse=True)
    return results


@app.get("/api/analytics/monthly")
def get_monthly_analytics():
    df = load_data()
    if df.empty:
        return []
    
    df_copy = df.copy()
    df_copy["ParsedDate"] = pd.to_datetime(df_copy["Date"], errors="coerce")
    df_valid = df_copy.dropna(subset=["ParsedDate"]).sort_values("ParsedDate")
    
    if df_valid.empty:
        return []
    
    df_valid["MonthKey"] = df_valid["ParsedDate"].dt.strftime("%Y-%m")
    df_valid["MonthLabel"] = df_valid["ParsedDate"].dt.strftime("%b %Y")
    
    grouped = df_valid.groupby(["MonthKey", "MonthLabel"])["Amount"].sum().reset_index()
    
    results = []
    for _, row in grouped.iterrows():
        results.append({
            "month_key": str(row["MonthKey"]),
            "month_label": str(row["MonthLabel"]),
            "amount": round(float(row["Amount"]), 2)
        })
    return results


@app.get("/api/prediction")
def get_prediction():
    df = load_data()
    if df.empty:
        return {
            "prediction": 0.0,
            "has_enough_data": False,
            "message": "No expense data available.",
            "overspending": False,
            "current_spending": 0.0,
            "average_spending": 0.0
        }
    
    df_copy = df.copy()
    df_copy["ParsedDate"] = pd.to_datetime(df_copy["Date"], errors="coerce")
    df_valid = df_copy.dropna(subset=["ParsedDate"]).sort_values("ParsedDate")
    
    if df_valid.empty:
        return {
            "prediction": 0.0,
            "has_enough_data": False,
            "message": "Invalid date formats in dataset.",
            "overspending": False,
            "current_spending": 0.0,
            "average_spending": 0.0
        }
    
    df_valid["MonthKey"] = df_valid["ParsedDate"].dt.strftime("%Y-%m")
    monthly = df_valid.groupby("MonthKey")["Amount"].sum()
    values = monthly.values
    
    current_spending = float(values[-1]) if len(values) > 0 else 0.0
    avg_spending = float(np.mean(values)) if len(values) > 0 else 0.0
    
    # Overspending check (current month > avg * 1.2)
    is_overspending = False
    if len(values) >= 1 and current_spending > (avg_spending * 1.2):
        is_overspending = True

    if len(values) < 3:
        # Fallback estimation if under 3 months of data
        predicted_val = avg_spending
        return {
            "prediction": round(float(predicted_val), 2),
            "has_enough_data": False,
            "data_count": len(values),
            "message": f"Need at least 3 months of data for 3-month moving average prediction (currently {len(values)} month(s)). Using current average.",
            "current_spending": round(current_spending, 2),
            "average_spending": round(avg_spending, 2),
            "overspending": is_overspending,
            "threshold": round(avg_spending * 1.2, 2)
        }
    
    # 3-Month Moving Average
    last_3 = values[-3:]
    prediction_val = float(np.mean(last_3))
    
    return {
        "prediction": round(prediction_val, 2),
        "has_enough_data": True,
        "data_count": len(values),
        "message": "3-Month moving average calculated successfully.",
        "current_spending": round(current_spending, 2),
        "average_spending": round(avg_spending, 2),
        "overspending": is_overspending,
        "threshold": round(avg_spending * 1.2, 2)
    }

# Mount static files directory for frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# Separate HTML Page Routes for Navigation
@app.get("/", response_class=FileResponse)
def serve_dashboard():
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/analytics", response_class=FileResponse)
def serve_analytics():
    return FileResponse(os.path.join(static_dir, "analytics.html"))

@app.get("/predictions", response_class=FileResponse)
def serve_predictions():
    return FileResponse(os.path.join(static_dir, "predictions.html"))

@app.get("/transactions", response_class=FileResponse)
def serve_transactions():
    return FileResponse(os.path.join(static_dir, "transactions.html"))

@app.get("/upload", response_class=FileResponse)
def serve_upload():
    return FileResponse(os.path.join(static_dir, "upload.html"))

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("==================================================")
    print(f" Personal Finance Analyzer Web Server Running on port {port}! ")
    print(f" Web Dashboard: http://0.0.0.0:{port} ")
    print(f" API Documentation: http://0.0.0.0:{port}/docs ")
    print("==================================================")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)

