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
             // console.log(formattedResults);

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

async function performance_percent_request(){
  const title = '% Change in Performance Compared to Last Week';
  let sampleData = 25;
  // sql query here, e.g.
      
  let sql_query = `SELECT ((current_month_count - previous_month_count) / previous_month_count) * 100 AS percentage_increase
    FROM (
        SELECT 
            SUM(CASE WHEN YEAR(complete_date) = YEAR(NOW()) AND MONTH(complete_date) = MONTH(NOW()) THEN 1 ELSE 0 END) AS current_month_count,
            SUM(CASE WHEN YEAR(complete_date) = YEAR(NOW()) - 1 AND MONTH(complete_date) = MONTH(NOW()) - 1 THEN 1 ELSE 0 END) AS previous_month_count
        FROM task_complete
        WHERE 
            (YEAR(complete_date) = YEAR(NOW()) AND MONTH(complete_date) = MONTH(NOW())) OR
            (YEAR(complete_date) = YEAR(NOW()) - 1 AND MONTH(complete_date) = MONTH(NOW()) - 1)
    ) AS counts;`; 
      
  try {
    // query the database
    let queryData = await execute_sql_query(sql_query);
    if (queryData.length > 0){
      sampleData = queryData[0]["percentage_increase"];
    } 
    return {'title': title, 'sampleData': sampleData};
  } catch (error) {
    console.error('Error executing SQL query:', error);
    // Handle the error here
  }
}

async function deadlines_met_request(targetId){
  const title = 'Deadlines Met and Not Met';
  let sql_query_met = `SELECT COUNT(*) AS DeadlinesMet
        FROM task
              INNER JOIN task_complete ON task.id = task_complete.task_id
                    WHERE task_complete.complete_date <= task.deadline AND task.deadline >= DATE_SUB('2024-05-17 13:42:04', INTERVAL 7 DAY);`;
  let sql_query_not_met = `SELECT COUNT(*) AS DeadlinesNotMet
        FROM task
              LEFT JOIN task_complete ON task.id = task_complete.task_id
                    WHERE (task_complete.complete_date > task.deadline OR task_complete.complete_date IS NULL) AND task.deadline >= DATE_SUB('2024-05-17 13:42:04', INTERVAL 7 DAY);`;
  let deadlinesMet = 0;
  let deadlinesNotMet = 0;
  try {
    // query the database
    let queryDataMet = await execute_sql_query(sql_query_met);
    if (queryDataMet.length > 0){
      deadlinesMet = queryDataMet[0]["DeadlinesMet"];
    } 
    let queryDataNotMet = await execute_sql_query(sql_query_not_met);
    if (queryDataNotMet.length > 0){
      deadlinesNotMet = queryDataNotMet[0]["DeadlinesNotMet"];
    } 
    console.log("deadlines_met_request has waited for sql queries and got back this many rows", queryDataMet.length + queryDataNotMet.length);
    return {'title': title, 'sampleData': [['Deadlines Met', deadlinesMet], ['Deadlines Not Met', deadlinesNotMet]]};
  } catch (error) {
    console.error('Error executing SQL queries:', error);
    // Handle the error here
  }
}


async function top_employees_request(){
  const title = 'Top Employees';
  let sql_query = `SELECT assigned_user_id, SUM(weight) AS total_weight
        FROM task_complete
              JOIN task ON task_complete.task_id = task.id
                    WHERE complete_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)
                          GROUP BY assigned_user_id
                                ORDER BY total_weight DESC
                                      LIMIT 3;`;
  let sampleData = [];
  try {
    // query the database
    let queryData = await execute_sql_query(sql_query);
    if (queryData.length > 0){
      sampleData = queryData.map(row => ['User ' + row["assigned_user_id"], row["total_weight"]]);
    } 
    console.log("top_employees_request has waited for sql query and got back this many rows", queryData.length);
    return {'title': title, 'sampleData': sampleData};
  } catch (error) {
    console.error('Error executing SQL query:', error);
    // Handle the error here
  }
}


async function weekly_completion_request(){
  const title = 'Weekly Completion';
  let sql_query = `SELECT
    label.week_label,
    COALESCE(SUM(t.weight), 0) AS total_weight_completed
FROM
    (
        SELECT '5 weeks ago' AS week_label
        UNION ALL SELECT '4 weeks ago'
        UNION ALL SELECT '3 weeks ago'
        UNION ALL SELECT '2 weeks ago'
        UNION ALL SELECT 'last week'
    ) AS label
LEFT JOIN
    task_complete tc ON label.week_label = 
    CASE 
        WHEN YEARWEEK(tc.complete_date) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 5 WEEK)) THEN '5 weeks ago'
        WHEN YEARWEEK(tc.complete_date) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 4 WEEK)) THEN '4 weeks ago'
        WHEN YEARWEEK(tc.complete_date) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 3 WEEK)) THEN '3 weeks ago'
        WHEN YEARWEEK(tc.complete_date) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 2 WEEK)) THEN '2 weeks ago'
        WHEN YEARWEEK(tc.complete_date) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK)) THEN 'last week'
    END
LEFT JOIN
    task t ON tc.task_id = t.id
GROUP BY
    label.week_label
ORDER BY
    FIELD(label.week_label, '5 weeks ago', '4 weeks ago', '3 weeks ago', '2 weeks ago', 'last week');`;
  let sampleData = [];
  try {
    // query the database
    let queryData = await execute_sql_query(sql_query);
    if (queryData.length > 0){
      sampleData = queryData.map(row => [row["week_label"], row["total_weight_completed"]]);
    } 
    console.log("weekly_completion_request has waited for sql query and got back this many rows", queryData.length);
    return {'title': title, 'sampleData': sampleData};
  } catch (error) {
    console.error('Error executing SQL query:', error);
    // Handle the error here
  }
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
