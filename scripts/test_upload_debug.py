import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.add_argument("--headless=new")
options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
driver = webdriver.Chrome(options=options)

try:
    driver.get("http://localhost:5173")
    time.sleep(2)

    # Enter dashboard if on landing page
    btns = driver.find_elements(By.XPATH, "//button[contains(., 'Supervisor Dashboard')]")
    if btns:
        btns[0].click()
        time.sleep(1)

    # Click lab tab
    driver.find_element(By.XPATH, "//button[contains(., 'AI Testing Lab')]").click()
    time.sleep(1)

    # Click upload tab
    driver.find_element(By.XPATH, "//button[contains(., 'Upload File')]").click()
    time.sleep(1)

    # Send keys
    test_img = Path("test_images/WhatsApp Image 2026-09-30 at 1.25.20 PM.jpeg").resolve()
    print("Uploading:", test_img)
    inp = driver.find_element(By.XPATH, "//input[@type='file']")
    inp.send_keys(str(test_img))
    time.sleep(4)

    # Check if 'Grade Uploaded Image' button is clicked
    grade_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Grade Uploaded Image')]")
    if grade_btn:
        print("Clicking Grade Uploaded Image button...")
        grade_btn[0].click()
        time.sleep(4)

    # Print page text snippet
    body_text = driver.find_element(By.TAG_NAME, "body").text
    print("=== BODY TEXT SNIPPET ===")
    print(body_text[:1000])

    print("=== BROWSER LOGS ===")
    for entry in driver.get_log("browser"):
        print(entry)

    driver.save_screenshot("debug_upload.png")
    print("Screenshot saved to debug_upload.png")

finally:
    driver.quit()
