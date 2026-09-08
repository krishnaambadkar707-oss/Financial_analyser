# Implementation Plan - Multi-Page Web App with CSV/Excel Data Upload

Transform the FinVision Personal Finance Web App into a multi-page Single Page Application (SPA) featuring dedicated page views for **Dashboard**, **Analytics**, **AI Prediction**, **Transactions**, and **Import/Export Data** (supporting CSV and Excel files), along with enhanced user-friendly UI/UX.

## User Review Required

> [!IMPORTANT]
> - **Dependency Installation**: We will install `openpyxl` (`pip install openpyxl`) to enable Excel (`.xlsx`) parsing via `pandas.read_excel`.
> - **Multi-Page Navigation**: The application will use SPA page switching (`#dashboard`, `#analytics`, `#predictions`, `#transactions`, `#import`), allowing users to focus on one dedicated view at a time while preserving back-button and deep-link routing.
> - **CSV & Excel Upload**: Users will be able to drag-and-drop or select `.csv`, `.xlsx`, or `.xls` files, preview parsed rows, choose to **Merge** with or **Replace** existing records, and export updated data.

---

## Proposed Changes

### Backend (`app.py`)

#### [MODIFY] [app.py](file:///c:/Users/krish/OneDrive/Desktop/npm_project/app.py)
- Import `UploadFile`, `File`, `Form` from `fastapi` and `openpyxl`.
- Add `POST /api/upload`:
  - Receives uploaded file (`.csv`, `.xlsx`, `.xls`) and import mode (`merge` or `replace`).
  - Auto-detects and normalizes column headers (`Date`/`date`, `Category`/`category`, `Amount`/`amount`/`cost`/`price`).
  - Cleans and validates date formats and numeric amounts.
  - Updates `expenses.csv` and returns summary metrics (`imported_count`, `total_rows`).
- Add `GET /api/export`:
  - Allows downloading the expense records as `.csv` or `.xlsx`.
- Add `DELETE /api/expenses/clear`:
  - Clears all expenses when confirmed by the user.

---

### Dependencies

#### Python Packages
- Run `pip install openpyxl` to support Excel spreadsheet uploads.

---

### Frontend (`static/`)

#### [MODIFY] [index.html](file:///c:/Users/krish/OneDrive/Desktop/npm_project/static/index.html)
- Restructure container sections into 5 distinct page views:
  1. **Page 1: Dashboard View (`#dashboard`)**: Executive summary cards, overspending alert banner, overview charts, and top category highlights.
  2. **Page 2: Analytics View (`#analytics`)**: Dedicated analytics hub with high-resolution Category Doughnut Chart, Monthly Spending Line Chart, and Category Distribution breakdown table with percentages.
  3. **Page 3: AI Prediction View (`#predictions`)**: AI Insights & Forecast dashboard, projected vs current spending, moving average explanation widget, and category recommendations.
  4. **Page 4: Transactions View (`#transactions`)**: Full interactive transactions table with instant search filter, category dropdown filter, add expense modal, single item delete, and clear all.
  5. **Page 5: Import & Export Data View (`#import`)**: Drag-and-drop file dropzone for `.csv` and `.xlsx` files, file format instructions, live upload preview table before saving, Merge vs Replace toggle options, sample CSV generator button, and Export button.

#### [MODIFY] [style.css](file:///c:/Users/krish/OneDrive/Desktop/npm_project/static/style.css)
- Add page view transition styles (`.page-view`, `.page-view.active`, fade-in animations).
- Style drag-and-drop dropzone with border highlights, upload status indicators, and file preview tables.
- Refine navigation sidebar highlighting, badges, and mobile responsiveness.

#### [MODIFY] [app.js](file:///c:/Users/krish/OneDrive/Desktop/npm_project/static/app.js)
- Implement SPA page routing based on hash navigation (`window.location.hash`).
- Add drag-and-drop event handlers and file input change handlers for `.csv` and `.xlsx` upload.
- Implement file upload API caller with FormData, import mode selection (Merge vs Replace), and error toasts.
- Add sample file download generator and export logic.

---

## Verification Plan

### Automated / API Verification
1. Install `openpyxl`.
2. Test `/api/upload` endpoint using Python `TestClient` with sample `.csv` and `.xlsx` files.
3. Test `/api/export` endpoint.

### Manual Verification
1. Start `python run_server.py` and open [http://127.0.0.1:8000](http://127.0.0.1:8000).
2. Test tab navigation: click Dashboard, Analytics, AI Prediction, Transactions, and Import/Export to ensure smooth view switching.
3. Upload a sample CSV file and Excel file via drag-and-drop or file picker.
4. Verify parsed rows display in preview table, click Import, and confirm data merges/replaces into charts and tables.
5. Export data to test file download.
