const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const fs = require('fs')
const {NodeSSH} = require('node-ssh')
const uuid = require('uuid')
const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.post('/', async (req, res) => {
    let programCode = req.body?.code

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

        await ssh.connect({
            host: 'ktnis.me',
            username: 'fmmm',
            privateKey: fs.readFileSync('./keypair/cloud', 'utf-8'),
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