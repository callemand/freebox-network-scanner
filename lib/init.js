
module.exports = function init(sails){
    return gladys.param.getValue('NETWORK_SCANNER_FREQUENCY_IN_MINUTE').then((networkScannerFrequency) => {

            sails.log.debug(`NetworkScannerFreebox will scan network each ${networkScannerFrequency} minutes.`);

            if(false){
                return require('./scan')(sails);
            }else{
                // scan at the given frequency
                setInterval(function(){
                    return require('./scan')(sails);
                }, parseInt(networkScannerFrequency)*60*1000);
            }

        });

};