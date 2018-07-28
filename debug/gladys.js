


function getValue (param) {
    return new Promise(function(resolve, reject){
        resolve(1);
    });
}

function create (deviceInfo){
    return new Promise(function(resolve, reject){
        deviceInfo.device.id = Math.floor(Math.random() * Math.floor(10000));
        deviceInfo.device.user = {};
        resolve(deviceInfo);
    });
}

function userSeen(obj){
    return new Promise(function(resolve, reject){
        console.log('USER SEEN');
        resolve('plop');
    });
}

function getMyHouse(){
    return new Promise(function(resolve, reject){
        resolve({id: 'plopplop'});
    });
}

module.exports = {
    param: {
        getValue: getValue
    },
    device: {
        create: create
    },
    house:{
        userSeen: userSeen
    },
    machine: {
        getMyHouse: getMyHouse
    }
};