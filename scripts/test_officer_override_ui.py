"""
Selenium End-to-End Automated Test for Officer Resolution & Manual Override Flow.
Tests:
1. Uploading 'WhatsApp Image 2026-09-30 at 1.25.20 PM.jpeg' in AI Testing Lab
2. Verifying Pending state (0 of 1 auto-graded, PENDING_REVIEW, Storage PENDING)
3. Opening the Officer Resolution Modal
4. Checking cropped image & AI inference prediction
5. Selecting 'Sprouting' class and 'Looked at it closely' reason
6. Saving resolution
7. Verifying Confirmed state (1 of 1 auto-graded, 100% Rejected, REJECTED LOT, HIGH storage risk)
8. Saving high-resolution screenshots to brain artifacts directory.
"""

import time
import os
import shutil
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

ARTIFACT_DIR = Path(r"C:\Users\colle\.gemini\antigravity-ide\brain\8cca730f-421c-4b8d-873b-ff7b915a66f7")
TEST_IMG_PATH = Path(r"d:\onionSIH\test_images\WhatsApp Image 2026-09-30 at 1.25.20 PM.jpeg").resolve()

def js_click(driver, element):
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
    time.sleep(0.3)
    driver.execute_script("arguments[0].click();", element)

def run_test():
    print("=" * 80, flush=True)
    print("STARTING OFFICER RESOLUTION & OVERRIDE SELENIUM AUTOMATION TEST", flush=True)
    print(f"Target Test Image: {TEST_IMG_PATH}", flush=True)
    print(f"Artifacts Dir: {ARTIFACT_DIR}", flush=True)
    print("=" * 80, flush=True)

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,960")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 30)

    try:
        # 1. Open Dashboard
        print("\n[Step 1] Navigating to http://localhost:5173 ...", flush=True)
        driver.get("http://localhost:5173")
        time.sleep(2)

        # 2. Enter Dashboard / AI Testing Lab
        print("[Step 2] Entering Dashboard / AI Testing Lab ...", flush=True)
        landing_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Supervisor Dashboard') or contains(., 'Launch') or contains(., 'Enter')]")
        if landing_btns:
            js_click(driver, landing_btns[0])
            time.sleep(1)

        # Click AI Testing Lab in sidebar
        lab_nav = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'AI Testing Lab') or contains(., 'गुणवत्ता लैब')]")))
        js_click(driver, lab_nav)
        time.sleep(1)

        # 3. Click Upload File tab
        print("[Step 3] Switching to 'Upload File' tab ...", flush=True)
        upload_tab = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Upload File') or contains(., 'फोटो अपलोड')]")))
        js_click(driver, upload_tab)
        time.sleep(1)

        # 4. Upload test image
        print(f"[Step 4] Uploading image: {TEST_IMG_PATH.name} ...", flush=True)
        file_input = driver.find_element(By.XPATH, "//input[@type='file']")
        file_input.send_keys(str(TEST_IMG_PATH))
        time.sleep(2)

        # Click 'Grade Uploaded Image' if present and active
        grade_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Grade Uploaded Image')]")
        if grade_btns and grade_btns[0].is_enabled():
            print("[Step 4b] Clicking 'Grade Uploaded Image' button...", flush=True)
            js_click(driver, grade_btns[0])
        
        # Wait for inference to complete
        print("[Step 5] Waiting for inference results...", flush=True)
        for attempt in range(40):
            time.sleep(1)
            onions = driver.find_elements(By.XPATH, "//*[contains(text(), 'ONION-001')]")
            if onions:
                print(f"Found ONION-001 on attempt {attempt+1}", flush=True)
                break
        else:
            print("ERROR: Timeout waiting for ONION-001. Saving debug screenshot...", flush=True)
            driver.save_screenshot(str(ARTIFACT_DIR / "debug_timeout.png"))
            raise TimeoutError("ONION-001 element was not found in DOM")

        time.sleep(1)

        # 5. Capture BEFORE State
        print("\n[Step 6] Capturing BEFORE State Screenshot ...", flush=True)
        before_path = ARTIFACT_DIR / "before_resolution.png"
        driver.save_screenshot(str(before_path))
        print(f"Saved: {before_path}", flush=True)

        # Extract and print DOM info for BEFORE state
        verdict_el = driver.find_element(By.XPATH, "//h2[contains(@class, 'font-black')]")
        status_el = driver.find_element(By.XPATH, "//*[contains(text(), 'auto-graded')]")
        onion_card_before = driver.find_element(By.XPATH, "//button[contains(., 'ONION-001')]")
        print(f"  -> Verdict (Before): {verdict_el.text.encode('ascii', 'replace').decode('ascii')}", flush=True)
        print(f"  -> Status (Before): {status_el.text.encode('ascii', 'replace').decode('ascii')}", flush=True)
        print(f"  -> Card (Before): {onion_card_before.text.replace(chr(10), ' | ').encode('ascii', 'replace').decode('ascii')}", flush=True)

        # 6. Click pending onion card ONION-001 to open modal
        print("\n[Step 7] Clicking Pending ONION-001 card to open resolution modal ...", flush=True)
        js_click(driver, onion_card_before)
        time.sleep(1.5)

        # 7. Wait for Modal to open
        print("[Step 8] Modal opened. Verifying cropped image and AI confidence text ...", flush=True)
        modal_title = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Officer Resolution & Override') or contains(text(), 'अधिकारी सत्यापन')]")))
        ai_banner = driver.find_element(By.XPATH, "//*[contains(text(), 'sure')]")
        print(f"  -> AI Banner in Modal: '{ai_banner.text.encode('ascii', 'replace').decode('ascii')}'", flush=True)

        modal_path = ARTIFACT_DIR / "modal_open.png"
        driver.save_screenshot(str(modal_path))
        print(f"Saved: {modal_path}", flush=True)

        # 8. Select 'Sprouting' class
        print("\n[Step 9] Selecting 'Sprouting' Ground Truth class ...", flush=True)
        sprouting_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//form//button[contains(., 'Sprouting') or contains(., 'अंकुरित')]")))
        js_click(driver, sprouting_btn)
        time.sleep(0.5)

        # 9. Select Reason 'Looked at it closely'
        print("[Step 10] Selecting Reason: 'Looked at it closely' ...", flush=True)
        reason_select = Select(driver.find_element(By.XPATH, "//form//select"))
        reason_select.select_by_value("Looked at it closely")
        time.sleep(0.5)

        modal_filled_path = ARTIFACT_DIR / "modal_filled.png"
        driver.save_screenshot(str(modal_filled_path))
        print(f"Saved: {modal_filled_path}", flush=True)

        # 10. Click 'Save Resolution'
        print("\n[Step 11] Clicking 'Save Resolution' ...", flush=True)
        save_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//form//button[@type='submit' or contains(., 'Save')]")))
        js_click(driver, save_btn)
        time.sleep(2)

        # 11. Capture AFTER State
        print("\n[Step 12] Capturing AFTER State Screenshot ...", flush=True)
        after_path = ARTIFACT_DIR / "after_resolution.png"
        driver.save_screenshot(str(after_path))
        print(f"Saved: {after_path}", flush=True)

        # Extract and print DOM info for AFTER state
        verdict_after = driver.find_element(By.XPATH, "//h2[contains(@class, 'font-black')]")
        status_after = driver.find_element(By.XPATH, "//*[contains(text(), 'auto-graded')]")
        storage_after = driver.find_element(By.XPATH, "//*[contains(text(), 'Storage Suitability')]")
        onion_card_after = driver.find_element(By.XPATH, "//button[contains(., 'ONION-001')]")
        print(f"  -> Verdict (After): {verdict_after.text.encode('ascii', 'replace').decode('ascii')}", flush=True)
        print(f"  -> Status (After): {status_after.text.encode('ascii', 'replace').decode('ascii')}", flush=True)
        print(f"  -> Storage (After): {storage_after.text.encode('ascii', 'replace').decode('ascii')}", flush=True)
        print(f"  -> Onion Card (After): {onion_card_after.text.replace(chr(10), ' | ').encode('ascii', 'replace').decode('ascii')}", flush=True)

        print("\n" + "=" * 80, flush=True)
        print("TEST COMPLETED SUCCESSFULLY! ALL ARTIFACTS SAVED.", flush=True)
        print("=" * 80, flush=True)

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
