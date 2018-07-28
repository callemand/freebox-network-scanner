const Promise = require('bluebird');

module.exports = function(sails) {

    var configuration = {
        app: {
            app_id: "freebox-network-scanner",
            app_name: "FreeboxNetworkScanner",
            app_version: "0.0.1",
            device_name: "Gladys",
        }
    };
    const freebox = require('./freebox.js')(sails);


    return freebox.init(configuration).then((configuration) => {
        return freebox.load(configuration);
    }).then((configuration) => {
        return freebox.version(configuration);
    }).then((configuration) => {
        return freebox.authorize(configuration);
    }).then((configuration) => {
        return freebox.waitStatusGranted(configuration, 30000);
    }).then((configuration) => {
        return freebox.save(configuration);
    }).catch((error) => {
        console.log(error);
        //sails.log.error(error);
    });
};