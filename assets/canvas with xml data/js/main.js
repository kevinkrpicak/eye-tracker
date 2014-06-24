/*
 * Practicing some HTML5 CANVAS!
 */

var percentToPixel = function(percent, scale){
    return percent * scale;
};

var canvasTest = function(){
    this.init();
};

    canvasTest.prototype = {

        init:function(){
            this.bindEvents();

            this.filterBadFixations();
            this.setup();
        },
        bindEvents:function(){
            var self = this;

            $('#stop').on('click', function(e){
                clearInterval(self.interval);
            });

            $('#play').on('click', function(e){
                self.animate();
            });

            $('#circle').on('click', function(e){
                self.shape = 'Circle';
                self.draw(self.xPos, self.yPos, self.shape);
            });

            $('#crosshair').on('click', function(e){
                self.shape = 'Crosshair';
                self.draw(self.xPos, self.yPos, self.shape);
            });
            $('#path').on('click', function(e){
                self.shape = 'Path';
                this.clear(self.ctx);
                self.draw(self.xPos, self.yPos, self.shape);
            });

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
        scale:      0.3,
        shape:      'Circle',
        style:      "rgba(255, 0, 0, .2)",

        filteredList:null,
        filterBadFixations:function(){
            var rec = json.DATA.REC;
            var filtered = rec.filter(function(element, index, array){
                return !!parseInt(element.$.FPOGV, 10);
            });

            this.filteredList = filtered;
        },
        setup:function(){
            var canvas = document.getElementById('canvas');
            this.ctx = canvas.getContext("2d");

            // set canvas size
            var videoRegion = json.DATA.VIDEO_REGION[0].$;
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

        drawCrosshair: function(ctx, x, y, r){
            this.clear(ctx);

            ctx.beginPath();
            r = r*2;
            var o = r/2;

            ctx.moveTo(x, y-o);
            ctx.lineTo(x, y-r);

            ctx.moveTo(x+o, y);
            ctx.lineTo(x+r, y);

            ctx.moveTo(x, y+o);
            ctx.lineTo(x, y+r);

            ctx.moveTo(x-o, y);
            ctx.lineTo(x-r, y);

            ctx.closePath();
            ctx.stroke();
        },

        drawPath: function(ctx, x, y){
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

$(function(){
    var test = new canvasTest();

    // expose globally
    window.test = test;
});