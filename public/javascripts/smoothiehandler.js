var sensordata = new TimeSeries();
var beatsperminute = new TimeSeries();

var socket = io('/')
socket.on('update-data', function(data) {
	sensordata.append(new Date().getTime(),data.sensor);
	beatsperminute.append(new Date().getTime(),data.bpm);
	if (data.bpm>25 && data.bpm != NaN) {
		document.getElementById("bpmindicator").innerHTML = 'Your current heart rate is ' + data.bpm + ' beats per minute.';
	}
	else {
		document.getElementById("bpmindicator").innerHTML = 'The device is disconnected.';
	}
	//console.log(data);
});

function createTimeline() {
	var sensorchart = new SmoothieChart({responsive: true});
	sensorchart.addTimeSeries(sensordata, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	sensorchart.streamTo(document.getElementById("sensorsignal"), 500);

	var bpmchart = new SmoothieChart({responsive: true});
	bpmchart.addTimeSeries(beatsperminute, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	bpmchart.streamTo(document.getElementById("bpm"), 500);
}