
const {createEc2} = require('./ec2')

console.log('creating')
createEc2().then(() => {
    console.log('created!')
});
