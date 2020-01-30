var express = require('express');
var AWS = require('aws-sdk');
var app = express();
var bodyParser = require('body-parser');

//Pull credentials/regions from config
AWS.config.loadFromPath('./aws-config.json');

var rek = new AWS.Rekognition();

var mysql = require('mysql');

const fs = require('fs');

const dbConfigPath = './db-config.json';
const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'UTF-8'));

app.all('/', function (req, res) {
  res.send(
      'Welcome to your app! Try visiting "/detectExample" to see a Rekognition result.')
});

app.use(bodyParser.json());

app.get('/detectExample', function (req, res) {
  //Docs on Rekognition API
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Rekognition.html
  var params =
      {
        Image: {
          S3Object: {
            Bucket: "<SAMPLE-BUCKET>", //Bucket of choice.
            Name: "skateboard.jpeg"    //Image of choice.
          }
        },
        MaxLabels: 100,
        MinConfidence: 10
      };

  rek.detectLabels(params, function (err, data) {
    if (err) {
      res.send(err.stack);
    } else {
      res.send(data);
    }
  });
});

app.get('/api/recognizeCelebrities/:tileId', function (req, res) {
  //req.params.tileId
  var params =
      {
        Image: {
          S3Object: {
            Bucket: "lightsail-demo-public", // Bucket of choice.
            Name: `Photos/Matching/${req.params.tileId}` // Image of choice.
          }
        }
      };
  rek.recognizeCelebrities(params, function (err, data) {
    if (err) {
      res.send(err.stack);
    } else {
      res.send(data);
    }
  });
});

app.post('/api/saveScore', function (req, res) {
  var connection = mysql.createConnection(dbConfig);
  connection.query('INSERT INTO Scores (Name, Score) VALUES (?, ?);',
      [req.body.name, req.body.score], (err, resB) => {
        if (err) {
          console.log(err.stack);
        }
        res.send(resB);
        connection.end();
      });
});

app.get('/api/getScores', function (req, res) {
  var connection = mysql.createConnection(dbConfig);
  connection.query('SELECT * FROM Scores;', (err, resB) => {

    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        connection.query(
            'CREATE TABLE Scores (Name varchar(255), Score int);',
            (err, resC => {
              if (err) {
                console.log(err.stack);
              }
            }));
      } else {
        console.log(err.stack);
      }
    } else {
      res.send(resB);
    }
    connection.end();
  });
});

app.listen(5000);
console.log('listening on 5000');
