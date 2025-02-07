let chart; // Declare chart globally
let labels;
let values;
let lastReadingTime;
let numberOfDataPoints;

function updateTime() {
    const latestValueElement = document.getElementById('latestValue'); // Reference to the latest value div
    const latestTimeElement = document.getElementById('latestTime'); // Reference to the latest value div

    if (labels)
    {

     lastReadingTime = new Date(labels[labels.length - 1]);
    }
    else
    {
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


    const timeSinceLastReading = `${minutes % 60} minute${minutes % 60 !== 1 ? 's ' : ''} ${seconds % 60} second${seconds % 60 !== 1 ? 's ' : ''}`;

    const latestValue = String(values[values.length - 1]);
    // Update the latest value display with the time difference
    latestValueElement.innerHTML = `
        ${latestValue}
    `;
    latestTimeElement.innerHTML = `
        ${timeSinceLastReading} ago
    `;

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
        labels = data.map(item => new Date(item._datetime).toLocaleString());
        values = data.map(item => item._value);

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = values;
            chart.update();
        }
        return
    }
    catch
    {
        console.log('Unable to fetch data');
        return
    }
}

function createChart(){
    try{

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
                    tension: 0.1
                }]
            },
            options: {
                animate: false,
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMin: 50,
                        suggestedMax: 200
                    },
                    x: {
                        grid: {
                            drawOnChartArea: false, // Hide grid lines for the top axis
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 45,
                            callback: function(value, index) {
                                const date = new Date(labels[index]);
                                const hours = date.getHours();
                                const minutes = date.getMinutes();
                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                const formattedHours = hours % 12 || 12;
                                const formattedMinutes = String(minutes).padStart(2, '0');
                                return `${formattedHours}:${formattedMinutes} ${ampm}`;
                            }
                        }
                    },
                    // Second X-axis (Day)
                    x2: {
                        position: 'top',
                        type: 'category',
                        grid: {
                            drawOnChartArea: false, // Hide grid lines for the top axis
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function(value, index, values) {
                                const date = new Date(labels[index]); // Reference to the original labels
                                const month = date.toLocaleString('default', { month: 'short' });
                                const day = date.getDate();
                                const isMidnight = date.getHours() === 0;

                                // Show day label only at midnight
                                if (isMidnight) {
                                    const fdate = `${month} ${day}`;
                                    return fdate;
                                }
                                return ''; // Hide ticks for non-midnight hours
                            }
                        }
                    }
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
                            },
                            pinch: {
                                enabled: true, // Enable pinch to zoom (for touch devices)
                            }
                        }
                    }
                }

            }
            
        });



        // Button event listeners to change the number of data points shown
        document.getElementById('show1hr').addEventListener('click', function() {
            updateChartData(12);
        });
        document.getElementById('show6hr').addEventListener('click', function() {
            updateChartData(72);
        });
        document.getElementById('show12hr').addEventListener('click', function() {
            updateChartData(144);
        });
        document.getElementById('show24hr').addEventListener('click', function() {
            updateChartData(288);
        });
        document.getElementById('showAll').addEventListener('click', function() {
            updateChartData(0);
        });



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


        // Function to update the chart with a new subset of data
        function updateChartData(numDataPoints) {
            // const newLabels = labels.slice(-numDataPoints);
            // const newValues = values.slice(-numDataPoints);

            numberOfDataPoints = numDataPoints;

            fetchData();
            chart.resetZoom();
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
    }, 1000)

};
