$(function () {
	var socket = io('/');
	socket.on('update-data', function(data) {
		console.log(data);
	});
})