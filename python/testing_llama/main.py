import time
from playwright.sync_api import sync_playwright
import pytesseract
from PIL import Image

def screenshot_full_page(url, output_path):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Launch a headless browser
        context = browser.new_context()  # Create a new browser context
        page = context.new_page()  # Open a new page
        page.goto(url)  # Navigate to the desired URL

        
        # Take a full-page screenshot
        for i in range(5):
            time.sleep(1)
            page.mouse.wheel(0,5000)

       
        show_more_buttons = page.query_selector_all('tp-yt-paper-button#more')
        for button in show_more_buttons:
            button.click()
            time.sleep(1)  
        print(f"Screenshot saved at {output_path}")
        browser.close()

def extract_text_from_image(image_path):
    # Open the image file
    img = Image.open(image_path)
    # Use Tesseract to do OCR on the image
    text = pytesseract.image_to_string(img)
    return text

# Example usage
links =["https://www.youtube.com/watch?v=pCqmCCb3kXY"]

screenshot_path = "screenshot.png"

# Take a screenshot of the full page
for i, link in enumerate(links, start= 1):
    print(f"{i}.------------")
    screenshot_full_page(link, screenshot_path)
    extracted_text = extract_text_from_image(screenshot_path)
    print("Extracted Text:")
    print(extracted_text)
    print("---------------------------------------------------------------------------")
# Extract text from the screenshot

