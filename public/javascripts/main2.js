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

            this.canvas = new CanvasView();
            this.canvas.model = this.model;
            this.canvas.render();
            console.log('this.canvas', this.canvas);

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

    var percentToPixel = function(percent, scale){
        return percent * scale;
    };
    var CanvasView = Backbone.View.extend({
        el: '.content_body',
        events:{
            'click .stop': 'stopCanvas',
            'click .pause': 'pauseCanvas',
            'click .play': 'playCanvas'
        },
        initialize:function(){
            console.log('init');
        },
        render:function(){
            console.log("render");
            this.$videoArea = this.$('.video_area');
            this.$videoArea.append('<canvas id="canvas" />');

            this.filterBadFixations();
            this.setUp();

            return this;
        },
        ctx:        null,
        cWidth:     0,
        cHeight:    0,
        interval:   null,
        xPos:       0,
        yPos:       20,
        xShift:     1.5,
        speed:      20,
        radius:     10,
        scale:      0.595,
        shape:      'Circle',
        style:      "rgba(255, 0, 0, .2)",
        setUp:function(){
            var canvas = document.getElementById('canvas');
            this.ctx = canvas.getContext("2d");

            // set canvas size
            var videoRegion = this.model.get('video_data').DATA.VIDEO_REGION[0].$;
            console.log(videoRegion.WIDTH, videoRegion.HEIGHT);
            // shrink video region
            videoRegion.WIDTH *= this.scale;
            videoRegion.HEIGHT *= this.scale;
            console.log(videoRegion.WIDTH, videoRegion.HEIGHT);
            $(canvas).attr({
                width: videoRegion.WIDTH,
                height: videoRegion.HEIGHT
            });

            // set global width/height
            this.cWidth = canvas.width;
            this.cHeight = canvas.height;
        },
        filteredList:null,
        filterBadFixations:function(){
            var rec = this.model.get('video_data').DATA.REC;
            var filtered = rec.filter(function(element, index, array){
                return !!parseInt(element.$.FPOGV, 10);
            });

            this.filteredList = filtered;
        },
        i:0,
        animate:function(){
            var self = this;

            var list = this.filteredList;
            this.interval = setInterval(function(){

                self.xPos = percentToPixel(list[self.i].$.FPOGX, self.cWidth);
                self.yPos = percentToPixel(list[self.i].$.FPOGY, self.cHeight);
                self.draw(self.xPos, self.yPos, self.shape);
                self.i++;

                // end interval when end reached
                if(self.i >= list.length){
                    clearInterval(self.interval);
                    self.i = 0;
                }

            }, this.speed);

        },
        clear: function(ctx){
            //Clear Canvas
            ctx.clearRect(0, 0, this.cWidth, this.cHeight);
        },
        draw:function(x, y, shape){
            var ctx = this.ctx;
            this['draw'+shape](ctx, x, y, this.radius, this.style);
        },

        drawCircle: function(ctx, x, y, r, style){
            this.clear(ctx);
            // redraw
            ctx.beginPath();

            // arc(x, y, radius, startAngle, endAngle, anticlockwise)
            ctx.arc(x, y, r, 0, Math.PI*2, true); // Outer circle

            // ctx.lineTo(x, y);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = style;
            ctx.fill();
        },

        stopCanvas:function(){
            this.pauseCanvas();
            this.i = 0;
        },
        pauseCanvas:function(){
            console.log('pause canvas');
            clearInterval(self.interval);
        },
        playCanvas:function(){
            this.animate();
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