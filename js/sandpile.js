const L = 30;
var canvas = $('#canvas')[0];
ctx = canvas.getContext('2d');

chart = $.jqplot('chartdiv', [[1, 0]], {
    title: 'Распределение размера лавин',
    grid: {
        background: '#FFFFFF',
    },
    axes: {
        xaxis: {
            label: 'размер лавины',
            ticks: [0.5, 1.0, 10.0, 100.0, 1000.0, 5000.0],
            renderer: $.jqplot.LogAxisRenderer,
        },
        yaxis: {
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
            label: 'количетсво лавин',
            renderer: $.jqplot.LogAxisRenderer,
            tickDistribution: 'even',           
        },
    },
    series: [{
        color: '#5555EE',
        showLine: false,
        markerOptions: {
            size: 5
        }

    }]
});


width = canvas.width;
height = canvas.height;

w = width / L;
h = height / L;

const dx = [-1, 0, 1, 0];
const dy = [0, -1, 0, 1];
const colors = ['rgb(255,255,255)', '#9999EB', '#4D4DDB', '#0000B8', '#B800B8', '#D000B8'];
var cells = [];
avalanche = false;
queue = [];
grains_dropped = 0;
avalanche_cnt = 0;
avalanche_size = 0;
distribution = [];

for (i = 0; i < L; i++) {
    cells.push([]);
    for (j = 0; j < L; j++) {
        cells[i].push(0);
    }
}

function Draw() {
    for (i = 0; i < L; i++) {
        for (j = 0; j < L; j++) {            
            ctx.fillStyle = colors[cells[i][j]];
            ctx.strokeStyle = 'black';
            ctx.fillRect(w * i, h * j, w, h);
            ctx.strokeRect(w * i, h * j, w, h);
        }
    }
}

var timer;
interval = 10;

function Step() {
    if (!avalanche) {
        grains_dropped += 1;
        $('#grains_dropped').html(grains_dropped);
        x = Math.floor(Math.random() * L);
        y = Math.floor(Math.random() * L);
        cells[x][y] += 1;
        queue = [];
        if (cells[x][y] >= 4) {
            queue.push([x, y]);
            avalanche = true;
            avalanche_cnt++;
            avalanche_size = 0;
            $('#avalanche_cnt').html(avalanche_cnt);
        }
    }
    else {
        if (0 == queue.length) {
            avalanche = false;
            var exist = false;
            for (i = 0; i < distribution.length; i++) {
                if (distribution[i] == undefined)
                    continue;

                if (distribution[i][0] == avalanche_size) {
                    distribution[i][1]++;
                    exist = true;
                    break;
                }
            }
            if (!exist) {
                distribution.push([avalanche_size, 1]);
            }
           
            chart.replot({data: [distribution]}); 
            queue = [];
            console.log(distribution);
        }
        else {
            for (q_cur = 0; q_cur < queue.length; q_cur++) {
                avalanche_size++;
                x = queue[q_cur][0];
                y = queue[q_cur][1];
                cells[x][y] -= 4;
                for (k = 0; k < 4; k++) {
                    nx = x + dx[k];
                    ny = y + dy[k];
                    if (nx < 0 || ny < 0 || nx >= L || ny >= L) {
                        continue;
                    }
                    cells[nx][ny] += 1;
                }
            }
            queue = [];
            for (i = 0; i < L; i++) {
                for (j = 0; j < L; j++) {
                    if (cells[i][j] >= 4) {
                        queue.push([i, j]);
                    }
                }
            }
        }
    }
    Draw();
}

$('#slider').change(function() {
    clearInterval(timer);
    interval = 1000 - $('#slider').val();
    timer = setInterval(Step, interval);
});

timer = setInterval(Step, interval);




