import re
from playwright.sync_api import Playwright, sync_playwright
from bs4 import BeautifulSoup
import time
import requests

def get_jobstreet_list(jobs: str) -> list:
    """
    Get data from jobstreet

    Args:
     jobs (str): jobs to search 
    """
    
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    
    # search jobs
    job = jobs.replace(" ", "-")

    page.goto(f"https://my.jobstreet.com/{job}-jobs")
    time.sleep(2)

    for idx, x in enumerate(range(2), start= 2):
        for i in range(5):
            page.mouse.wheel(0, 5000)
            time.sleep(2)

        page.get_by_label(f"Go to page {idx}").click()

    content = page.content()
    
    soup = BeautifulSoup(content, "html.parser")

    #get jobs
    a_  = soup.find_all("a")
    hrefs = []
    
    for a in a_:
        href = a['href']
        hrefs.append(href)
        
    job_list = []
    previous_href = ""

    for href in hrefs:
        if "/job/" in href:
            job_list.append(f"https://my.jobstreet.com{href}")
            
        
    jobs_list = []
    for job in job_list:
        if job[29:37] != previous_href[29:37]:
            jobs_list.append(job)
            previous_href = job

    #get total jobs
    jobs = soup.find("h1", id = "SearchSummary").text

    for i, job in enumerate(jobs_list, start= 1):
        print(f"{i}. {job}")
    print("Total jobs: ", jobs)
    # --------------------- 
    return jobs_list
    

def get_jobstreet_info(url: str) -> list:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    

    page.goto(url)
    soup = BeautifulSoup(page.content(), 'html.parser')

    #Get title
    title = soup.find('h1', {'data-automation':'job-detail-title'})
    print("Title: ", title.get_text())

    #Get Company
    company = soup.find('span', {'data-automation':'advertiser-name'})
    print("Company: ", company.get_text())

    #Get Location
    location = soup.find('span', {'data-automation':'job-detail-location'})
    print("Location: ", location.get_text())

    #Get Industry
    industry = soup.find('span', {'data-automation':'job-detail-classifications'})
    print("Industry: ", industry.get_text())

    #Get work-type
    type = soup.find('span', {'data-automation':'job-detail-work-type'})
    print("Type: ", type.get_text())

    #Get posted
    posted = soup.find('span', class_ = '_47fs8z0 _1ekw8474z x6fqeo0 x6fqeo1 x6fqeo22 _1iz5fli4 x6fqeo7')
    print("Posted: ", posted.get_text())

    #Get Details
    detail = soup.find('div', {'data-automation':'jobAdDetails'})
    print("Detail: ", detail.get_text())


    #Add breaks
    print("\n-----------------------\n")
    context.close()
    browser.close()

    return title, company, location, industry, type, posted, detail

def filtered_jobs(url: str, skills: list) -> str: 
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    

    page.goto(url)
    
    soup = BeautifulSoup(page.content(), 'html.parser')
    # Filter skill-keywords logic

    detail = soup.find('div', {'data-automation':'jobAdDetails'})
    paragraph = detail.get_text()
    amounts = []

    for skill in skills:
        if skill.lower() in paragraph.lower():
            amounts.append(True)
        else:
            amounts.append(False)
            
    if all(amount == True for amount in amounts):
    
        # Print Url
        print("Url: ", url)

        # Get title
        title = soup.find('h1', {'data-automation':'job-detail-title'})
        print("Title: ", title.get_text())

        # Get Location
        location = soup.find('span', {'data-automation':'job-detail-location'})
        print("Location: ", location.get_text())

        #Get Industry
        industry = soup.find('span', {'data-automation':'job-detail-classifications'})
        print("Industry: ", industry.get_text())

        #Get work-type
        type = soup.find('span', {'data-automation':'job-detail-work-type'})
        print("Type: ", type.get_text())

        #print Details
        print("Detail: ", paragraph)


        #Add breaks
        print("\n-----------------------\n")
        context.close()
        browser.close()
    else: 
        print("Skill Not Found")
        
with sync_playwright() as playwright:
    jobs = get_jobstreet_list(input("Job: "))
    skill_list = [input("Skill 1: "),
                    input("Skill 2: "),
                    input("Skill 3: ")]
    for job in jobs:
        filtered_jobs(job, skills= skill_list)

