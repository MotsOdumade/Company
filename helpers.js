const mysql = require('mysql');
require('dotenv').config();

const dataChartDict = {
      'performance-graph': 'line',
      'performance-percent': 'stat',
      'deadlines-met': 'progress bar',
      'top-employees': 'stacked bar',
      'weekly-completion': 'line'
};

function execute_sql_query(sql_query) {
    return new Promise((resolve, reject) => {
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
                reject(err);
                return;
            }
            // Execute a query
            console.log('Connected to the database');
            connection.query(sql_query, (err, results) => {
                // Close the connection
                connection.end();
                if (err) {
                    console.error('Error executing query:', err);
                    reject(err);
                    return;
                }
                // Map each row to a plain JavaScript object
                const formattedResults = results.map(row => {
                    const formattedRow = {};
                    for (const key in row) {
                        formattedRow[key] = row[key];
                    }
                    return formattedRow;
                });
                // Resolve the promise with the formatted results
                resolve(formattedResults);
            });
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

async function performance_percent_request() {
    const title = '% Change in Performance Compared to Last Week';
    let sampleData = 25;

    let sql_query = `SELECT 
            CASE 
                WHEN previous_month_count = 0 THEN NULL -- Handle division by zero
                ELSE ((current_month_count - previous_month_count) / previous_month_count) * 100
            END AS percentage_increase
        FROM (
            SELECT 
                SUM(CASE WHEN YEAR(complete_date) = YEAR(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s')) AND MONTH(complete_date) = MONTH(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s')) THEN 1 ELSE 0 END) AS current_month_count,
                SUM(CASE WHEN YEAR(complete_date) = YEAR(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') - INTERVAL 1 MONTH) AND MONTH(complete_date) = MONTH(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') - INTERVAL 1 MONTH) THEN 1 ELSE 0 END) AS previous_month_count
            FROM task_complete
            WHERE 
                (YEAR(complete_date) = YEAR(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s')) AND MONTH(complete_date) = MONTH(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s'))) OR
                (YEAR(complete_date) = YEAR(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') - INTERVAL 1 MONTH) AND MONTH(complete_date) = MONTH(STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') - INTERVAL 1 MONTH))
        ) AS counts;`;   
    console.log("company analytics sql query: ", sql_query );

    try {
        // query the database
        let queryData = await execute_sql_query(sql_query);
        console.log("Query data:", queryData); // Log the query data
        if (queryData && queryData.length > 0) {
            sampleData = queryData[0]["percentage_increase"];
        } 
        console.log("Sample data:", sampleData); // Log the updated sampleData value
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
  let sql_query = `SELECT u.first_name, t.assigned_user_id, SUM(t.weight) AS total_weight
        FROM task_complete tc JOIN task t 
        ON tc.task_id = t.id JOIN user u 
        ON t.assigned_user_id = u.id 
        WHERE tc.complete_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH) 
        GROUP BY t.assigned_user_id, u.first_name 
        ORDER BY total_weight DESC LIMIT 3;`;


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
  try {
    // query the database
    
    let queryData = await execute_sql_query(sql_query);
    company_data["labels"] = [];
    let query2 = ``;
    for (let i = 0; i < queryData.length; i++){
      company_data["labels"].push(queryData[i]["first_name"]);
      // completed tasks for that user in the past month
          if (i == 0){
                query2 += `SELECT COUNT(*) as num_tasks  FROM task   LEFT JOIN task_start ON task.id = task_start.task_id   WHERE task_start.task_id IS NULL AND  deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND assigned_user_id = ${queryData[i]["assigned_user_id"]}`;
     
          } else {
                query2 += ` UNION ALL SELECT COUNT(*) as num_tasks  FROM task   LEFT JOIN task_start ON task.id = task_start.task_id   WHERE task_start.task_id IS NULL AND  deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND assigned_user_id = ${queryData[i]["assigned_user_id"]}`;
     
          }
     // in progress tasks for that user
     query2 += ` UNION ALL SELECT COUNT(*) as num_tasks  FROM task   INNER JOIN task_start ON task.id = task_start.task_id   LEFT JOIN task_complete ON task.id = task_complete.task_id   WHERE task_complete.task_id IS NULL AND deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND assigned_user_id = ${queryData[i]["assigned_user_id"]}`;
     // completed tasks
     query2 += ` UNION ALL SELECT COUNT(*) AS num_tasks  FROM task   INNER JOIN task_complete ON task.id = task_complete.task_id   WHERE deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND assigned_user_id = ${queryData[i]["assigned_user_id"]}`;
    }
    query2 += ";";
    
    try {
          queryData2 = await execute_sql_query(query2);
          company_data["datasets"][0]["data"] = [];
          company_data["datasets"][1]["data"] = [];
          company_data["datasets"][2]["data"] = [];
          for (let j = 0; j < queryData2.length; j ++){
                if (j % 3 == 0){
                      // complete info
                      company_data["datasets"][0]["data"].push(queryData2[j]["num_tasks"]);
                }
                if (j % 3 == 1){
                      // in progress info
                      company_data["datasets"][1]["data"].push(queryData2[j]["num_tasks"]);
                }
                if (j % 3 == 2){
                      // not started info
                      company_data["datasets"][2]["data"].push(queryData2[j]["num_tasks"]);
                }
          }
    } catch (error){console.error('Error executing SQL query:', error);}
    return {'title': title, 'sampleData': configure};
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
  try {
    // query the database
    let queryData = await execute_sql_query(sql_query);
    if (queryData.length > 0){
      data["datasets"][0]["data"] = [];
    } 
    for (let i = 0; i < queryData.length; i++){
      data["datasets"][0]["data"].push(queryData[i]["total_weight_completed"]);
    }
    console.log("weekly_completion_request has waited for sql query and got back this many rows", queryData.length);
    return {'title': title, 'sampleData': config};
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
      weekly_completion_request
};
