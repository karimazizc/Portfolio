
import pandas as pd
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import json
import re

def identify_platform(web):
    link = str(web).lower()
    if 'facebook.com' in link:
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
    else:
        return 'unknown'

# facebook regex
fb_pattern_likes =  r'"count":(\d+)'
fb_pattern_comments = r'"total_comment_count":(.*?),"'
fb_pattern_share = r'"count":(.*?),"'

# youtube regex
yt_pattern = r'"title":"(.*?)"'
yt_pattern_likes = r'"likeCount":(\d+),'
yt_pattern_comments = r'"simpleText":"(\d+)"'

# tiktok regex spell
tt_regex_views = 'playCount":'
tt_regex_likes = 'like-count">'
tt_regex_comment = 'comment-count">'
tt_regex_share = 'share-count">'

# tiktok regex
pattern_views= r'playCount":([0-9.]+[KkMm]*),'
pattern_like = r'like-count">(\d+)</'
pattern_comment = r'comment-count">(\d+)</'
pattern_share = r'share-count">(\d+)</'


# tiktok second regex
pattern_share_2 = r'shareCount">(\d+)<'
pattern_comment_2= r'commentCount">(\d+)<'
pattern_likes_2 = r'collectCount">(\d+)<'


# tiktok regex spell


i = 1
user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'


chrome_options= Options()
chrome_options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

headers= {
    'User-Agent': user,
}

def scrape_social(link):

    if identify_platform(link) == 'facebook':
        try:
            response = requests.get(link, allow_redirects= True, headers = headers)
            url = response.url
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            driver.get(url)
            soup = BeautifulSoup(driver.page_source, 'lxml')
            driver.quit()
            raw_soup = str(soup)

            diff0 = raw_soup.find('","total_comment_count":')
            diff2 = len('","total_comment_count":')
            comment_sentence = raw_soup[diff0: diff0 + diff2 + 6]
            match_comments = re.search(fb_pattern_comments, comment_sentence)
            FB_comments = match_comments.group(1)

            diff = raw_soup.find('},"reaction_count":{"count":')
            diff1 = len('},"reaction_count":{"count":')
            likes_sentence = raw_soup[diff: diff + diff1 + 6]

            match_likes =re.search(fb_pattern_likes, likes_sentence)
            FB_likes = match_likes.group(1)

            diff_share = raw_soup.find('share_count":{"count":')
            diff_share0 = len('","total_comment_count":')
            sentence_share = raw_soup[diff_share: diff_share0 + diff_share + 6]
            match_share = re.search(fb_pattern_share, sentence_share)
            FB_share = match_share.group(1)

            return f"Facebook\nLikes: {FB_likes}\nComments: {FB_comments}\nShares: {FB_share}\n"
            
        except Exception as e:

            return f"Unsuccessful"

    ###------------------------------------------YOUTUBE----------------------------------
            
    elif identify_platform(link) == 'youtube':
        ## youtube logic h

        # Fetch the HTML content
        soup = BeautifulSoup(requests.get(link, cookies={'CONSENT': 'YES+1'}).text, "html.parser")

        # Extract JSON data from the HTML using regex
        data = re.search(r"var ytInitialData = ({.*});", str(soup.prettify())).group(1)

        # Load JSON data
        json_data = json.loads(data)

        # get soup
        raw_soup = str(soup)
        diff = raw_soup.find(':"LIKE","title":"')
        diff1 = len(':"LIKE","title":"')
        # Extract required information
        try:
            title = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0]['videoPrimaryInfoRenderer']['title']['runs'][0]['text']
            views = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][0]['videoPrimaryInfoRenderer']['viewCount']['videoViewCountRenderer']['viewCount']['simpleText']
            channel = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1]['videoSecondaryInfoRenderer']["owner"]["videoOwnerRenderer"]['title']['runs'][0]['text']
            subscriber = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][1]['videoSecondaryInfoRenderer']["owner"]["videoOwnerRenderer"]["subscriberCountText"]["accessibility"]['accessibilityData']['label']
            n_comments = json_data['contents']['twoColumnWatchNextResults']['results']['results']['contents'][2]['itemSectionRenderer']['contents'][0]['commentsEntryPointHeaderRenderer']['commentCount']['simpleText']
            sentence = raw_soup[diff :diff + diff1 +10]
            match = re.search(yt_pattern, sentence)
            yt_likes = match.group(1)   
        
            return f'Youtube\nTitle: {title}\nViews: {views}\nChannel: {channel}\nSubscribers: {subscriber}\ncomments: {n_comments}\nLikes: {yt_likes}\n'
       
        except Exception:
            return f"Unsuccessful"

            
            

    ###------------------------------------------INSTAGRAM----------------------------------

    elif identify_platform(link) == 'instagram':
        ## instagram logic here
        try:
            soup = BeautifulSoup(requests.get(link, cookies={'CONSENT': 'YES+1'}).text, "html.parser")
            # Load JSON data
            description = soup.find_all('meta',{'name':'description'})

            ig_likes = str(description).split()[1].replace("content='", "").replace('content="','')
            ig_comments = str(description).split()[3]
            return f'Instagram\nLikes: {ig_likes}\nComments: {ig_comments}\n'
        except:          
            return f"Unsuccessful" 
   
            
    ###------------------------------------------TIKTOK----------------------------------

    elif identify_platform(link) == 'tiktok':
        try:
            response = requests.get(link, allow_redirects= True, headers = headers)
            url = response.url
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()),options=chrome_options)
            driver.get(url)
            soup = BeautifulSoup(driver.page_source, 'lxml')
            raw_soup = str(soup)
            driver.quit()
            TT_like_diff = raw_soup.find(tt_regex_likes)
            TT_like_diff1 = len(tt_regex_likes)
            sentence_like = raw_soup[TT_like_diff: TT_like_diff + TT_like_diff1 + 6]
            match_like = re.search(pattern_like, sentence_like)
            TT_like = match_like.group(1)

            TT_share_diff = raw_soup.find(tt_regex_share)
            TT_share_diff1 = len(tt_regex_share)
            sentence_share = raw_soup[TT_share_diff: TT_share_diff1 + TT_share_diff + 6]
            match_share = re.search(pattern_share_2, sentence_share)
            TT_share = match_share.group(1)

            TT_comments_diff = raw_soup.find(tt_regex_comment)
            TT_comments_diff1 = len(tt_regex_comment)
            sentence_comment = raw_soup[TT_comments_diff: TT_comments_diff1 + TT_comments_diff + 6]
            match_comment = re.search(pattern_comment_2, sentence_comment)
            TT_comment = match_comment.group(1)

            views_diff = raw_soup.find(tt_regex_views)
            views_diff1 = len(views)
            
            sentence_views = raw_soup[views_diff: views_diff + views_diff1 + 10]
            match_views = re.search(pattern_views, sentence_views)
            TT_Views = match_views.group(1)

            return f"Tiktok\nLikes: {TT_like}\nComments: {TT_comment}\nShares: {TT_share}\nViews: {TT_Views}\n"

        except Exception as e:
            return f"Failed\n"
  

    ###------------------------------------------TWITTER----------------------------------

    elif identify_platform(link) == 'twitter':
        
        return f"Twitter Scrapper Unavailable"

    else:
        return f"Unclassified Link"



