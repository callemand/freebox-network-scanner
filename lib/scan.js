const Promise = require('bluebird');
const ip = require('ip');

if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

module.exports = function scan(sails) {
    var configuration = {
        app: {
            app_id: "freebox-network-scanner",
            app_name: "FreeboxNetworkScanner",
            app_version: "0.0.1",
            device_name: "Gladys",
        }
    };

    const freebox = require('./freebox.js')(sails);

    sails.log.info("Scanning...");
    return freebox.init(configuration).then((configuration) => {
        return freebox.load(configuration)
    }).then((configuration) => {
        return freebox.version(configuration)
    }).then((configuration) => {
        return freebox.login(configuration);
    }).then((configuration) => {
        return freebox.session(configuration);
    }).then((configuration) => {
        return freebox.save(configuration);
    }).then((configuration) => {
        return freebox.getLanDevice(configuration);
    }).then((listDevices) => {
        sails.log.info("Scan Complete, creating device...");
        return [listDevices, gladys.machine.getMyHouse(), gladys.param.getValue('NETWORK_SCANNER_HOSTS')];
    }).spread((listDevices, house, networkScannerHost) => {
        return Promise.map(listDevices, function(freeboxDevice){
            let localIp = undefined;
            let reachable = false;

            if(freeboxDevice.l3connectivities){
                for (var i = 0, len = freeboxDevice.l3connectivities.length; i < len; i++) {
                    let l3connectivity = freeboxDevice.l3connectivities[i];
                    if(l3connectivity.af === 'ipv4'){
                        localIp = l3connectivity.addr;
                        reachable = l3connectivity.reachable;
                        let last_time_reachable = l3connectivity.last_time_reachable;
                        let currentTime = Math.floor(Date.now() / 1000);
                        if(reachable == false && Math.abs(currentTime - last_time_reachable) < 120){
                            sails.log.debug("Protect reachable ("+Math.abs(currentTime - last_time_reachable)+"s)");
                            reachable = true;
                        }

                        break;
                    }

                }
            }
            if(!localIp || ip.cidrSubnet(networkScannerHost).contains(localIp) === false ) {
                return null;
            }else{
                return gladys.device.create({
                    device: {
                        name: freeboxDevice.primary_name,
                        identifier: localIp,
                        protocol: 'network',
                        service: 'freebox-networkscanner'
                    },
                    types: []
                }).then((device) => {
                    if(!device.device || !device.device.user) return null;

                    if(reachable){
                        return gladys.house.isUserNotAtHome({house: house.id, user:device.device.user}).then((result) => {
                            if(result){
                                return gladys.event.create({code: 'back-at-home', user: device.device.user, house: house.id});
                            }else{
                                return null;
                            }
                        });
                    }else{
                        return gladys.house.isUserAtHome({house: house.id, user:device.device.user}).then((result) => {
                            if(result){
                                return gladys.event.create({code: 'left-home', user: device.device.user, house: house.id});
                            }else{
                                return null;
                            }
                        });
                    }
                    // the user has been seen, save it
                    //return gladys.house.userSeen({house: house.id, user: device.device.user});
                });
            }
        });

    }).then((device) => {
        sails.log.info("Scan Completed");
    }).catch((error) => {
        sails.log.error("Global ERROR:"+ error);
    });
};