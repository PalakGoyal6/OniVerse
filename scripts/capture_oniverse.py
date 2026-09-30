import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1440,900")
driver = webdriver.Chrome(options=options)

try:
    driver.get("http://localhost:5173")
    time.sleep(2)
    driver.save_screenshot(r"C:\Users\colle\.gemini\antigravity-ide\brain\8cca730f-421c-4b8d-873b-ff7b915a66f7\oniverse_landing.png")

    btns = driver.find_elements(By.XPATH, "//button[contains(., 'Supervisor')]")
    if btns:
        driver.execute_script("arguments[0].click();", btns[0])
        time.sleep(1)

    driver.save_screenshot(r"C:\Users\colle\.gemini\antigravity-ide\brain\8cca730f-421c-4b8d-873b-ff7b915a66f7\oniverse_dashboard.png")
    print("SUCCESS: Screenshots saved with OniVerse branding.")
finally:
    driver.quit()
