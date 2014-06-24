(function($){
    console.log('hi');

    var HomeView = Backbone.View.extend({
        el: '.content_body',
        events:{},
        fooTemplate: $('#home-template').html(),
        initialize:function(){

        },
        render:function(){
            console.log('render');
            var data = {
                videos: [0, 1, 2, 3]
            };
            console.log('data');
            this.$el.html( Mustache.to_html( this.fooTemplate, data ));

            return this;
        }
    });

    var VideoView = Backbone.View.extend({
        el: '.content_body',
        videoTemplate: $('#video-template').html(),
        // statsTemplate: _.template($('#stats-template').html()),
        events:{},
        initialize:function(){

        },
        render:function(){
            var data = {};
            this.$el.html( Mustache.to_html(this.videoTemplate, data) );

            return this;
        }
    });

    var router = Backbone.Router.extend({

        routes: {
            "/video/:id": "video",
            "/": "home"
        },

        view: null,

        video: function(id){
            this.view = new VideoView({id: id}).render();
        },
        home: function(){
            this.view = new HomeView().render();
        }

    });

    var r = new router();
    Backbone.history.start();


})(jQuery);