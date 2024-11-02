from flask import Flask, render_template, url_for, request
from socials import youtube_scrape, instagram_scrape, identify_platform
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)


@app.route('/scrape', methods = ["POST"]) 
def scrape():
    link = request.form.get('link', None)
    print(link)
    platform = identify_platform(link)
    if platform == "youtube":
        title, views, channel, subscriber, comments, likes = youtube_scrape(link)
        return render_template('scrape.html', 
                           platform = platform,
                           link = link, 
                           title = title, 
                           views = views, 
                           channel =channel, 
                           subscriber = subscriber, 
                           comments =comments, 
                           likes= likes)
    
    elif platform == "instagram":
        title, likes, comments = instagram_scrape(link)
        return render_template('scrape.html', 
                           platform = platform,
                           link = link, 
                           title = title, 
                           views = "", 
                           channel ="", 
                           subscriber = "", 
                           comments ="", 
                           likes= likes)
    elif platform == "unknown":
        return render_template('scrape.html', 
                           platform = platform,
                           link = link, 
                           title = title, 
                           views = "", 
                           channel ="", 
                           subscriber = "", 
                           comments ="", 
                           likes= likes)
@app.route("/greet", methods = ["POST"])
def greet():
    name = request.form.get("name", "world")
    print(name)
    return render_template("greet.html", name = name)