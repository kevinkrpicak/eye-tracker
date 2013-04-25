$(document).ready(function(){

    // $(document).on("click", ".exempt", function(e){
    //     e.preventDefault();
    // });

    // Backbone starts...
    var VideoModel = Backbone.Model.extend({
        initialize:function(){
            console.log('init');
        }
    });

    var GrabAllCollection = Backbone.Collection.extend({
        url: '/grab-all/',
        model: VideoModel,
        initialize:function(){
            console.log('collection init');
        }
    });

    var HomeView = Backbone.View.extend({
        el: '.content_body',
        events:{},
        fooTemplate: $('#home-template').html(),
        initialize:function(){
            this.collection = new GrabAllCollection();

            this.collection.on('reset', this.renderResults, this);
        },
        render:function(){
            this.collection.fetch({
                success:function(collection, response, options){
                    collection.trigger('reset');
                }
            });
            this.$el.html( 'doing some work...');

            return this;
        },
        renderResults:function(){
            console.log('render results');
            var data = {
                videos: this.collection.toJSON()
            };
            this.$el.html( Mustache.to_html( this.fooTemplate, data ));
        }
    });

    var VideoView = Backbone.View.extend({
        el: '.content_body',
        videoTemplate: $('#video-template').html(),
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
        }
    });

    var router = Backbone.Router.extend({
        routes: {
            "/video/*path":     "video",
            "video/*path":      "video",
            "*path":            "home"
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