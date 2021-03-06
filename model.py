"""Models and database functions for Hamilton project"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


#####################################################

class Song(db.Model):
    """A song from the musical Hamilton"""

    __tablename__ = "songs"

    song_id = db.Column(db.Integer,
                        autoincrement=True,
                        primary_key=True)
    title = db.Column(db.String(64),
                      nullable=False)
    act = db.Column(db.Integer,
                    nullable=False)

    def __repr__(self):
        """define how model displays."""

        return "<Song %s. %s>" % (self.song_id,
                                  self.title)


class Character(db.Model):
    """A named character from the musical Hamilton"""

    __tablename__ = "characters"

    char_code = db.Column(db.String(5),
                          primary_key=True)
    full_name = db.Column(db.String(64),
                          nullable=False)
    name = db.Column(db.String(64),
                     nullable=False)

    def __repr__(self):
        """define how model displays."""

        return "<Char %s: %s>" % (self.char_code,
                                  self.name)


class Line(db.Model):
    """A single line from one fo the songs"""

    __tablename__ = "lines"

    # table data
    line_no = db.Column(db.Integer,
                        autoincrement=True,
                        primary_key=True)
    song_id = db.Column(db.Integer,
                        db.ForeignKey('songs.song_id'),  # foreign key
                        nullable=False)
    char_code = db.Column(db.String(5),
                          db.ForeignKey('characters.char_code'),  # foreign key
                          nullable=False)
    lyrics = db.Column(db.String(128),
                       nullable=False)

    # link models to one another for easier querying
    song = db.relationship('Song',
                           backref=db.backref('lines', order_by=line_no))
    char = db.relationship('Character',
                           backref=db.backref('lines', order_by=char_code))

    def __repr__(self):
        """define how model displays."""

        return "<Line %s.%s - %s>" % (self.song_id,
                                      self.line_no,
                                      self.lyrics)  # WARNING: lyrics must be
                                              # 100% ASCII characters for them
                                              # to display in the command line.


###############################################################

def connect_to_db(app, db_uri=None):
    """Connect the database to our Flask app."""

    # Configure to use our PstgreSQL database
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri or "postgresql:///hamildata"
    app.config['SQLALCHEMY_ECHO'] = True
    db.app = app
    db.init_app(app)


def example_data():
    """Create example data for the test database."""

    song1 = Song(title='song1', act='1')
    song2 = Song(title='song2', act='1')
    song3 = Song(title='song3', act='2')
    song4 = Song(title='song4', act='2')

    char1 = Character(char_code='ham', full_name='Alexander Hamilton', name='Hamilton')
    char2 = Character(char_code='burr', full_name='Aaron Burr', name='Burr')

    line1 = Line(song_id='1', char_code='ham', lyrics='Look aound! Look around!')
    line2 = Line(song_id='1', char_code='ham', lyrics='Look aound! Look around!')
    line3 = Line(song_id='2', char_code='ham', lyrics='How does a bastard orphan')
    line4 = Line(song_id='2', char_code='burr', lyrics='Look aound! Look around!')
    line5 = Line(song_id='3', char_code='burr', lyrics='How does a bastard orphan')
    line6 = Line(song_id='3', char_code='burr', lyrics='son of a whore and a scotsman')
    line7 = Line(song_id='4', char_code='burr', lyrics='Sir!')
    line8 = Line(song_id='4', char_code='ham', lyrics='Look around...')

    db.session.add_all([song1, song2, song3, song4, char1, char2, line1,
                        line2, line3, line4, line5, line6, line7, line8])
    db.session.commit()

    print "Added songs, lines, and characters to test database"


if __name__ == "__main__":
    # As a convenience, if we run this module interactively, it will leave
    # you in a state of being able to work with the database directly.

    from server import app
    connect_to_db(app)
    print "Connected to DB."
