from flask import Flask, render_template, url_for
from socials import youtube_scrape, instagram_scrape, tiktok_scrape, identify_platform
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)


@app.route('/scrape') 
def scrape(link):
    if identify_platform == "youtube":
        youtube_scrape(link)
    elif identify_platform == "instagram":
        instagram_scrape(link)
    elif identify_platform == "tiktok":
        tiktok_scrape(link)
