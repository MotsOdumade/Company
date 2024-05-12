// import functions from helpers.js
const {
      valid_request,
      authorised,
      data_to_chart,
      performance_graph_request,
      performance_percent_request,
      deadlines_met_request,
      top_employees_request,
      top_projects_request,
      weekly_completion_request
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

app.get('/v1.1/data-analytics/company-analytics', (req, res) => {
      
       // clean query parameters
        const dataRequested = (req.query.data || '').trim().replace(/<[^>]*>/g, '');
        const accessCode = (req.query['access-code'] || '').trim().replace(/<[^>]*>/g, '');
        // const when = (req.query.when || '').trim().replace(/<[^>]*>/g, '');

      // prepare the response object
      // ensure you're using a uniform interface!
      const responseObj = {
            'cacheable' : false,
            'valid-request': false,
            'authorised' : false,
            'display-as' : '',
            'suggested-title' : '',
            'description' : 'description of analytics-data',
            'analytics-data' : []
      };


      // check validity (completeness) of request 
      if (valid_request(dataRequested, accessCode) === false){
            // request missing necessary data
            return res.json(responseObj);
      } else {
            // update the response object
            responseObj['valid-request'] = true;
      }

    
      


      // check authorisation
      if (authorised(accessCode) === false){
            // unauthorised - the access-code given was wrong
            return res.json(responseObj);
      } else {
            responseObj['authorised'] = true;
            // update response object with expected chart type
            const displayType = data_to_chart(dataRequested);
            responseObj['display-as'] = displayType;
      }
      
      // they're authorised - carry out the request
      switch (dataRequested) {
            case "performance-graph":
                  // a line graph showing the weekly weighted performance (in terms of task completion) across the whole company
                  const performanceGraphObj = performance_graph_request();
                  responseObj['suggested-title'] = performanceGraphObj['title'];
                  responseObj['analytics-data'] = performanceGraphObj['sampleData'];
                   return res.json(responseObj);
                  break;
            case "performance-percent":
                  // a stat showing the percentage change in performance compared to last week
                  performance_percent_request()
                      .then(performancePercentObj => {
                          responseObj['suggested-title'] = performancePercentObj['title'];
                          responseObj['analytics-data'] = performancePercentObj['sampleData'];
                          res.json(responseObj);
                      })
                      .catch(error => {
                          console.error('Error fetching performance percentage:', error);
                          // Handle the error here
                          res.status(500).json({ error: 'Internal server error' });
                      });
                  break;
            case "deadlines-met":
                  // a progress bar showing the number of deadlines met in the last 7 days
                  const deadlinesMetObj = deadlines_met_request();
                  responseObj['suggested-title'] = deadlinesMetObj['title'];
                  responseObj['analytics-data'] = deadlinesMetObj['sampleData'];
                  return res.json(responseObj);
                  break;
            case "top-employees":
                  // a bar chart showing the task status breakdown for the top 3 employees
                  const topEmployeesObj = top_employees_request();
                  top_employees_request()
                      .then(topEmployeesObj => {
                          responseObj['suggested-title'] = topEmployeesObj['title'];
                          responseObj['analytics-data'] = topEmployeesObj['sampleData'];
                          res.json(responseObj);
                      })
                      .catch(error => {
                          console.error('Error fetching top employees:', error);
                          // Handle the error here
                          res.status(500).json({ error: 'Internal server error' });
                      });
                  break;
            case "top-projects":
                    // a bar chart showing the task status breakdown for the top 3 projects
                    const topTeamsObj = top_projects_request();
                    responseObj['suggested-title'] = topTeamsObj['title'];
                    responseObj['analytics-data'] = topTeamsObj['sampleData'];
                    return res.json(responseObj);
                    break;
            case "weekly-completion":
                    // a line chart showing the weekly task completion across the whole company for the past 5 weeks
                    weekly_completion_request()
                      .then(weeklyCompletionObj => {
                          responseObj['suggested-title'] = weeklyCompletionObj['title'];
                          responseObj['analytics-data'] = weeklyCompletionObj['sampleData'];
                          res.json(responseObj);
                      })
                      .catch(error => {
                          console.error('Error fetching weekly completion data:', error);
                          // Handle the error here
                          res.status(500).json({ error: 'Internal server error' });
                      });
                  break;
  
        default:
                  // indicates a request option that hasn't yet been implemented
                  // none hopefully
                  console.log('Unknown dataRequested');
                  return res.json(responseObj);
      }
      
       

});

httpServer.listen(HTTP_PORT, () => {
    console.log(`company-analytics API is running on port ${HTTP_PORT}`);
});
