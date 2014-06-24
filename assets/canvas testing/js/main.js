/*
 * Practicing some HTML5 CANVAS!
 */

var canvasTest = function(){
    this.init();
};

    canvasTest.prototype = {

        init:function(){
            this.bindEvents();

            this.setup();
            this.animate();
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

        },
        ctx:        null,
        cWidth:     0,
        cHeight:    0,
        interval:   null,
        xPos:       0,
        yPos:       20,
        xShift:     1.5,
        speed:      30,
        shape:      'Circle',
        style:      "rgba(255, 0, 0, .2)",
        setup:function(){
            var canvas = document.getElementById('canvas');
            this.ctx = canvas.getContext("2d");

            this.cWidth = canvas.width;
            this.cHeight = canvas.height;
        },
        animate:function(){
            var self = this;

            this.interval = setInterval(function(){

                if( self.xPos > self.cWidth ){
                    self.xPos = 0;
                }

                self.draw(self.xPos, self.yPos, self.shape);

                self.xPos+=self.xShift;
            }, this.speed);

        },
        clear: function(ctx){
            //Clear Canvas
            ctx.clearRect(0, 0, this.cWidth, this.cHeight);
        },
        draw:function(x, y, shape){
            var ctx = this.ctx;
            this.clear(ctx);
            this['draw'+shape](ctx, x, y, 5, this.style);
        },

        drawCircle: function(ctx, x, y, r, style){
            // redraw
            ctx.beginPath();

            // arc(x, y, radius, startAngle, endAngle, anticlockwise)
            ctx.arc(x, y, r, 0, Math.PI*2, true); // Outer circle

            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = style;
            ctx.fill();
        },

        drawCrosshair: function(ctx, x, y){
            ctx.beginPath();

            ctx.moveTo(x, y-1);
            ctx.lineTo(x, y-10);

            ctx.moveTo(x+1, y);
            ctx.lineTo(x+10, y);

            ctx.moveTo(x, y+1);
            ctx.lineTo(x, y+10);

            ctx.moveTo(x-1, y);
            ctx.lineTo(x-10, y);

            ctx.closePath();
            ctx.stroke();
        }
    };

$(function(){
    var test = new canvasTest();

    // expose globally
    window.test = test;
});