const AWS = require('aws-sdk');

/**
 * Completes a PUT operation thorugh DynamoDB DocumentClient
 * @param {String} callingNumber - number that called the app, used as primary key
 * @param {Array} vanityNumbers - array of vanity numbers
 */
async function putToDb (callingNumber, vanityNumbers) {

    const documentClient = new AWS.DynamoDB.DocumentClient();
    
    const params = {
      TableName : 'jamesMcNeillVanityNumbers',
      Item: {
        phoneNumber: callingNumber,
        topFiveVanityNumbers: vanityNumbers
      }
    };

    try {
        await documentClient.put(params).promise();
    } catch (e) {
        console.log(e.message);
    }
    
}

exports.putToDb = putToDb;
