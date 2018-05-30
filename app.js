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

var deviationThreshold=20;

var currentData;
var latestData = [];
var average;
var standardDeviation;
var detectedRise=0;
var riseTime;
var heartbeats = [];
var previousbeat;

var beatsperminute;

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('arduino-data', function(data) {
		currentData=data
		if(currentData) {
			latestData.push({time: Date.now(),value: Number(currentData)});
		}
		var i;
		for (i = 0; i < latestData.length; i++) {
			if (typeof(latestData[i]) == 'undefined') {
				console.log(currentData)
			}
			else if (latestData[i].value > 1000) {
				console.log(latestData[i].value)
			}
			if (latestData[i].time < Date.now()-4000) {
				latestData.splice(i,1);
				i--;
			}
		}
		for (i = 0; i < heartbeats.length; i++) {
			if(heartbeats[i].time < Date.now() - 6000) {
				heartbeats.splice(i,1);
				i--;
			}
		}
		while(heartbeats.length>5) {
			heartBeatTimes=latestData.map(heartbeats => heartbeats.time);
			i = heartBeatTimes.indexOf(Math.min.apply(null, heartBeatTimes));
			heartbeats.splice(i,1)
		}
		if(heartbeats.length>3) {
			heartBeatIntervals=heartbeats.map(heartbeats => heartbeats.interval);
			for (i = 0; i < heartBeatIntervals.length; i++) {
				if (heartBeatIntervals[i] == NaN) {
					heartBeatIntervals.splice(i,1);
				}
			}
			if(heartBeatIntervals.length>3) {
				beatsperminute=60*1000*heartbeats.length/(heartBeatIntervals.reduce(function(acc, val) { return acc + val; }));
				//console.log(heartBeatIntervals.length);
				//console.log(heartBeatIntervals);
				//console.log(heartBeatIntervals.reduce(function(acc, val) { return acc + val; }));
			}
			else {
				beatsperminute=NaN;
			}
		}
		else {
			beatsperminute=NaN;
		}

		values = latestData.map(latestData => latestData.value);
		//console.log(values.reduce(function(acc, val) { return acc + val; }));
		average = values.reduce(function(acc, val) { return acc + val; })/values.length;
		standardDeviation = Math.sqrt(values.map(function(value) {
			return (value - average) * (value - average)
		}).reduce(function(acc, val) { return acc + val; })/(values.length-1));

		//console.log(typeof(average));
		//console.log(values);
		//console.log(values.length + ' , ' + average + ' , ' + standardDeviation);
		if(detectedRise==0) {
			if(currentData > average + standardDeviation && standardDeviation > deviationThreshold) {
				detectedRise=1;
				riseTime=Date.now();
				//console.log('Rise detected')
			}
		}
		else {
			if(currentData < average + 0.5*standardDeviation) {
				if(Date.now() < riseTime + 500) {
					var intervalTime = Date.now()-previousbeat;
					if (intervalTime > 10000) {
						intervalTime = NaN;
					}
					heartbeats.push({time: Date.now(), interval: intervalTime});
					previousbeat=Date.now();
					//console.log(heartbeats);
				}
				detectedRise=0;
			}
		}

		//console.log(beatsperminute);
		io.emit('update-data',{sensor: currentData, bpm: beatsperminute})
	})
})


