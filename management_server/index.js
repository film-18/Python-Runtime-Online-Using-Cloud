const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const fs = require('fs')
const {NodeSSH} = require('node-ssh')
const uuid = require('uuid')
const app = express();

const {getEc2Count} = require('./ec2Count')
const {createEc2} = require('./ec2')

require('dotenv').config()

const dynamoose = require("dynamoose");

// Create new DynamoDB instance
const ddb = new dynamoose.aws.sdk.DynamoDB({
    "accessKeyId": process.env.AWS_ACCESS_KEY,
    "secretAccessKey": process.env.AWS_SECRET_KEY,
    "region": "us-east-1"
});

// Set DynamoDB instance to the Dynamoose DDB instance
dynamoose.aws.ddb.set(ddb);

const ComputeHistory = dynamoose.model("History", {
    id: {
        type: String,
        hashKey: true,
        default: uuid.v4().toString()
    },
    "time": Number,
    "code": String,
});

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.post('/', async (req, res) => {
    let programCode = req.body?.code

    console.log("processing")

    if(!programCode) {
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
                time: Date.now().valueOf(),
                code: programCode
            })
        } catch (error) {
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
        console.log("using => %s - %s", usingEC2.InstanceId, usingEC2.PublicIpAddress)

        await ssh.connect({
            host: usingEC2.PublicIpAddress,
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

        ssh.dispose()
    }
    catch (e) {
        console.log(e)
        res.status(500).send({
            "output": "Error: Cannot connect to EC2 Instance",
            'isError': true
        })   
    }

});

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Listening on port:${port}...`) );