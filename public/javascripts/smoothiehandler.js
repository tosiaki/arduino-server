var sensordata = new TimeSeries();
var beatsperminute = new TimeSeries();
var heartratevariability = new TimeSeries();
var galvanicskinresponse = new TimeSeries();

var socket = io('/')
socket.on('update-data', function(data) {
	sensordata.append(new Date().getTime(),data.sensor);
	beatsperminute.append(new Date().getTime(),data.bpm);
	heartratevariability.append(new Date().getTime(),data.hrv);
	galvanicskinresponse.append(new Date().getTime(),data.gsr);
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
		document.getElementById("bpmindicator").innerHTML = 'No BPM signal.';
		document.getElementById("stresslevel").innerHTML = '';
		document.getElementById("disconnection").innerHTML = 'Device disconnected';
		document.getElementById("green").style['background-color']='#bbb';
		document.getElementById("yellow").style['background-color']='#bbb';
		document.getElementById("red").style['background-color']='#bbb';
	}
	if(data.hrv) {
		document.getElementById("hrvindicator").innerHTML = 'Your current heart rate variability is ' + Math.round(data.hrv) + ' beats per minute.';
	}
	else {
		document.getElementById("hrvindicator").innerHTML = 'No HRV signal.';
	}

	if(data.gsr) {
		document.getElementById("gsrindicator").innerHTML = 'Your galvanic skin response is ' + Math.round(data.gsr);
	}
	else {
		document.getElementById("gsrindicator").innerHTML = 'No GSR signal.';
	}

	galvanicskinresponse
	//console.log(data);
});

function createTimeline() {
	var sensorchart = new SmoothieChart({responsive: true});
	sensorchart.addTimeSeries(sensordata, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	sensorchart.streamTo(document.getElementById("sensorsignal"), 500);

	var bpmchart = new SmoothieChart({responsive: true});
	bpmchart.addTimeSeries(beatsperminute, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	bpmchart.streamTo(document.getElementById("bpm"), 500);

	var hrvchart = new SmoothieChart({responsive: true});
	hrvchart.addTimeSeries(heartratevariability, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	hrvchart.streamTo(document.getElementById("hrv"), 500);

	var gsrchart = new SmoothieChart({responsive: true});
	gsrchart.addTimeSeries(galvanicskinresponse, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	gsrchart.streamTo(document.getElementById("gsr"), 500);
}