// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({ region: 'us-east-1' });

// Create EC2 service object
var ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

exports.terminateEc2 = async (terminateEc2Ids) => {

    console.log(terminateEc2Ids)
    
    return await ec2.terminateInstances({
        InstanceIds: terminateEc2Ids
    }).promise()


}