
import requests
from bs4 import BeautifulSoup
import re
import nltk
import pandas as pd
from nltk.sentiment import SentimentIntensityAnalyzer
import ssl
from nltk import sent_tokenize, word_tokenize

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download('vader_lexicon')
def negative_sentiment_scoring(text):
    sid = SentimentIntensityAnalyzer()
    result = sid.polarity_scores(text)['neg']
    return result

def positive_sentiment_scoring(text):
    sid = SentimentIntensityAnalyzer()
    result = sid.polarity_scores(text)['pos']
    return result

def neutral_sentiment_scoring(text):
    sid = SentimentIntensityAnalyzer()
    result = sid.polarity_scores(text)['neu']
    return result

def full_sentiment_scoring(text):
    sid = SentimentIntensityAnalyzer()
    result = sid.polarity_scores(text)
    return str(result)

def sentiment_scoring(text):
    sid = SentimentIntensityAnalyzer()
    result = sid.polarity_scores(text)['compound']
    return result

def sentiment(text):
    sentiment_score = sentiment_scoring(text)
    if sentiment_score >= 0.05:
        return 'Positive'
    elif sentiment_score <= -0.05:
        return 'Negative'
    else:
        return 'Neutral'
    

target_authors = pd.read_excel('python/Copy Telekom.xlsx', 'Author')
target_authors = list(target_authors['Author'])

target_spokesperson = [
    "Shazurawati Abd Karim",
    "Amar Huzaimi Md Deris",
    "Dato' Zainal Abidin",
    "Razidan Ghazalli",
    "Datuk Imri Mokhtar",
    "Datuk Haji Hamidin"
]

# Function to check if any target author is present in the text
def detect_spokesperson(text):
    for spokesperson in target_spokesperson:
        if spokesperson in text:
            return spokesperson
    return "NA"

def detect_author(text):
    for author in target_authors:
        if author in text:
            return author
    return "NA"

tokenized_word = []
tokenized_sentence = []


unique_sentences = [[word for idx, word in enumerate(sentence) if word not in sentence[:idx]] for sentence in tokenized_word]

combined_words = [word for sentence in tokenized_word for word in sentence]
unique_combined_words = set(combined_words)

business_keywords = ["Unifi", "TM One", "TM Wholesale", "Credence"]
corporate_keywords = ["TM Group", "TM R&D", "Yayasan TM", "MMU"]
product_keywords = ["Connectivity", "Cloud", "Data Centre", "Cybersecurity", "Smart Services", "Content", "Big Data & Analytics"]
others_keywords = ["ESG", "CSR"]


def clean_text(text):
    text = text.replace("<title", ' ')
    text = text.replace("title>", ' ')
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with a single space
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Remove non-alphanumeric characters
    text = text.replace('xa0', ' ')
    text = text.replace('nnnn', ' ')
    text = text.replace('  ', ' ') or text.replace('  ', ' ')
    return text.strip()  

def scrape_news(url):
    user = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    press_result= "NULL"
    headers = {
    'User-Agent': user,
    }

    response = requests.get(url,allow_redirects =True, headers= headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    title = soup.find_all('title')
    paragraph = soup.find_all('p')
    cleaned = clean_text(str(paragraph))

    ## Sentiment Analyzer--------------------------------------------------

    sid = SentimentIntensityAnalyzer()
    sentiment_score = sid.polarity_scores(cleaned)['compound']
    if sentiment_score >= 0.05:
        sentiment_result = 'Positive'
    elif sentiment_score <= -0.05:
        sentiment_result = 'Negative'
    else:
        sentiment_result = 'Neutral'
    
    ## Segment result--------------------------------------------------
   
    text_lower = cleaned.lower()

    if any(keyword.lower() in text_lower for keyword in business_keywords):
        segment_result= "Business Segment"
    elif any(keyword.lower() in text_lower for keyword in corporate_keywords):
        segment_result= "Corporate Segment"
    elif any(keyword.lower() in text_lower for keyword in product_keywords):
        segment_result= "Product Segment"
    elif any(keyword.lower() in text_lower for keyword in others_keywords):
        segment_result= "Others Segment"
    else:
        segment_result= "Unclassified"

    ## Press Result--------------------------------------------------y
    for unique_words in unique_combined_words:
        if any(unique in cleaned for unique in unique_words):
            press_result= "PR"  
        else:
            press_result= "NON-PR" 

    ## Detect Author and Spokesperson--------------------------------------------------
            
        spokerperson = detect_spokesperson(cleaned)
        author = detect_author(cleaned)

    ## Return statement-------------------------------------------------
    return f"Title: {clean_text(str(title))}\nSentiment: {sentiment_result}\nSegment: {segment_result}\nPress: {press_result}\nAuthor: {author}\nSpokesperson:{spokerperson}"

