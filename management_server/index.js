const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const fs = require('fs')
const { NodeSSH } = require('node-ssh')
const uuid = require('uuid')
const app = express();
var AWS = require('aws-sdk');
const axios = require('axios')
const cron = require('node-cron');

const { getEc2Count } = require('./ec2Count')
const { createEc2 } = require('./ec2')

require('dotenv').config()

const dynamoose = require("dynamoose");
const { terminateEc2 } = require('./ec2Terminate');

// Create new DynamoDB instance
const ddb = new dynamoose.aws.sdk.DynamoDB({
    "accessKeyId": process.env.AWS_ACCESS_KEY,
    "secretAccessKey": process.env.AWS_SECRET_KEY,
    "region": "us-east-1"
});

// Set DynamoDB instance to the Dynamoose DDB instance
dynamoose.aws.ddb.set(ddb);

const s3 = new AWS.S3({
    "accessKeyId": process.env.AWS_ACCESS_KEY,
    "secretAccessKey": process.env.AWS_SECRET_KEY,
    "Bucket": "my-bucket-film"
});

const ComputeHistory = dynamoose.model("History", {
    id: String,
    "time": Number,
    "code": String,
});

const NodeData = dynamoose.model("Node", {
    id: String,
    value: String,
});

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.post('/', async (req, res) => {
    let programCode = req.body?.code

    console.log("processing")

    if (!programCode) {
        return res.status(400).send({
            "output": "Error: No code input",
            "isError": true
        })
    }

    const fileName = `code-${uuid.v4()}.py`;

    try {
        fs.writeFileSync(`./codes/${fileName}`, programCode)
    }
    catch (e) {
        console.log(e);
        return res.status(500).send({
            "output": "Error: Something wrong with your code :(",
            "isError": true
        })
    }

    try {
        let ssh = new NodeSSH()

        try {
            await ComputeHistory.create({
                id: uuid.v4().toString(),
                time: Date.now().valueOf(),
                code: programCode
            })
        } catch (error) {
            console.log("error with database....")
            console.error(error);
        }

        let ec2 = await getEc2Count();

        if (ec2.ec2Counts === 0) { // EC2 Maimee
            console.log("We have no EC2 Standby Waiting...")
            while (ec2.ec2Counts === 0) {
                await new Promise((res) => setTimeout(res, 10000)) // sleep for 10 seconds wait for EC2
                ec2 = await getEc2Count()
            }
            // await createEc2(); // create new EC2
        }

        let usingEC2Index = Math.floor(Math.random() * ec2.ec2Counts); // random ec2 for use to run code :) change to roundrobin tomorrow XD
        let usingEC2 = ec2.ec2s[usingEC2Index];
        console.log("using => %s - %s", usingEC2.InstanceId, usingEC2.PrivateIpAddress)

        await ssh.connect({
            host: usingEC2.PrivateIpAddress,
            username: 'ec2-user',
            privateKey: fs.readFileSync('./keypair/python_key2.pem', 'utf-8'),
        })

        await ssh.putFile(`./codes/${fileName}`, `${fileName}`);

        let result = await ssh.execCommand(`python3 ./${fileName}`)

        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)

        res.send({
            "output": result.stdout,
            'isError': false
        })

        fs.rmSync(`./codes/${fileName}`)
        ssh.execCommand(`rm ${fileName}`)

        // ssh.dispose()
    }
    catch (e) {
        console.log(e)
        res.status(500).send({
            "output": "Error: Cannot connect to EC2 Instance",
            'isError': true
        })
    }

});

app.get('/share/', (req, res) => {
    let s3Url = req.query.s3;
    console.log(s3Url)
    axios.get(s3Url).then(response => {
        res.send(response.data)
    }).catch(e => {
        res.status(500).send()
    })
    
})

app.post('/share', async (req, res) => {
    
    //   const s3download = function (params) {
    //     return new Promise((resolve, reject) => {
    //         s3.createBucket({
    //             "Bucket": "my-bucket-film"        /* Put your bucket name */
    //         }, function () {
    //             s3.getObject(params, function (err, data) {
    //                 if (err) {
    //                     reject(err);
    //                 } else {
    //                     console.log("Successfully dowloaded data from bucket");
    //                     resolve(data);
    //                     res.send(data.Body.toString('utf-8'))
    //                 }
    //             });
    //         });
    //     });
    // }
    // s3download(params)

    let programCode = req.body?.code

    if (!programCode) {
        return res.status(400).send({
            "output": "Error: No code input",
            "isError": true
        })
    }

    const fileName = `code-${uuid.v4()}.py`;

    const params = {
        "Bucket": "my-bucket-film",
        "Key": fileName,
        Body: programCode,
        ACL:'public-read'
    };

    let data = await s3.upload(params).promise()

    res.send({
        sharelink: `http://localhost:3002/?s3=${data.Location}`
    })
});

var argv = require('minimist')(process.argv.slice(2));
// console.log(argv)

const port = process.env.PORT || argv.port || 8080
app.listen(port, () => console.log(`Listening on port:${port}...`));

let startedJob = false

const thisNode = uuid.v4();

cron.schedule('*/25 * * * * *', async() => {

    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 8)))

    // console.log((await NodeData.get('master_node')).original().value, thisNode)

    if((await NodeData.get('master_node')).original().value === thisNode) {
        NodeData.update({
            id: "last_response",
            value: Date.now().valueOf().toString()
        })
        console.log("response to other nodes...")
    }
    else {
        // take over master node
        // console.log((await NodeData.get("last_response")).original().value)
        let last_response = parseInt((await NodeData.get("last_response")).original().value);

        // console.log(last_response)

        if(!last_response || last_response <=  Date.now().valueOf() - 40000) { // take over
            console.log("taking over master node...")

            NodeData.update({
                id: "master_node",
                value: thisNode
            })
            NodeData.update({
                id: "last_response",
                value: Date.now().valueOf().toString()
            })
        }
        else {
            console.log("I'm still slave node...")
        }

    }

})

cron.schedule('* * * * *', async () => {
    if (startedJob) return;
    startedJob = true

    try {
        // check dynamo for master node if self is maternode then do a job
        if((await NodeData.get('master_node')).original().value === thisNode) {

            console.log("working on scaling....")

            let last_code_in_10_minuites = (await ComputeHistory.scan('time').gt(Date.now().valueOf() - 600000).count().exec()).count;

            let need_ec2 = Math.ceil(last_code_in_10_minuites / 50)

            console.log("%d excutions in last 10 minutes, need %d ec2...", last_code_in_10_minuites, need_ec2)

            let currentEc2 = await getEc2Count(false);

            if (need_ec2 !== currentEc2.ec2Counts) {
                if(need_ec2 > currentEc2.ec2Counts) {
                    // need more ec2
                    for(let i = 0; i < need_ec2 - currentEc2.ec2Counts; i++) {
                        createEc2()
                    }
                    console.log('creating new ec2')
                }
                else {
                    // terminate unused ec2
                    // console.log(currentEc2.ec2s.slice(0, currentEc2.ec2Counts - need_ec2))
                    await terminateEc2(currentEc2.ec2s.slice(0, currentEc2.ec2Counts - need_ec2).map(inst => inst.InstanceId))
                    console.log('terminated unuse ec2')
                }
            }

        }
    }
    catch (e) {
        console.log(e)
    }

    startedJob = false
});