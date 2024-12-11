const AWS = require('aws-sdk');

// Configure AWS DynamoDB
AWS.config.update({
  region: 'eu-west-2', // Replace with your region
  accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID', // Replace with your AWS Access Key ID
  secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY' // Replace with your AWS Secret Access Key
});

// Create a DynamoDB DocumentClient
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports = dynamoDb;
