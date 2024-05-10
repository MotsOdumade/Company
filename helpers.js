const mysql = require('mysql');
require('dotenv').config();

const dataChartDict = {
      'performance-graph': 'line',
      'performance-percent': 'stat',
      'deadlines-met': 'progress bar',
      'top-employees': 'stacked bar',
      'top-projects': 'stacked bar',
      'weekly-completion': 'line'
};

function execute_sql_query(sql_query){
  // Create a connection to the database using environment variables
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    // Connect to the database
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return false; // handle error appropriately
        }
        // Execute a query
        console.log('Connected to the database');
        connection.query(sql_query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                connection.end(); // Close the connection if there's an error
                return false; 
            }
            // access result
              
            // Map each row to a plain JavaScript object
            const formattedResults = results.map(row => {
                  
                const formattedRow = {};
                for (const key in row) {
                  formattedRow[key] = row[key];
                }
                return formattedRow;
              });

            // Log the formatted results
              console.log(formattedResults);

              // Close the connection
              connection.end();
              return formattedResults;
            });
    });
}


function valid_request(data_requested, access_code){
      // check if the request is missing necessary information
  if (Object.keys(dataChartDict).includes(data_requested) === false){
        return false;
  }
  if (access_code == ''){
        return false;
  }
  return true;
}



function authorised(access_code) {
    // verify the access code provided
    if (access_code == process.env.ACCESS_CODE){
      // correct access code for company-analytics code 
      execute_sql_query("SELECT * FROM EmployeeTable;");
      return true;
    } 
    // else incorrect access_code 
    return false;
    
}



function data_to_chart(data_requested){
  
  // -- matches dataRequest to a chart type
  const chart = dataChartDict[data_requested];
  return chart;
}

// ---- functions to execute requests

function performance_graph_request(){
  const title = 'Weekly Performance';
  let sampleData = [
        [new Date(2014, 0, 1),  5.7], // represents jan 1st 2014
        [new Date(2014, 0, 2),  8.7],
        [new Date(2014, 0, 3),   12],
        [new Date(2014, 0, 4), 15.3],
        [new Date(2014, 0, 5), 15.6],
        [new Date(2014, 0, 6), 20.9],
        [new Date(2014, 0, 7), 19.8]
      ];
  return {'title': title, 'sampleData': sampleData}; 
}

function performance_percent_request(){
  const title = '% Change in Performance Compared to Last Week';
  let sampleData = 0;
  // query the database

  sampleData = 30;
  return {'title': title, 'sampleData': sampleData};
}

function deadlines_met_request(){
  // as a progress bar
  const title = 'Number of Deadlines Met';
  let sampleData = [
    ['Deadlines Met', 65],
    ['Total Tasks', 71]
  ];
  // could instead use a json format depending on output required for frontend
  return {'title': title, 'sampleData': sampleData};
}

function top_projects_request(){
  const title = 'Status of Tasks for the Top 3 Performing Projects';
  let sampleData = [];
  // query the database
  
  sampleData = [
    ['Status', 'Project1', 'Project2', 'Project3'],
    ['Complete', 28, 28, 22],
    ['In Progress', 5, 4, 4],
    ['Not Started', 10, 11, 7]
  ];
  
  return {'title': title, 'sampleData': sampleData};
}


function top_employees_request(){
  const title = 'Status of Tasks for the Top 3 Performing Employees';
  let sampleData = [];
  const company_data = {
    labels: ["Employee 1", "Employee 2", "Employee 3"],
    datasets: [{
      label: "Complete",
      data: [85, 70, 43], // Sample complete task weights
      backgroundColor: "green",
      barThickness: 30
    }, {
      label: "In Progress",
      data: [10, 23, 12], // Sample in progress task weights
      backgroundColor: "orange",
      barThickness: 30
    }, {
      label: "Not Started",
      data: [10, 20, 10], // Sample not started task weights
      backgroundColor: "red",
      barThickness: 30
    }]
  };

  // Configuration for the chart
  const configure = {
    type: 'bar',
    data: company_data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Top Three Employees Task Breakdown'
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Employees'
          }
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'Task Weight'
          },
          min: 0
        }
      }
    }
  };
  
  return {'title': title, 'sampleData': configure};
}


function weekly_completion_request(){
      const title = 'Task Weight Completion by Week';
      const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: [{
      label: "Task Weight Completed",
      data: [20, 40, 60, 80, 100], // Sample completion percentages for each week
      borderColor: "blue",
      fill: false
    }]
  };

  // Configuration for the chart
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Task Weight Completion by Week'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Weeks'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Completion Percentage'
          },
          min: 0,
          max: 100,
          ticks: {
            stepSize: 10
          }
        }
      }
    },
  };


      return {'title': title, 'sampleData': config};
}




module.exports = {
      valid_request,
      authorised,
      data_to_chart,
      performance_graph_request,
      performance_percent_request,
      deadlines_met_request,
      top_employees_request,
      top_projects_request, 
      weekly_completion_request
};
