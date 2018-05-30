var createError = require('http-errors');
var express = require('express');
var app = express();

//console.log(process.env.PORT);
app.set('port', process.env.PORT || 3000)
console.log(app.get('port'));
var server = app.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
}); //require('http').createServer(app);
var io = require('socket.io')(server);

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/bower",express.static(path.join(__dirname, 'bower_components')));

//server.listen(app.get('port'), function() {
//})

var currentdata;

var indexRouter = require('./app_server/routes/index');
var usersRouter = require('./app_server/routes/users');

// view engine setup

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('arduino-data', function(data) {
		currentdata=data
		//console.log(currentdata);
		io.emit('update-data',currentdata)
	})
})


