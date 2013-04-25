
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path')
    , mysql = require('mysql')
    , fs = require('fs')
    , xml2js = require('xml2js')
    , async = require('async');


/**
 * Build app
 */

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/upload/', routes.upload);

// post data to db
app.post('/add/', function(req, res){

    (function(files){

        async.parallel([
            // video
            function(callback){
                var video = files.video;
                fs.readFile(video.path, function (err, data) {
                    if(err) throw err;

                    // store file in new location
                    var newPath = __dirname + "/public/videos/"+video.name;
                    fs.writeFile(newPath, data, function (err) {
                        callback(null, video.name);

                        // res.end('it worked');
                    });
                });
            },
            // xml
            function(callback){
                var xmlFile = files.xml;
                var parseString = require('xml2js').parseString;
                fs.readFile(xmlFile.path, 'ascii', function (err, data) {
                    if (err) throw err;

                    var xml = data;
                    parseString(xml, function (err, result) {
                        callback(null, JSON.stringify(result));
                    });
                });
            }
        ],
        // post to Database
        function(err, results){
            var mysql      = require('mysql');
            var connection = mysql.createConnection({
                host     : 'localhost',
                user     : 'root',
                password : 'root',
                database : 'eye_tracker'
            });

            connection.connect();
            var post = {
                video_name: results[0],
                video_data: results[1],
                date_added: new Date()
            };
            connection.query(
                'INSERT INTO eye_tracker_data SET ?',
                post,
                function(err, result){
                    if(err) throw err;

                    res.writeHeader(200, {"Content-Type": "text/html"});
                    res.end('success');
                }
            );
            connection.end();

        });
    })(req.files);

});

// grab all values from eye tracker table
app.get('/get-all/', function(req, res){
    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : 'eye_tracker'
    });

    connection.connect();
    connection.query(
        'SELECT * FROM eye_tracker_data',
        function(err, rows, fields){
            if(err) throw err;

            var data = [];
            var row;
            for(var i = 0, l = rows.length; i < l; i++){
                row = rows[i];
                var obj = {
                    "id": row.id,
                    "video_name": row.video_name,
                    "video_data": JSON.parse(row.video_data),
                    "date_added": row.date_added
                };

                data.push(obj);
            }

            res.json(data);
        }
    );
    connection.end();
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
