var heartsensordata = new TimeSeries();

var socket = io('/')
socket.on('update-data', function(data) {
	heartsensordata.append(new Date().getTime(),data);
	//console.log(data);
});

function createTimeline() {
	var chart = new SmoothieChart({responsive: true});
	chart.addTimeSeries(heartsensordata, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
	chart.streamTo(document.getElementById("chart"), 500);
}