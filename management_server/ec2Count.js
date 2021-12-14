// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({ region: 'us-east-1' });

// Create EC2 service object
var ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

var paramsRunning = {
    Filters: [{
        Name: "tag:EC2-Group",
        Values: ["film"]
    },
    {
        Name: "instance-state-name",
        Values: ["running"]
    }
    ]
};

var params = {
    Filters: [{
        Name: "tag:EC2-Group",
        Values: ["film"]
    },
    {
        Name: "instance-state-name",
        Values: ["running", 'pending']
    }
    ]
};

exports.getEc2Count = async (onlyRunning = true) => {
    let data = await ec2.describeInstances(onlyRunning ? paramsRunning : params).promise();
    var ec2_count = data.Reservations.length

    let all_ec2 = data.Reservations.map(e => e.Instances[0])

    
    return {
        ec2Counts: ec2_count,
        ec2s: all_ec2
    }
}