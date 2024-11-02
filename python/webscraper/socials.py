from bs4 import BeautifulSoup
import requests
import time
import re
import json
from playwright.sync_api import sync_playwright
def instagram_scrape(link):
    try: 
        soup = BeautifulSoup(requests.get(link, cookies={'CONSENT': 'YES+1'}).text, "html.parser")
        # Load JSON data
        description = soup.find_all('meta',{'name':'description'})

        ig_likes = str(description).split()[1].replace("content='", "").replace('content="','')
        ig_comments = str(description).split()[3]
        diff1 = str(description).find(":")
        diff2 =str(description).find('name="description"')
        ig_title = str(description)[diff1:diff2]
        print(f'Title: {ig_title}\nLikes: {ig_likes}\nComments: {ig_comments}\n')
    
    except IndexError: 
        print("Sorry, this page isn't available.\n")

def youtube_scrape(link):
    if "https://www.youtube.com" not in link:
        print ("invalid link")
        return "invalid link"
    yt_pattern = r'"title":"(.*?)"'
    # Code execution------------------------------------------------------------------------------------------------------------
    soup = BeautifulSoup(requests.get(link, cookies={'CONSENT': 'YES+1'}).text, "html.parser")

    # Extract JSON data from the HTML using regex
    data = re.search(r"var ytInitialData = ({.*});", str(soup.prettify())).group(1)

    # Load JSON data
    json_data = json.loads(data)
    data_list = []

    # Extract required information
    try:
        title = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0]['videoPrimaryInfoRenderer']['title']['runs'][0]['text']
        channel = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1]['videoSecondaryInfoRenderer']["owner"]["videoOwnerRenderer"]['title']['runs'][0]['text']
        subscriber = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1]['videoSecondaryInfoRenderer']["owner"]["videoOwnerRenderer"]["subscriberCountText"]["accessibility"]['accessibilityData']['label']        
        ytviews = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0]['videoPrimaryInfoRenderer']['viewCount']['videoViewCountRenderer']['viewCount']['simpleText']
        ytviews = ytviews.split("tontonan")[0]
        # get soup
        raw_soup = str(soup)
        diff = raw_soup.find(':"LIKE","title":"')
        diff1 = len(':"LIKE","title":"')
        sentence = raw_soup[diff :diff + diff1 +10]
        match = re.search(yt_pattern, sentence)
        yt_likes = match.group(1)   
        try: 
            n_comments = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][2]['itemSectionRenderer']['contents'][0]['commentsEntryPointHeaderRenderer']['commentCount']['simpleText']
        except:
            n_comments = 0
    # Append the information to the data_list
        data_list.append({"URL":link,"Platform": "Youtube", "Likes": yt_likes, "Comments": n_comments, "Shares": ' ', 'Views': ytviews, 'Subscribers':subscriber,'Title': title,'Channel': channel})

        print(f'URL: {link}\nTitle: {title}\nViews: {ytviews}\nChannel: {channel}\nSubscribers: {subscriber}\ncomments: {n_comments}\nLikes: {yt_likes}\n')
        

    except KeyError:
        
    ###------------------------------------------YOUTUBE REEL----------------------------------
        try: 
            print('Youtube Shorts attempt----')
            yt_likes = raw_soup[raw_soup.find('likeCount":')+len('likeCount":'):raw_soup.find('likeCount')+100].split(",")[0]
            ytviews = raw_soup[raw_soup.find('views')+len('views'):raw_soup.find('views')+100].split('"')[4]
            title = raw_soup[raw_soup.find('simpleText":')+len('simpleText":'):raw_soup.find('simpleText')+100].split('"')[1]
            n_comments = raw_soup[raw_soup.find('viewCommentsButton')+len('viewCommentsButton'):raw_soup.find('viewCommentsButton')+100].split('"')[10]
            data_list.append({"URL":link,"Platform": "Youtube", "Likes": yt_likes, "Comments": n_comments, "Shares": ' ', 'Views': ytviews, 'Subscribers':subscriber,'Title': title,'Channel': channel})

            print(f'URL: {link}\nTitle: {title}\nViews: {ytviews}\nChannel: {channel}\nSubscribers: {subscriber}\ncomments: {n_comments}\nLikes: {yt_likes}\n')
            
        
        except Exception:
    ###------------------------------------------YOUTUBE ERROR----------------------------------
            data_list.append({"URL": link,"Platform": "Youtube", "Likes": ' ', "Comments":  ' ', "Shares": ' ', 'Views': ' ', 'Subscribers': ' '})
            print(f"Unsuccessful URL: {link}\n")

def json_metrics(script):
    json_data = json.loads(script)

    # Navigate to the stats data
    stats = json_data['__DEFAULT_SCOPE__']['webapp.video-detail']['itemInfo']['itemStruct']['stats']
    
    # Extract the requested values
    digg_count = stats['diggCount']
    share_count = stats['shareCount']
    comment_count = stats['commentCount']
    play_count = stats['playCount']
    collect_count = stats['collectCount']
    
    print(f"diggCount: {digg_count}")
    print(f"shareCount: {share_count}")
    print(f"commentCount: {comment_count}")
    print(f"playCount: {play_count}")
    print(f"collectCount: {collect_count}")

def tiktok_scrape(link):
    
    if "/video/" not in link:
        print("\n------------------------------------------")
        print("non-video link")
        pass

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(link)
        for _ in range(3):
            page.mouse.wheel(0,1000)
        content = page.content()
        soup = BeautifulSoup(content, "html.parser")
# Parse the HTML content
# Find the script tag containing the data
    script_tag = soup.find('script', id='__UNIVERSAL_DATA_FOR_REHYDRATION__')

    if script_tag:
        try:
            # Extract the JSON data from the script tag
            json_metrics(script_tag.string)

        except KeyError:
            print("Video link unavailable")
    else:
        print("Could not find the required data in the HTML.")
        print("Second attempt...")
        time.sleep(2)
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(link)
            for _ in range(3):
                page.mouse.wheel(0,1000)
            content = page.content()
            soup = BeautifulSoup(content, "html.parser")
        script_tag = soup.find('script', id='__UNIVERSAL_DATA_FOR_REHYDRATION__')
        json_metrics(script_tag)

def identify_platform(web:str) -> str:

    link = str(web).lower()

    if 'facebook.com' in link:
        return 'facebook'
    
    elif 'fb.watch' in link:
        return 'facebook'
    
    elif 'youtube.com' in link:
        return 'youtube'
    
    elif 'youtu.be' in link:
        return 'youtube'
    
    elif 'instagram.com' in link:
        return 'instagram'
    
    elif 'tiktok.com' in link:
        return 'tiktok'
    
    elif 'x.com' in link:
        return 'twitter'
    
    elif 'twitter' in link:
        return 'twitter'
    
    elif 'xhslink.com' in link:
        return 'xiao'
    
    elif ' xiaohongshu.com' in link:
        return 'xiao'
    
    else:
        return 'unknown'
    
if __name__ == "__main__":
    link = input("link: " )
    print(tiktok_scrape(link))
    