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

const MEM = 200;

procs = [[[0, 100]], [[0, 0]], [[0, 0]], [[0, 0]]];

procs_chart = $.jqplot('procsdiv', procs, {
    title: 'Распределение количества песчинок по клеткам',
    grid: {
        background: '#FFFFFF',
    },
    axes: {
        xaxis: {
            label: 'шаг',
            min: 0,
            max: MEM + 50,
            numberTicks: 11,
        },
        yaxis: {
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
            label: '% клеток',
            //min: 0,
            //max: 100,
            numberTicks: 5,
        }
    },
    
    seriesDefaults: {
        showMarker: false,
    },
    series: [
        {color: '#CCCCCC', label: '0',}, 
        {color: '#9999EB', label: '1',}, 
        {color: '#4D4DDB', label: '2',}, 
        {color: '#0000B8', label: '3',}
    ],
    legend: {
        show: true,
    },
    canvasOverlay: {
        show: true,
        objects: [
             {dashedHorizontalLine: {
                name: 'p_3',
                y: 44.61,
                lineWidth: 1,
                color: '#0000D6',
                xmaxOffset: '50px',
                shadow: false,
                dashPattern: [5, 5],
            }},
            {dashedHorizontalLine: {
                name: 'p_2',
                y: 30.63,
                lineWidth: 1,
                color: '#4B4BA9',
                xmaxOffset: '50px',
                shadow: false,
                dashPattern: [5, 5],
            }},
            {dashedHorizontalLine: {
                name: 'p_1',
                y: 17.39,
                lineWidth: 1,
                color: '#7777C9',
                xmaxOffset: '50px',
                shadow: false,
                dashPattern: [5, 5],
            }},
            {dashedHorizontalLine: {
                name: 'p_0',
                y: 7.36,
                lineWidth: 1,
                color: '#777777',
                xmaxOffset: '50px',
                shadow: false,
                dashPattern: [5, 5],
            }},




        ],
    },
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

cnts = [100, 0, 0, 0];
const P = 1.0 / (L * L) * 100.0;

for (i = 0; i < L; i++) {
    cells.push([]);
    for (j = 0; j < L; j++) {
        cells[i].push(0);
    }
}

function Draw(x, y) {
    ctx.fillStyle = colors[cells[x][y]];
    ctx.strokeStyle = 'black';
    ctx.fillRect(w * x, h * y, w, h);
    ctx.strokeRect(w * x, h * y, w, h);

}

function DrawAll() {
    for (i = 0; i < L; i++) {
        for (j = 0; j < L; j++) {            
            Draw(i, j);
        }
    }
}

DrawAll();

var timer;
interval = 10;

function Step() {
    if (!avalanche) {
        grains_dropped += 1;
        $('#grains_dropped').html(grains_dropped);
        x = Math.floor(Math.random() * L);
        y = Math.floor(Math.random() * L);
        cnts[cells[x][y]] -= P;
        cells[x][y] += 1;
        cnts[cells[x][y]] += P;
        Draw(x, y);
        queue = [];
        if (cells[x][y] >= 4) {
            queue.push([x, y]);
            avalanche = true;
            avalanche_cnt++;
            avalanche_size = 0;
            $('#avalanche_cnt').html(avalanche_cnt);
        }
        procs[0].push([grains_dropped, cnts[0]]);
        procs[1].push([grains_dropped, cnts[1]]);
        procs[2].push([grains_dropped, cnts[2]]);
        procs[3].push([grains_dropped, cnts[3]]);
        if (procs[0].length > MEM) {
            procs[0].shift();
            procs[1].shift();
            procs[2].shift();
            procs[3].shift();
        }
        if (grains_dropped % 25 == 0) {
            options =  {
                data: procs,
                axes: {
                    xaxis: {
                        min: Math.max(0, grains_dropped - MEM),
                        max: Math.max(MEM, grains_dropped) + 50,
                    },
                },
            };
            //console.log(options);
            procs_chart.replot(options);
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
        }
        else {
            for (q_cur = 0; q_cur < queue.length; q_cur++) {
                avalanche_size++;
                x = queue[q_cur][0];
                y = queue[q_cur][1];
                cnts[cells[x][y]] -= P;
                cells[x][y] -= 4;
                cnts[cells[x][y]] += P;
                Draw(x, y);
                for (k = 0; k < 4; k++) {
                    nx = x + dx[k];
                    ny = y + dy[k];
                    if (nx < 0 || ny < 0 || nx >= L || ny >= L) {
                        continue;
                    }
                    cnts[cells[nx][ny]] -= P;
                    cells[nx][ny] += 1;
                    cnts[cells[nx][ny]] += P;
                    Draw(nx, ny);
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

}

$('#slider').change(function() {
    clearInterval(timer);
    interval = 1000 - $('#slider').val();
    timer = setInterval(Step, interval);
});

timer = setInterval(Step, interval);




