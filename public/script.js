let chart; // Declare chart globally
let labels;
let values;
let lastReadingTime;
let numberOfDataPoints = 72;

let maxY = 0;
let minY = 0;



function updateTime() {
    const latestValueElement = document.getElementById('latestValue'); // Reference to the latest value div
    const latestTimeElement = document.getElementById('latestTime'); // Reference to the latest value div

    if (labels) {
        lastReadingTime = new Date(labels[labels.length - 1]);
    } else {
        lastReadingTime = new Date();
    }
    // Calculate time since the last reading
    const currentTime = new Date();
    const timeDifference = currentTime - lastReadingTime; // Difference in milliseconds

    // Convert time difference to readable format
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const timeSinceLastReading = `${minutes} minute${minutes % 60 !== 1 ? 's ' : ''} ${seconds % 60} second${seconds % 60 !== 1 ? 's ' : ''}`;
    const latestValue = String(values[values.length - 1]);
    // Update the latest value display with the time difference
    latestValueElement.innerHTML = `${latestValue}`;
    latestTimeElement.innerHTML = `${timeSinceLastReading} ago`;
}

// Function to fetch the data (already provided in your code)
async function fetchData() {
    try {
        // Fetch data from the server API using numberofDataPoints
        const response = await fetch(`/api/data?limit=${numberOfDataPoints}`);

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch data');
        }

        const data = result.data;

        // Validate data
        if (!Array.isArray(data)) {
            throw new Error('Data is not in the expected array format');
        }

        if (data.length === 0) {
            console.log('No data found in the database.');
            return;
        }

        // Prepare labels and values
        labels = data.map(item => new Date(item._datetime));
        values = data.map(item => item._value);

        //loop through labels, if the time between the current label and the previous label is greater than 5 minutes, add a new label in between with a null value
        for (let i = 1; i < labels.length; i++) {
            if (labels[i] - labels[i - 1] > 16 * 60 * 1000) {
                labels.splice(i, 0, new Date(labels[i - 1].getTime() + 5 * 60 * 1000));
                values.splice(i, 0, null);
            }
        }

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = values;
            
            
        

        // switch(true) {
        //     case numberOfDataPoints <= 36:
        //         chart.options.scales.x.time.unit = 'minute';
        //         chart.options.scales.x.time.displayFormats = {
        //             minute: 'mm:ss'
        //         };
                
        //         break;
        //     case numberOfDataPoints <= 72:
        //         chart.options.scales.x.time.unit = 'hour';
        //         break;
        //     case numberOfDataPoints <= 144:
        //         chart.options.scales.x.time.unit = 'hour';
        //         break;
        //     case numberOfDataPoints <= 288:
        //         chart.options.scales.x.time.unit = 'hour';
        //         break;
        //     case numberOfDataPoints <= 10000:
        //         chart.options.scales.x.time.unit = 'day';
        //         break;
        // }
        setZoomLimits();
        chart.update();

        

        // //get chart.data.datasets[0].data with nulls removed
        let tempvalues = chart.data.datasets[0].data.filter(value => value !== null);

        // console.log(tempvalues);
        // console.log(Math.max(...tempvalues));
        
        //get the max y value on the chart rounded up to the nearest 50
        maxY = Math.ceil(Math.max(...tempvalues) / 50) * 50;

        //get the min y value on the chart rounded down to the nearest 50
        minY = Math.floor(Math.min(...tempvalues) / 50) * 50;
    }
    } catch {
        console.log('Unable to fetch data');
        return;
    }
}

// // Function to set the correct time format for the x-axis
// function setXAxisTimeFormat() {

//     //get the # of y values VISIBLE on the chart
    
//     const yvals = chart.scales.y.ticks.length;
//     const startvalue = chart.scales.x.min;
//     console.log(yvals + " yvals");

//     switch(true) {
//         case numberOfDataPoints <= 36:
//             chart.options.scales.x.time.unit = 'minute';
//             chart.options.scales.x.time.displayFormats = {
//                 minute: 'mm:ss'
//             };
            
//             break;
//         case numberOfDataPoints <= 72:
//             chart.options.scales.x.time.unit = 'hour';
//             break;
//         case numberOfDataPoints <= 144:
//             chart.options.scales.x.time.unit = 'hour';
//             break;
//         case numberOfDataPoints <= 288:
//             chart.options.scales.x.time.unit = 'hour';
//             break;
//         case numberOfDataPoints <= 10000:
//             chart.options.scales.x.time.unit = 'day';
//             break;
//     }
// }

