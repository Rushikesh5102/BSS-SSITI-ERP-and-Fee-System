import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'UI Screenshots')
if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

def main():
    print("Initializing WebDriver...")
    try:
        # Try Chrome first
        service = Service(ChromeDriverManager().install())
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--window-size=1280,800')
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        print(f"Chrome failed: {e}. Trying Edge...")
        # Fallback to Edge
        service = Service(EdgeChromiumDriverManager().install())
        options = webdriver.EdgeOptions()
        options.add_argument('--headless')
        options.add_argument('--window-size=1280,800')
        driver = webdriver.Edge(service=service, options=options)

    # Login
    print("Navigating to login page...")
    driver.get("http://localhost:3000/login")
    time.sleep(2)
    
    print("Entering credentials...")
    # Find email input
    email_input = driver.find_element(By.CSS_SELECTOR, 'input[type="email"]')
    email_input.send_keys("admin@saiiti.edu.in")
    
    # Find password input
    password_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
    password_input.send_keys("Admin@123")
    
    # Press Enter to submit
    password_input.send_keys(Keys.RETURN)
    
    # Wait for dashboard to load
    print("Waiting for login to complete...")
    time.sleep(4)
    
    pages = [
        {"name": "Dashboard", "url": "http://localhost:3000/dashboard"},
        {"name": "Students", "url": "http://localhost:3000/students"},
        {"name": "Fee Structures", "url": "http://localhost:3000/fee-structures"},
        {"name": "Payments", "url": "http://localhost:3000/payments"},
        {"name": "Receipts", "url": "http://localhost:3000/receipts"},
        {"name": "Reports", "url": "http://localhost:3000/reports"}
    ]
    
    for page in pages:
        print(f"Capturing {page['name']}...")
        driver.get(page['url'])
        time.sleep(2) # adjust if pages need more time to load data
        
        file_path = os.path.join(SCREENSHOT_DIR, f"{page['name']}.png")
        driver.save_screenshot(file_path)
        print(f"Saved: {file_path}")
        
    print("Capturing Login separately...")
    driver.delete_all_cookies()
    driver.get("http://localhost:3000/login")
    time.sleep(2)
    login_path = os.path.join(SCREENSHOT_DIR, "Login.png")
    driver.save_screenshot(login_path)
    print(f"Saved: {login_path}")
    
    print("Done!")
    driver.quit()

if __name__ == "__main__":
    main()
