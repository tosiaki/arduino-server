var createError = require('http-errors');
var express = require('express');
var app = express();

//console.log(process.env.PORT);
app.set('port', process.env.PORT || 3000)
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

var gsrStartTime;
var gsrLatest = [];

var beatsperminute;

var bpmPresent;
var hrvPresent;
var gsrPresent;

io.on('connection', function(socket){
	var socketId = socket.id;
	var clientIp = socket.request.connection.remoteAddress;
	console.log('New connection from ' + clientIp);
	socket.on('arduino-data', function(data) {
		dataValues=data.split(',');
		//console.log(dataValues[2]);

		bpmPresent=0;
		pulseMonitor=dataValues[0];
		if(pulseMonitor) {
			latestData.push({time: Date.now(),value: Number(pulseMonitor)});
		}
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
		heartRateSensorData=latestData.map(latestData => latestData.value);
		minLatest=Math.min.apply(null,heartRateSensorData);
		maxLatest=Math.max.apply(null,heartRateSensorData);
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
				if(beatsperminute>=25) {
					bpmPresent=1;
				}
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
		if(values.length) {
			average = values.reduce(function(acc, val) { return acc + val; })/values.length;
			standardDeviation = Math.sqrt(values.map(function(value) {
				return (value - average) * (value - average)
			}).reduce(function(acc, val) { return acc + val; })/(values.length-1));
		}
		else {
			average=0;
			standardDeviation=0;
		}

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
						//console.log(rrIntervals);
					}
					previousbeat=Date.now();
					//console.log(heartbeats);
				}
				detectedRise=0;
			}
		}

		// Start GSR data processing
		gsrSensor=dataValues[1];

		if(gsrSensor>600) {
			gsrLatest=[];
			gsrStartTime = Date.now();
			//console.log('Emptying GSR array');
		}
		else {
			gsrLatest.push({time: Date.now(), resistance: gsrSensor});
		}

		if(gsrLatest.length) {
			// Remove values before 2 seconds ago
			for (i = 0; i < gsrLatest.length; i++) {
				if(gsrLatest[i].time < Date.now() - 2000) {
					gsrLatest.splice(i,1);
					i--;
				}
			}

			// Find and test min and max of latest
			gsrLatestData=gsrLatest.map(gsrLatest => gsrLatest.resistance);
			minLatestGSR=Math.min.apply(null,gsrLatestData);
			maxLatestGSR=Math.max.apply(null,gsrLatestData);
			if(maxLatestGSR-minLatestGSR > 60) {
				gsrLatest=[];
				gsrStartTime = Date.now();
			}
		}

		// Set min and max GSR for this round
		if(gsrLatest.length && (Date.now() > gsrStartTime + 4000)) {
			if(isNaN(minGSR)) {
				minGSR=gsrSensor;
				maxGSR=gsrSensor;
			}
			else {
				minGSR=Math.min(minGSR,gsrSensor);
				maxGSR=Math.max(minGSR,gsrSensor);
			}
			//console.log(minGSR + ' , ' + maxGSR);
		}
		else {
			minGSR = NaN;
			maxGSR = NaN;
		}

		//console.log(Date.now() > haveGSR + 30000);

		// Calculate GSR score
		if(maxGSR - minGSR > 10 || ((Date.now() > gsrStartTime + 8000) && (maxGSR - minGSR > 0))) {
			relativeGSRvalue=(gsrSensor-minGSR)/(maxGSR - minGSR);
			gsrPresent=1;
		}
		else {
			relativeGSRvalue=NaN;
			gsrPresent=0;
		}

		//console.log(gsrValues.length);

		//console.log(currentData + ' , ' + beatsperminute + ' , ' + heartRateVariability);
		//console.log(gsrSensor);
		//console.log(relativeGSRvalue);
		//console.log(minGSR);

		// Start calculating total scores
		if(bpmPresent+gsrPresent) {
			totalStressScore=100*((bpmPresent ? Math.max((beatsperminute-60)*10,0) : 0 )+ (gsrPresent ? (1 - relativeGSRvalue)*(maxGSR - minGSR) : 0)*4)/(1000*bpmPresent+(gsrPresent ? (maxGSR - minGSR)*4*gsrPresent : 0));
		}
		else {
			totalStressScore=NaN;
		}
		//console.log((gsrPresent ? 1 - relativeGSRvalue : 0)*(maxGSR - minGSR)*5);
		//console.log(bpmPresent + ' , ' +  beatsperminute + ' , ' + totalStressScore);
		//console.log(100*(bpmPresent*(beatsperminute-25)*10 + gsrPresent*relativeGSRvalue*500));

		io.emit('update-data',{sensor: pulseMonitor, numBeats: heartbeats.length, bpm: beatsperminute, hrv: heartRateVariability, gsr: gsrSensor, minGSR: minGSR, maxGSR: maxGSR, relativeGSR: relativeGSRvalue, stress: totalStressScore});
	})
})


