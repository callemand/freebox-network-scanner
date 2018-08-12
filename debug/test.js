const sails = require('./mock-sails');
global.gladys = require('./mock-gladys');

//const index = require('../index')(sails);
const scan = require('../lib/scan')(sails);


/*
index.setup().then(() => {
    console.log('ICI')
});
*/
/*
index.init(sails).then(() => {
    //console.log('ICI')
});
*/


