$(function () {
	var socket = io('http://localhost:4200');
	socket.on('update-data', function(data) {
		console.log(data);
	});
})