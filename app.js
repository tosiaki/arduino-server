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
var dataValues;
var minLatest;
var maxLatest;
var average;
var standardDeviation;
var detectedRise=0;
var riseTime;
var heartbeats = [];
var rrIntervals = [];
var averageInterval;
var heartRateVariability;
var previousbeat;

var beatsperminute;

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('arduino-data', function(data) {
		dataValues=data.split(',');
		pulseMonitor=dataValues[0];
		if(pulseMonitor) {
			latestData.push({time: Date.now(),value: Number(pulseMonitor)});
		}
		gsrSensor=dataValues[1];
		var i;
		for (i = 0; i < latestData.length; i++) {
			if (typeof(latestData[i]) == 'undefined') {
				console.log(pulseMonitor)
			}
			else if (latestData[i].value > 1000) {
				console.log(latestData[i].value)
			}
			if (latestData[i].time < Date.now()-4000) {
				latestData.splice(i,1);
				i--;
			}
		}
		dataValues=latestData.map(latestData => latestData.value);
		minLatest=Math.min.apply(null,dataValues);
		maxLatest=Math.max.apply(null,dataValues);
		//console.log(minLatest + ' , ' + maxLatest)

		for (i = 0; i < heartbeats.length; i++) {
			if(heartbeats[i].time < Date.now() - 6000) {
				heartbeats.splice(i,1);
				i--;
			}
		}
		while(heartbeats.length>5) {
			heartBeatTimes=heartbeats.map(heartbeats => heartbeats.time);
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

		for (i = 0; i < rrIntervals.length; i++) {
			if(rrIntervals[i].time < Date.now() - 20000) {
				rrIntervals.splice(i,1);
				i--;
			}
		}
		if(rrIntervals.length>8) {
			intervals=rrIntervals.map(rrIntervals => rrIntervals.interval);
			//console.log(rrIntervals);
			averageInterval=intervals.reduce(function(acc, val) { return acc + val; })/intervals.length;
			heartRateVariability=Math.sqrt(intervals.map(function(interval) {
			return (interval - averageInterval) * (interval - averageInterval);
		}).reduce(function(acc, val) { return acc + val; })/(intervals.length));
		}
		else {
			heartRateVariability=0;
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
			if(pulseMonitor > 0.30*minLatest + 0.70*maxLatest && standardDeviation > deviationThreshold) {
				detectedRise=1;
				riseTime=Date.now();
			}
		}
		else {
			if(pulseMonitor < 0.50*minLatest + 0.50*maxLatest) {
				if(Date.now() < riseTime + 500) {
					var intervalTime = Date.now()-previousbeat;
					if (intervalTime > 1500) {
						intervalTime = NaN;
					}
					heartbeats.push({time: Date.now(), interval: intervalTime});
					if(!isNaN(intervalTime)) {
						rrIntervals.push({time: Date.now(), interval: intervalTime});
						console.log(rrIntervals);
					}
					previousbeat=Date.now();
					//console.log(heartbeats);
				}
				detectedRise=0;
			}
		}

		//console.log(currentData + ' , ' + beatsperminute + ' , ' + heartRateVariability);
		//console.log(gsrSensor);
		io.emit('update-data',{sensor: pulseMonitor, bpm: beatsperminute, hrv: heartRateVariability, gsr: gsrSensor})
	})
})


