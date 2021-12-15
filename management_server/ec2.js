// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Load credentials and set region from JSON file
AWS.config.update({region: 'us-east-1'});

// Create EC2 service object
var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

// AMI is amzn-ami-2011.09.1.x86_64-ebs
var instanceParams = {
   ImageId: 'ami-0ed9277fb7eb570c9', 
   InstanceType: 't2.micro',
   KeyName: 'python_key2',
   MinCount: 1,
   MaxCount: 1,
   SecurityGroupIds: ['sg-0605c5dfd18094dde'],
   SubnetId: 'subnet-0bed954bf5f435f2b'  //private1
};

exports.createEc2 = async () => {
    // Create a promise on an EC2 service object
  var data = await new AWS.EC2({apiVersion: '2016-11-15'}).runInstances(instanceParams).promise();

  var instanceId = data.Instances[0].InstanceId;
  console.log("Created instance", instanceId);
  // Add tags to the instance
  tagParams = {Resources: [instanceId], Tags: [
      {
        Key: 'Name',
        Value: 'Kanlaya Group'
      },
      {
      Key: 'EC2-Group',
      Value: 'film'
    }
  ]};
  // Create a promise on an EC2 service object
  var tagData = await new AWS.EC2({apiVersion: '2016-11-15'}).createTags(tagParams).promise();
  // Handle promise's fulfilled/rejected states
  // tagPromise.then(
  // function(data) {
  //   console.log("Instance tagged");
  // }).catch(
  //   function(err) {
  //   console.error(err, err.stack);
  // });

// // Handle promise's fulfilled/rejected states
//   instancePromise.then(
//   function(data) {
    
//   }).catch(
//     function(err) {
//     console.error(err, err.stack);
//   });
  return true
}
