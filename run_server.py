import os
import webbrowser
import uvicorn
from app import app

if __name__ == "__main__":
    url = "http://127.0.0.1:8000"
    print("==================================================")
    print(" Starting Personal Finance Analyzer Web Server... ")
    print(f" Web Dashboard: {url} ")
    print(f" API Documentation: {url}/docs ")
    print("==================================================")
    
    # Automatically open browser window
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not auto-open browser: {e}")
        
    uvicorn.run(app, host="127.0.0.1", port=8000)
