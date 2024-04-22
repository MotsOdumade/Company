const mysql = require('mysql');
require('dotenv').config();

// Create a connection to the database using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

const dataChartDict = {
      'performance-graph': 'line',
      'performance-percent': 'stat',
      'deadlines-met': 'progress bar',
      'top-employees': 'stacked bar',
      'top teams': 'stacked bar'
};




function valid_request(data_requested, client_token, user_id){
      // check if the request is missing necessary information
  if (Object.keys(dataChartDict).includes(data_requested) === false){
        return false;
  }
  if (client_token == ''){
        return false;
  }
  if (user_id == ''){
        return false;
  }
  
  if (isNaN(user_id)){
        // it's not a number
        return false;
  }
  return true;
}



function authorised(client_token, user_id) {
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
        // authorised if client_token matches a user_id stored in the database
        console.log('Connected to the database');
        let sql_query = "SELECT * FROM TokenTable;";
        connection.query(sql_query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                connection.end(); // Close the connection if there's an error
                return false; 
            }
            console.log('Query results:', results);
            // Check if the query returned any rows
            if (results.length > 0) {
                // Access specific data within the response
                results.forEach(row => {
                    console.log('Token ID:', row.tokenID);
                    console.log('Employee ID:', row.employeeID);
                    console.log('Time Generated:', row.timeGenerated);
                    // Access other fields as needed
                });
            } else {
                console.log('Query returned no rows.');
            }

            // Close the connection when done
            connection.end();
          // ---- ALWAYS RETURNS TRUE!
            return true; // return inside the query callback
        });
    });
   
  
}



function data_to_chart(data_requested){
  
  // -- matches dataRequest to a chart type
  const chart = dataChartDict[data_requested];
  return chart;
}

// ---- functions to execute requests

function task_status_request(dataAbout, targetId, when){
  const title = 'Status of Current Tasks';
  let sampleData = [];
  // query the database
  
  sampleData = [
    ['Complete', 3],
    ['In Progress', 1],
    ['Not Started', 2]
  ];
  
  return {'title': title, 'sampleData': sampleData};
}


function num_projects_request(dataAbout, targetId, when){
  const title = 'Number of Current Projects';
  let sampleData = 0;
  // query the database
  
  sampleData = 4;
  return {'title': title, 'sampleData': sampleData};
}

function deadlines_met_request(dataAbout, targetId, when){
  const title = 'Number of Deadlines Met';
  let sampleData = [
    ['Deadlines Met', 5],
    ['Total Tasks', 6]
  ];
  // could instead use a json format depending on output required for frontend
  return {'title': title, 'sampleData': sampleData};
}

function weekly_completion_request(dataAbout, targetId, when){
  const title = 'Weighted Task Completion this Week';
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


module.exports = {valid_request, authorised, data_to_chart, task_status_request, num_projects_request, deadlines_met_request, weekly_completion_request};
