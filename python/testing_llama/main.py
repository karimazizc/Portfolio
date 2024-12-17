from playwright.sync_api import sync_playwright
from langchain_ollama import OllamaLLM
def screenshot_full_page(url, output_path):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Launch a headless browser
        context = browser.new_context()  # Create a new browser context
        page = context.new_page()  # Open a new page
        page.goto(url)  # Navigate to the desired URL

        
        # Take a full-page screenshot
        page.screenshot(path=output_path, full_page=True)
        
        print(f"Screenshot saved at {output_path}")
        browser.close()

# Example usage
link = "https://www.tiktok.com/@c4news/video/7446775167977540897"

#screenshot_full_page(link, "screenshot.png")

#model = OllamaLLM(model= "llama3.2")

from playwright.sync_api import sync_playwright

def screenshot_left_side(url, output_path):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Launch a headless browser
        context = browser.new_context()  # Create a new browser context
        page = context.new_page()  # Open a new page
        page.goto(url)  # Navigate to the desired URL
        
        # Define the bounding box for the left side (e.g., 300px width)
        left_side_element = page.locator("body")  # Target the body or a specific element
        bounding_box = left_side_element.bounding_box()
        if bounding_box:
            # Adjust the bounding box to capture only the left side
            cropped_bounding_box = {
                "x": bounding_box["x"],
                "y": bounding_box["y"],
                "width": 300,  # Capture the first 300px of the width
                "height": bounding_box["height"],  # Full height of the element
            }
            # Take a screenshot of the specific region
            page.screenshot(path=output_path, clip=cropped_bounding_box)
            print(f"Left side screenshot saved at {output_path}")
        else:
            print("Could not determine bounding box.")

        browser.close()

def screenshot_right_side(url, output_path, right_width=450):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Launch a headless browser
        context = browser.new_context()  # Create a new browser context
        page = context.new_page()  # Open a new page
        page.goto(url)  # Navigate to the desired URL
        
        # Get the page dimensions (viewport size)
        page_width = page.evaluate("window.innerWidth")
        page_height = page.evaluate("window.innerHeight")

        # Define the bounding box for the right side
        cropped_bounding_box = {
            "x": page_width - right_width,  # Start at the right side
            "y": 100,  # Top of the page
            "width": right_width,  # Capture the desired width
            "height": 600,  # Full height of the page
        }
        
        # Take a screenshot of the specific region
        page.screenshot(path=output_path, clip=cropped_bounding_box)
        print(f"Right side screenshot saved at {output_path}")
        
        browser.close()

# Example usage


screenshot_right_side(link, "right_screenshot.png")
