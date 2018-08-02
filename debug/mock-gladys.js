


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
        resolve('plop');
    });
}

function isUserNotAtHome(obj){
    return new Promise(function(resolve, reject){
        resolve(true);
    });
}

function isUserAtHome(obj){
    return new Promise(function(resolve, reject){
        resolve(false);
    });
}

function getMyHouse(){
    return new Promise(function(resolve, reject){
        resolve({id: 'plopplop'});
    });
}

function eventCreate(){
    return new Promise(function(resolve, reject){
        resolve({id: 'plopplop'});
    });
}

function on(type, callback){
}




module.exports = {
    param: {
        getValue: getValue
    },
    device: {
        create: create
    },
    house:{
        userSeen: userSeen,
        isUserNotAtHome: isUserNotAtHome,
        isUserAtHome: isUserAtHome
    },
    machine: {
        getMyHouse: getMyHouse
    },
    event: {
        create: eventCreate
    },
    on: on
};