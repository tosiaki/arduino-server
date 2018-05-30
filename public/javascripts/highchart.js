var socket=io();

Highcharts.setOptions({
    global: {
        useUTC: false
    }
})

Highcharts.stockChart('container', {

    title: {
        text: 'Heart rate signal'
    },

    yAxis: {
        title: {
            text: 'Voltage'
        }
    },

    chart: {
        events: {
            load: function() {
                var series=this.series[0];
                // setInterval(function () {
                //     var x = (new Date()).getTime(), // current time
                //         y = Math.round(Math.random() * 100);
                //     series.addPoint([x, y], true, true);
                // }, 1000);
                socket.on('update-data', function(data) {
                    var x = (new Date()).getTime(); // current time
                    series.addPoint([x,data], true, true);
                    //console.log(data);
                })
            }
        }
    },

    rangeSelector: {
        buttons: [{
            count: 1,
            type: 'minute',
            text: '1M'
        }, {
            count: 5,
            type: 'minute',
            text: '5M'
        }, {
            type: 'all',
            text: 'All'
        }],
        inputEnabled: false,
        selected: 0
    },

    exporting: {
        enabled: false
    },

    series: [{
        name: 'RHeart rate',
        data: (function () {
            // generate an array of random data
            var data = [],
                time = (new Date()).getTime(),
                i;

            for (i = -999; i <= 0; i += 1) {
                data.push([
                    time + i * 1000,
                    Math.round(Math.random() * 100)
                ]);
            }
            return data;
        }())
    }]

});