function createChart() {
    try {
        const ctx = document.getElementById('dataChart').getContext('2d');

        // Destroy the previous chart instance if it exists
        if (chart) {
            chart.destroy();
        }

        // Create the chart
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Glucose',
                    data: values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4,
                    spanGaps: 1000 * 60 * 16
                }]
            },
            options: {
                animate: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        suggestedMin: 40,
                        suggestedMax: 200
                    },
                    x: {
                        type: 'timeseries',
                        //display in hh:mm AM/PM format
                        time: { 
                            displayFormats: {
                                hour: 'h:mm a',
                                minute: 'h:mm'
                            }
                        },
                        ticks: {
                            //rotation 0 degrees
                            maxRotation: 0,
                            minRotation: 0
                        }
                    },
                    // //days at the top of the chart
                    // x2: { 
                    //     type: 'timeseries',
                    //     display: true,
                    //     position: 'top',
                    //     time: {
                    //         unit: 'day'
                    //     },
                    // }
                },

                plugins: {
                    legend: {
                        display: false // This line hides the legend
                    },
                    tooltip: {
                        intersect: false,
                        mode: 'index',
                        position: 'nearest'
                    },
                    annotation: {
                        annotations: {
                            line70: {
                                type: 'line',
                                yMin: 70,
                                yMax: 70,
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 2,
                            },
                            line180: {
                                type: 'line',
                                yMin: 180,
                                yMax: 180,
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 2,
                            }
                        }
                    },
                    zoom: { // Enable zoom and pan
                        pan: {
                            enabled: true, // Allow panning
                            mode: 'xy' // Allow panning in both directions (x and y)
                        },
                        zoom: {
                            wheel: {
                                enabled: true, // Enable wheel zooming
                                speed: 0.1, // Zoom speed with mouse wheel
                                sensitivity: 3 // Zoom sensitivity (higher value = faster zoom)
                            }
                        }
                    }
                }
            }
        });

        setZoomLimits();

        // Button event listeners to change the number of data points shown
        const buttons = {
            show3hr: 36,
            show6hr: 72,
            show12hr: 144,
            show24hr: 288,
            showAll: 10000
        };

        for (const [id, dataPoints] of Object.entries(buttons)) {
            document.getElementById(id).addEventListener('click', function() {
                updateChartData(dataPoints);
            });
        }

        // Double-click event listener to reset zoom/pan
        const chartCanvas = document.getElementById('dataChart');
        chartCanvas.addEventListener('dblclick', function() {
            if (chart) {
                chart.resetZoom();
            }
        });

    } catch (error) {
        console.error('Error:', error);
        dataLog.innerHTML = `<span class="error">Error: ${error.message}</span>`;
    }
}

// Function to set the zoom limits of the chart
function setZoomLimits() {
    chart.options.plugins.zoom.limits = {
            x: {
              min: labels[0],  // Prevent zooming out beyond the first label
              max: labels[labels.length - 1], // Prevent zooming out beyond the last label
            },
        y: { min: minY, max: maxY }
    };
}

// Function to update the chart with a new subset of data
function updateChartData(numDataPoints) {
    numberOfDataPoints = numDataPoints;

    fetchData();
    chart.resetZoom();
    // switch(true) {
    //     case numberOfDataPoints <= 36:
    //         chart.options.scales.x.time.unit = 'minute';
    //         chart.options.scales.x.time.displayFormats = {
    //             minute: 'mm:ss'
    //         };
            
    //         break;
    //     case numberOfDataPoints <= 72:
    //         chart.options.scales.x.time.unit = 'hour';
    //         break;
    //     case numberOfDataPoints <= 144:
    //         chart.options.scales.x.time.unit = 'hour';
    //         break;
    //     case numberOfDataPoints <= 288:
    //         chart.options.scales.x.time.unit = 'hour';
    //         break;
    //     case numberOfDataPoints <= 10000:
    //         chart.options.scales.x.time.unit = 'day';
    //         break;
    // }
}

// Start updating the time and fetching data every 5 seconds
window.onload = async function() {
    await fetchData(); // Initial data fetch on load
    createChart();
    updateTime();
    await setInterval(() => {
        fetchData(); // Fetch new data and update time
    }, 5000); // Update every 5 seconds
    setInterval(() => {
        updateTime();
    }, 1000);

    let t = document.getElementById("dark_mode_btn")
          , d = document.getElementById("light_mode_btn");
        localStorage.theme === "dark" || !("theme"in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches ? d.classList.remove("hidden") : t.classList.remove("hidden"),
        t.addEventListener("click", function() {
            document.documentElement.setAttribute("data-theme", "dark"),
            localStorage.theme = "dark",
            t.classList.add("hidden"),
            d.classList.remove("hidden")
            console.log("dark mode");
        }),
        d.addEventListener("click", function() {
            document.documentElement.setAttribute("data-theme", "light"),
            localStorage.theme = "light",
            d.classList.add("hidden"),
            t.classList.remove("hidden")
            console.log("light mode");
        });
};

// Resize the chart when the window is resized
window.onresize = function() {
    if (chart) {
        chart.resize();
    }
}
