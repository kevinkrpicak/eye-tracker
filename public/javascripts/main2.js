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
        // el: '.content_body',
        className: 'template-wrapper',
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
            var data = {
                videos: this.collection.toJSON()
            };
            this.$el.html( Mustache.to_html( this.fooTemplate, data ));
        }
    });

    var VideoView = Backbone.View.extend({
        // el: '.content_body',
        className: 'template-wrapper',
        videoTemplate: $('#video-template').html(),
        events:{
            'click .stop': 'stopPlayback',
            'click .pause': 'pausePlayback',
            'click .play': 'playPlayback'
        },
        initialize:function(){
            console.log('VideoView init', this);
            this.model = new VideoModel({video_id: this.options.id});
            this.model.on('reset', this.renderResult, this);
        },
        render:function(){
            console.log('VideoView render');
            this.model.fetch({
                success:function(model, response, options){
                    model.trigger('reset');
                }
            });
            this.$el.html('grabbing video data...');

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

            this._video.addEventListener('timeupdate', function(e){
                self.canvas.animate(this.currentTime);

                // keep track if the movie has ended
                self.ended = this.ended;
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

            // dirty way of forcing heatmap to reset
            if(this.ended && this.canvas.shape == "Heatmap"){
                this.canvas.heatmapFixation();
            }
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
    var timeOffset = function(time, startTime){
        return parseFloat(time, 10) - parseFloat(startTime, 10);
    };
    var CanvasView = Backbone.View.extend({
        el: '.template-wrapper',
        events:{
            'click .stop': 'stopCanvas',
            'click .pause': 'pauseCanvas',
            'click .play': 'playCanvas',
            'click .default-fixation': 'defaultFixation',
            'click .heatmap-fixation': 'heatmapFixation'
        },
        initialize:function(){
            console.log('CanvasView init');
        },
        render:function(){
            this.$videoArea = this.$('.video_area');
            this.$videoArea.append('<canvas id="canvas" />');
            this.$videoArea.append('<div id="heatmap_area" style="position:absolute; top:0; left:0; width:680px; height:382px;" />');

            this.filterBadFixations();
            this.setUp();

            return this;
        },

        ctx:        null,
        cWidth:     0,
        cHeight:    0,
        interval:   null,
        xShift:     1.5,
        radius:     10,
        scale:      0.3541666667,
        shape:      'Circle',
        style:      "rgba(255, 0, 0, .9)",

        setUp:function(){
            var canvas = document.getElementById('canvas');
            this.ctx = canvas.getContext("2d");

            // set canvas size
            var videoRegion = this.model.get('video_data').DATA.VIDEO_REGION[0].$;

            // shrink video region
            videoRegion.WIDTH *= this.scale;
            videoRegion.HEIGHT *= this.scale;

            $(canvas).attr({
                width: videoRegion.WIDTH,
                height: videoRegion.HEIGHT
            });

            // set global width/height
            this.cWidth = canvas.width;
            this.cHeight = canvas.height;

            this.startTime = this.filteredList[0].FPOGS;

        },
        filteredList:null,
        filterBadFixations:function(){
            var rec = this.model.get('video_data').DATA.REC;
            var filtered = rec.filter(function(element, index, array){
                return !!parseInt(element.$.FPOGV, 10);
            });

            function avg(array){
                var sum = 0;
                for(var i = 0; i < array.length; i++){
                    sum += parseFloat(array[i], 10);
                }
                return sum/array.length;
            }

            function groupList(_data, _list, _keys){

                var list = _list;
                var keys = _keys;
                var idKey = _data.id;
                var timeKey = _data.time;
                var obj = {};
                var endObj = {};
                endObj[idKey] = list[0][idKey];
                endObj[timeKey] = list[0][timeKey];

                // set up initial obj
                for(var k = 0; k < keys.length; k++){
                    obj[keys[k]] = [];
                }

                // console.log('obj: ', obj);

                var item;
                for(var i = 0; i < list.length; i++){
                    item = list[i];
                    // console.log('item: ', item);
                    for(var j = 0; j < keys.length; j++){
                        obj[keys[j]].push( item[keys[j]] );

                        if(i+1 == list.length){
                            endObj[keys[j]] = avg( obj[keys[j]] );
                        }
                    }
                }

                return endObj;
            }

            function groupBySameKey(_data, _list, _keys){
                var list = _list;
                var keys = _keys;
                var idKey = _data.id;
                var endList = [];
                var gl = [];

                var currentKey = list[0].$[idKey];
                for(var i = 0; i < list.length; i++){

                    if(list[i].$[idKey] != currentKey){
                        endList.push( groupList(_data, gl, keys) );

                        // console.log("   reset");
                        // reset
                        gl.length = 0;
                        currentKey = list[i].$[idKey];
                    }

                    gl.push( list[i].$ );

                }
                endList.push( groupList(_data, gl, keys) );

                return endList;
            }


            this.filteredList = groupBySameKey({id: "FPOGID", time: "FPOGS"}, filtered, ["FPOGX", "FPOGY"]);
            console.log('length: ', this.filteredList.length);
            // console.log(this.filteredList);

            // this.filteredList = filtered;
        },

        startIndex: 0, // keep track of where you left off in the filtered list array
        getIndexOfClosestFixation:function(currentTime, list){
            var low = 0;
            var high;

            for(var i = this.startIndex; i < list.length; i++){
                if(timeOffset(list[i].FPOGS, this.startTime) < currentTime){
                    low = i;
                }else{
                    high = i;
                    break;
                }
            }

            this.startIndex = low;

            var lowDiff = currentTime - timeOffset(list[low].FPOGS, this.startTime);
            var highDiff;
            if(high){
                highDiff = timeOffset(list[high].FPOGS, this.startTime) - currentTime;
            }

            // return closest of low/high
            if(highDiff == 'undefined' || lowDiff < highDiff){
                return low;
            }else{
                return high;
            }
        },

        animate:function(currentTime){
            var self = this;
            var list = this.filteredList;
            var index = this.getIndexOfClosestFixation(currentTime, list);

            try{
                var xPos = percentToPixel(list[index].FPOGX, self.cWidth);
                var yPos = percentToPixel(list[index].FPOGY, self.cHeight);

                self.draw( xPos, yPos, self.shape);
            } catch(err){
                // no more values
            }
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

        drawHeatmap:function(ctx, x, y){
            this.heatmap.store.addDataPoint(Math.round(x),Math.round(y));
        },

        stopCanvas:function(){
            this.pauseCanvas();
            this.i = 0;
        },
        pauseCanvas:function(){
            console.log('pause canvas');
        },
        playCanvas:function(){
            this.animate();
        },

        defaultFixation:function(e){
            try{
                this.setActiveClass(e);
            }catch(err){}

            console.log('default');
            this.shape = "Circle";

            this.$('#heatmap_area').empty();
        },

        setActiveClass:function(e){
            this.$('.data-display > .btn').removeClass('active');
            $(e.currentTarget).addClass('active');
        },

        heatmapFixation:function(e){
            try{
                this.setActiveClass(e);
            }catch(err){}

            console.log("set heatmap");

            this.shape = "Heatmap";

            // clear canvas before starting heatmap
            this.clear(this.ctx);
            this.$('#heatmap_area').empty();

            // initialize heatmap
            this.heatmap = h337.create({
                "element":document.getElementById("heatmap_area"),
                "radius":25,
                "visible":true
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
        $contentBody: $('.content_body'),
        video: function(id){
            console.log("video route");
            var data = {};

            try{ data.id = id; }
            catch(err){ /* do nothing*/ }

            if(this.view){
                this.view.remove();
            }
            this.view = new VideoView(data);

            this.render();
        },
        home: function(){
            console.log("home route");

            if(this.view){
                this.view.remove();
            }
            this.view = new HomeView();

            this.render();
        },
        render:function(){
            this.$contentBody.html(this.view.render().el);
        }
    });

    var r = new router();
    Backbone.history.start();

});