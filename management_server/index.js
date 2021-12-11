const express = require('express');
const app = express();

app.get('/', function(req, res) {
    res.send("hello world")
});

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Listening on port:${port}...`) );