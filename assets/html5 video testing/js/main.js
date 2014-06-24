var videoPlayer = function(){
    this.init();
};

    videoPlayer.prototype = {
        _video: document.getElementById('video'),
        $playbackButton: $('#playback-button'),
        $timeFrame: $('.time-frame').eq(0),
        init:function(){
            this.bindEvents();
        },
        bindEvents:function(){
            var self = this;
            this.$playbackButton.on('click', function(e){
                self.togglePlayback(e, this);
            });

            this._video.addEventListener('play', function(e){
                self.play(e, this);
            });
            this._video.addEventListener('pause', function(e){
                self.pause(e, this);
            });

            this._video.addEventListener('timeupdate', function(e){
                console.log("time update!", e, this.currentTime);
            });

        },
        togglePlayback:function(e, $el){
            console.log('toggle', this._video.pause);
            if(this._video.paused) this._video.play();
            else this._video.pause();
        },
        play:function(e, el){
            console.log('play', e, el);
        },
        pause:function(e, el){
            console.log('pause', e, el);
        }
    };

$(function(){
    var test = new videoPlayer();

    // expose globally
    window.test = test;
});