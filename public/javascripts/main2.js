$(document).ready(function(){

    // $(document).on("click", ".exempt", function(e){
    //     e.preventDefault();
    // });

    // Backbone starts...
    var VideoModel = Backbone.Model.extend({
        url: function(){
            var _url;
            try{
                _url = '/grab/'+this.get('video_id')+'/';
            } catch(err){
                _url = '/grab/';
            }
            return _url;
        },
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
        events:{
            'click .stop': 'stopPlayback',
            'click .pause': 'pausePlayback',
            'click .play': 'playPlayback'
        },
        initialize:function(){
            console.log('video init', this);
            this.model = new VideoModel({video_id: this.options.id});
            this.model.on('change', this.renderResult, this);
        },
        render:function(){
            console.log('render before fetch');
            this.model.fetch({
                success:function(model, response, options){
                    model.trigger('change');
                }
            });
            this.$el.html('grabbing video data');

            return this;
        },
        renderResult:function(){
            var data = this.model.toJSON();
            this.$el.html( Mustache.to_html(this.videoTemplate, data) );

            this.$videoArea = this.$('#video_area');
            // set up important elements
            this._video = document.getElementById('video'); // want the non-jquery obj for html5 video api
            // bind video events after video is in dom
            this.videoEvents();

        },
        videoEvents:function(){
            var self = this;
            this._video.addEventListener('play', function(e){
                self._play(e, this);
            });
            this._video.addEventListener('pause', function(e){
                self._pause(e, this);
            });
        },
        stopPlayback:function(){
            try{
                this.pausePlayback();
                this._video.currentTime = 0;

                // I'm too lazy to make a custom event or look up how to do it.
                this._stop(null, this._video);
            }
            catch(err){}
        },
        pausePlayback:function(){
            try{ this._video.pause(); }
            catch(err){}
        },
        playPlayback:function(){
            console.log('play');
            try{ this._video.play(); }
            catch(err){}
        },
        _play:function(e, el){
            console.log('play', e, el);
        },
        _pause:function(e, el){
            console.log('pause', e, el);
        },
        _stop:function(e, el){
            console.log('stop', e, el);
        }
    });
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
            console.log('video', data);
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