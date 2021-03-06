import json
import os
# from jinja2 import StrictUndefined
from flask import Flask, render_template, jsonify, redirect, request, flash, session, g, send_from_directory, url_for
from sqlalchemy import func, desc
from model import Line, Song, Character, connect_to_db, db
from comparisons import comp_songs, get_bar_data


# create fask application
app = Flask(__name__)

# cause Jinja to fail loudly, so errors are caught
# app.jinja_env.undefined = StrictUndefined

PORT = int(os.environ.get("PORT", 5000))
DEBUG = "NO_DEBUG" not in os.environ
JS_TESTING_MODE = False


@app.before_request
def add_tests():

    g.jasmine_tests = JS_TESTING_MODE


@app.route('/favicon.ico')
def serve_favicon():
    '''Serve our favicon'''

    return send_from_directory(os.path.join(app.root_path, 'static/img'), 'favicon.ico')


@app.route('/')
def index():
    """Render homepage."""

    return render_template("homepage.html")


@app.route("/bundle_data.json")
def get_graph_data():
    """pull pre-loaded song connections from json file"""

    # open pre-loaded file of song connections
    f = open('static/song_data.json')
    content = f.read()
    my_json = json.loads(content)

    # render json to homepage
    return jsonify({'data': my_json})


@app.route("/get_lyrics.json")
def get_lyrics():
    """Get song lyrics to populate info box"""

    # get song title frm AJAX request
    song_title = request.args.get('title')

    # find all song lines from the given song
    song_lines = (Line.query
                  .filter(Line.song_id == (db.session.query(Song.song_id)  # check that the song id for the line is the same as the song id
                                           .filter(Song.title == song_title).one()  # for the song passed in by the AJAX query
                                           )[0])
                  .order_by(Line.line_no).all())  # sort by line number

    song_lyrics = []

    # pull character names and lyrics from the Line object
    for line in song_lines:
        name = line.char.name
        lyrics = line.lyrics

        # append tuple to list of song lyrics
        song_lyrics.append((name, lyrics))

    # pass list of tuples back to webpage
    return jsonify({'lyrics': song_lyrics})


@app.route("/compare_songs.json")
def compare_songs():
    """Get song lyrics to populate info box"""

    song_title_1 = request.args.get('title1')
    song_title_2 = request.args.get('title2')

    # get the song id for the line from the title passed in by the AJAX query
    song1 = db.session.query(Song.song_id).filter(Song.title == song_title_1).one()[0]
    song2 = db.session.query(Song.song_id).filter(Song.title == song_title_2).one()[0]

    comparisons = comp_songs(song1, song2)

    # TODO: rewrite comp_lines so that it returns a dictionary of tuples, as per notebook sketch

    return jsonify(comparisons)


@app.route('/2', methods=['GET', 'POST'])
def bar_chart():
    """Render second page."""

    return render_template("search_lyrics.html")


@app.route("/bar_data.json")
def get_graph_data2():
    """
    Search lines for provided word(s), return json for populating both bar
    chart and infobox.

    """

    search_input = request.args.get('search', "Alexander Hamilton")

    my_json = get_bar_data(search_input)

    # render json to homepage
    return jsonify({'data': my_json})


##########################################################


if __name__ == "__main__":  # pragma: no cover
    # We have to set debug=True here, since it has to be True at the point
    # that we invoke the DebugToolbarExtension

    connect_to_db(app, os.environ.get("DATABASE_URL"))

    # url_for('static', filename='bar_data.csv')

    # Use the DebugToolbar
    # DebugToolbarExtension(app)

    import sys
    if sys.argv[-1] == "jstest":
        JS_TESTING_MODE = True

        app.run(host="0.0.0.0", port=PORT, debug=DEBUG)

    else:
        app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
