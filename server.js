//server.js

var express  = require('express');
var app      = express();
var port     = 8888;
var path = require('path');

//var passport = require('passport');
//var session = require('express-session');

//require('./passport')(passport); 

//var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
//var cookieParser = require('cookie-parser'); 

//app.use(cookieParser()); // read cookies (needed for auth)
//app.use(bodyParser()); // get information from html forms

//app.use(session({ secret: 'vidyapathaisalwaysrunning' } )); // session secret
//app.use(passport.initialize());
//app.use(passport.session()); // persistent login sessions

app.use(express.static(path.join(__dirname, '/public')));

require('./routes/index.js'); // load our routes
//require('./routes/public.js')(app);

app.listen(port, '127.0.0.1');
console.log('The magic happens on port ' + port);
