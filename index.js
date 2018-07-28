module.exports = function(sails) {

    gladys.on('ready', function(){
        sails.log.debug("[index -- init]");
        return require('./lib/init.js')(sails);
    });

    return {
        init: function() {
            sails.log.debug("[index -- init]");
            return require('./lib/init.js')(sails);
        },
        setup: function() {
            sails.log.debug("[index -- setup]");
            return require('./lib/setup.js')(sails);
        },
        scan: function() {
            sails.log.debug("[index -- scan]");
            return require('./lib/scan.js')(sails);
        }
    }
}

