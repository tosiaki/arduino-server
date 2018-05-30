var sensordata = new TimeSeries();
var beatsperminute = new TimeSeries();

var socket = io('/')
socket.on('update-data', function(data) {
	sensordata.append(new Date().getTime(),data.sensor);
	beatsperminute.append(new Date().getTime(),data.bpm);
	if (data.bpm>25 && data.bpm != NaN) {
		document.getElementById("bpmindicator").innerHTML = 'Your current heart rate is ' + Math.round(data.bpm) + ' beats per minute.';
		document.getElementById("disconnection").innerHTML = '';
		if (data.bpm>120) {
			document.getElementById("stresslevel").innerHTML = 'High stress';
			document.getElementById("green").style['background-color']='#bbb';
			document.getElementById("yellow").style['background-color']='#bbb';
			document.getElementById("red").style['background-color']='#fbb';
		}
		else if (data.bpm>90) {
			document.getElementById("stresslevel").innerHTML = 'Medium stress';
			document.getElementById("green").style['background-color']='#bbb';
			document.getElementById("yellow").style['background-color']='#ffb';
			document.getElementById("red").style['background-color']='#bbb';
		}
		else {
			document.getElementById("stresslevel").innerHTML = 'Normal or low stress';
			document.getElementById("green").style['background-color']='#bfb';
			document.getElementById("yellow").style['background-color']='#bbb';
			document.getElementById("red").style['background-color']='#bbb';
		}
	}
	else {
		document.getElementById("bpmindicator").innerHTML = 'The device is disconnected.';
		document.getElementById("stresslevel").innerHTML = '';
		document.getElementById("disconnection").innerHTML = 'Device disconnected';
		document.getElementById("green").style['background-color']='#bbb';
		document.getElementById("yellow").style['background-color']='#bbb';
		document.getElementById("red").style['background-color']='#bbb';
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