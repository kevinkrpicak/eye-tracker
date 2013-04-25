$(document).ready(function(){
    console.log('hi');

    var HomeView = Backbone.View.extend({
        el: '.content_body',
        events:{},
        fooTemplate: $('#home-template').html(),
        initialize:function(){

        },
        render:function(){
            var data = {
                videos: [0, 1, 2, 3]
            };
            this.$el.html( Mustache.to_html( this.fooTemplate, data ));

            return this;
        }
    });
    var VideoModel = Backbone.Model.extend({
        initialize:function(){
            console.log('init');
        }
    });

    var VideoView = Backbone.View.extend({
        el: '.content_body',
        videoTemplate: $('#video-template').html(),
        // statsTemplate: _.template($('#stats-template').html()),
        events:{},
        initialize:function(){
            console.log('video init');
            this.model = new VideoModel();

        },
        render:function(){
            console.log('video render', this.$el);
            var data = {};
            this.$el.html( Mustache.to_html(this.videoTemplate, data) );

            return this;
        },
        noVideo:function(){

        }
    });

    var router = Backbone.Router.extend({

        routes: {
            "/video/:id":   "video",
            "/video/":      "video",
            '/video':       "video",
            "*path":        "home"
        },

        view: null,

        video: function(id){
            console.log("video");
            var data = {};

            try{ data.id = id; }
            catch(err){ /* do nothing*/ }

            this.view = new VideoView(data).render();
        },
        home: function(){
            console.log("home");
            this.view = new HomeView().render();
        }

    });

    var r = new router();
    Backbone.history.start();


});