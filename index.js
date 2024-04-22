// import functions from helpers.js
const {
      valid_request,
      authorised,
      data_to_chart,
      performance_graph_request,
      performance_percent_request,
      deadlines_met_request,
      top_employees_request,
      top_projects_request
} = require('./helpers');

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = express();
// HTTP server
const httpServer = http.createServer(app);
const HTTP_PORT = 3003;


// Define your Express routes here
// ------ handle GET requests to /v1/company-analytics -----------------------

app.get('/v1/company-analytics', (req, res) => {
      
       // clean query parameters
        const dataRequested = (req.query.data || '').trim().replace(/<[^>]*>/g, '');
        const clientToken = (req.query['client-token'] || '').trim().replace(/<[^>]*>/g, '');
        const userId = (req.query['user-id'] || '').trim().replace(/<[^>]*>/g, ''); // id of the user requesting the data (for additional security)
        // const dataAbout = (req.query['data-about'] || '').trim().replace(/<[^>]*>/g, '');
        // const targetId = (req.query['target-id'] || '').trim().replace(/<[^>]*>/g, '');
        // const when = (req.query.when || '').trim().replace(/<[^>]*>/g, '');

      // prepare the response object
      // ensure you're using a uniform interface!
      const responseObj = {
            'cacheable' : false,
            'valid-request': false,
            'authorised' : false,
            'chart-type' : '',
            'suggested-title' : '',
            'description' : 'description of analytics-data',
            'analytics-data' : []
      };


      // check validity (completeness) of request 
      if (valid_request(dataRequested, clientToken, userId) === false){
            // request missing necessary data
            return res.json(responseObj);
      } else {
            // update the response object
            responseObj['valid-request'] = true;
      }

    
      


      // check authorisation
      if (authorised(clientToken, userId) === false){
            // 
            return res.json(responseObj);
      } else {
            responseObj['authorised'] = true;
            // update response object with expected chart type
            const chartType = data_to_chart(dataRequested);
            responseObj['chart-type'] = chartType;
      }
      
      // they're authorised - carry out the request
      switch (dataRequested) {
            case "performance-graph":
                  // a line graph showing the weekly weighted performance (in terms of task completion) across the whole company
                  const performanceGraphObj = performance_graph_request();
                  responseObj['suggested-title'] = performanceGraphObj['title'];
                  responseObj['analytics-data'] = performanceGraphObj['sampleData'];
                  break;
            case "performance-percent":
                  // a stat showing the percentage change in performance compared to last week
                  const performancePercentObj = performance_percent_request();
                  responseObj['suggested-title'] = performancePercentObj['title'];
                  responseObj['analytics-data'] = performancePercentObj['sampleData'];
                  break;
            case "deadlines-met":
                  // a progress bar showing the number of deadlines met in the last 7 days
                  const deadlinesMetObj = deadlines_met_request();
                  responseObj['suggested-title'] = deadlinesMetObj['title'];
                  responseObj['analytics-data'] = deadlinesMetObj['sampleData'];
                  break;
            case "top-employees":
                  // a bar chart showing the task status breakdown for the top 3 employees
                  const topEmployeesObj = top_employees_request();
                  responseObj['suggested-title'] = topEmployeesObj['title'];
                  responseObj['analytics-data'] = topEmployeesObj['sampleData'];
                  break;
            case "top-projects":
                    // a bar chart showing the task status breakdown for the top 3 projects
                    const topTeamsObj = top_teams_request();
                    responseObj['suggested-title'] = topTeamsObj['title'];
                    responseObj['analytics-data'] = topTeamsObj['sampleData'];
                    break;
        
  
        default:
                  // indicates a request option that hasn't yet been implemented
                  // none hopefully
                  console.log('Unknown dataRequested');
                  return res.json(responseObj);
      }
      
        return res.json(responseObj);

});

httpServer.listen(HTTP_PORT, () => {
    console.log(`company-analytics API is running on port ${HTTP_PORT}`);
});
