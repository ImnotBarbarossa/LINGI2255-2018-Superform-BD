from datetime import datetime, timedelta
import json
from flask import Blueprint, url_for, request, redirect, render_template, flash, session

from superform.utils import login_required, datetime_converter, str_converter
from superform.models import db, Publishing, Channel


pub_page = Blueprint('publishings', __name__)


@pub_page.route('/moderate/<int:id>/<string:idc>', methods=["GET", "POST"])
@login_required()
def moderate_publishing(id, idc):
    pub = db.session.query(Publishing).filter(Publishing.post_id == id, Publishing.channel_id == idc).first()
    chan = db.session.query(Channel).filter(Channel.id == idc).first()
    pub.date_from = str_converter(pub.date_from)
    pub.date_until = str_converter(pub.date_until)

    if request.method == "GET":
        if pub.extra is not None:
            pub.extra = json.loads(pub.extra)
        return render_template('moderate_post.html', pub=pub, chan=chan)
    else:

        pub.date_from = datetime_converter(pub.date_from)
        pub.date_until = datetime_converter(pub.date_until)
        c = db.session.query(Channel).filter(Channel.id == pub.channel_id).first()
        if c.module == "superform.plugins.facebook":
            from superform.plugins.facebook import fb_token
            session["facebook_running"] = True
            if fb_token == 0:
                return redirect(url_for('publishings.moderate_publishing', id=id, idc=idc))
        else:
            session["facebook_running"] = False
        pub.title = request.form.get('titlepost')
        pub.description = request.form.get('descrpost')
        pub.link_url = request.form.get('linkurlpost')
        pub.image_url = request.form.get('imagepost')
        pub.date_from = datetime_converter(request.form.get('datefrompost'))
        pub.date_until = datetime_converter(request.form.get('dateuntilpost'))

        extra = dict()
        c = db.session.query(Channel).filter(Channel.id == pub.channel_id).first()
        plugin_name = c.module
        c_conf = c.config
        from importlib import import_module
        plugin = import_module(plugin_name)

        if 'get_channel_fields' in dir(plugin):
            extra = plugin.get_channel_fields(request.form, None)
        pub.extra = json.dumps(extra)

        # state is shared & validated
        pub.state = 1
        db.session.commit()
        # running the plugin here
        if (pub.date_until <= datetime.now() - timedelta(days=1)):
            pub.state = 0
            db.session.commit()
            flash('Too late to publish')
            pub.date_from = str_converter(pub.date_from)
            pub.date_until = str_converter(pub.date_until)
            if pub.extra is not None:
                pub.extra = json.loads(pub.extra)
            return render_template('moderate_post.html', pub=pub, chan=chan)
        from importlib import import_module
        plugin = import_module(plugin_name)
        plugin.run(pub, c_conf)
        try:
            pass
        except KeyError:
            pub.state = 0
            db.session.commit()
            flash('Please configure the channel first')
            pub.date_from = str_converter(pub.date_from)
            pub.date_until = str_converter(pub.date_until)
            if pub.extra is not None:
                pub.extra = json.loads(pub.extra)
            return render_template('moderate_post.html', pub=pub, chan=chan)

        return redirect(url_for('index'))
