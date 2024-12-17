from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os


def scrape_website(website):
    print("Connecting to Scraping Browser...")
    with sync_playwright() as p:
        # Launch browser with connection to Scraping Browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        page.goto(website)
        print("Waiting for captcha to solve...")
        
        # Execute CDP command for captcha handling
        solve_res = page.evaluate("""async () => {
            return await window.cdp.send('Captcha.waitForSolve', {
                detectTimeout: 10000
            });
        }""")
        
        print("Captcha solve status:", solve_res['status'])
        print("Navigated! Scraping page content...")
        
        html = page.content()
        
        # Clean up
        context.close()
        browser.close()
        
        return html

def extract_body_content(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    body_content = soup.body
    if body_content:
        return str(body_content)
    return ""

def clean_body_content(body_content):
    soup = BeautifulSoup(body_content, "html.parser")
    # Remove script and style elements
    for script_or_style in soup(["script", "style"]):
        script_or_style.extract()
    
    # Get text and clean it up
    cleaned_content = soup.get_text(separator="\n")
    cleaned_content = "\n".join(
        line.strip() for line in cleaned_content.splitlines() if line.strip()
    )
    return cleaned_content

def split_dom_content(dom_content, max_length=6000):
    return [
        dom_content[i:i + max_length] 
        for i in range(0, len(dom_content), max_length)
    ]
scrape_website('https://www.youtube.com/watch?v=Oo8-nEuDBkk')


