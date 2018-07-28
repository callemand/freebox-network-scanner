const sails = require('./debug/sails');
global.gladys = require('./debug/gladys');

const index = require('./index')(sails);

/*
index.setup().then(() => {
    console.log('ICI')
});
*/

index.init(sails).then(() => {
    console.log('ICI')
});


