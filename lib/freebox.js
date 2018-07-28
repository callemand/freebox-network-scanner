
var request = require('request-promise-native');
const crypto = require('crypto');
var fs = require('fs');

const Promise = require('bluebird');


const app = {
    app_id: "testApp1",
    app_name: "Test Node App",
    app_version: '0.0.1',
    device_name: "NodeJS",

    app_token: '',
    track_id: '',

    status: '',
    logged_in: false,

    challenge: null,
    password: null,
    session_token: null,

    permissions: {}
};

const defaultFreebox = {
    ip: 'mafreebox.freebox.fr', // default
    port: 80, // default

    url: '',

    uid: '', // freebox id
    deviceName: '',
    deviceType: '',

    apiCode: '',
    apiVersion: '',
    apiBaseUrl: ''
};

module.exports = function (sails){
    return {
        init: function (configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[init]");
                if (!configuration.app.app_id) {
                    reject("app_id must be defined in the app object");
                }else if (!configuration.app.app_name) {
                    reject("app_name must be defined in the app object");
                }else if (!configuration.app.app_version) {
                    reject("app_version must be defined in the app object");
                }else if (!configuration.app.device_name) {
                    reject("device_name must be defined in the app object");
                }else{
                    if (configuration.app.session_token) {
                        configuration.app.logged_in = true;
                    }

                    configuration.freebox = Object.assign({}, defaultFreebox, configuration.freebox || {});

                    let baseURL = configuration.baseURL;
                    if (!configuration.baseURL) {
                        configuration.baseURL = 'http://' + configuration.freebox.ip + ':' + configuration.freebox.port;
                    }
                    resolve(configuration);
                }

            });
        },

        save(configuration) {

            return new Promise(function (resolve, reject) {
                sails.log.debug("[save]");
                fs.writeFile('./freebox.json', JSON.stringify(configuration.app), function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(configuration);
                    }
                });
            });
        },

        load(configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[load]");
                fs.readFile('./freebox.json', function (err, content) {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            resolve(configuration);
                        } else {
                            reject(err);
                        }
                    } else {
                        configuration.app = JSON.parse(content);
                        resolve(configuration);
                    }
                });
            });
        },

        version: function (configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[version]");
                if (configuration.freebox.url) {
                    resolve(configuration);
                    return;
                }

                sails.log.debug("[version] get version of freebox host="+configuration.freebox.ip);

                let options = {
                    url: configuration.baseURL + '/api_version',
                    json: true,
                    resolveWithFullResponse: true
                };

                request(options).then(function (response) {
                    if (response.statusCode !== 200) {
                        reject("Unsupported status code ! (" + response.statusCode + ")");
                    } else {
                        let jbody = response.body;


                        configuration.freebox.uid = jbody.uid;
                        configuration.freebox.deviceName = jbody.device_name;
                        configuration.freebox.deviceType = jbody.device_type;

                        configuration.freebox.apiVersion = jbody.api_version;
                        configuration.freebox.apiCode = 'v' + jbody.api_version.substr(0, 1);
                        configuration.freebox.apiBaseUrl = jbody.api_base_url;

                        configuration.freebox.url = configuration.baseURL + configuration.freebox.apiBaseUrl + configuration.freebox.apiCode + '/';

                        resolve(configuration);
                    }
                }).catch(function (err) {
                    reject(err);
                });
            });
        },

        authorize: function (configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[authorize]");
                if (configuration.app.password) {
                    resolve(configuration);
                    return;
                }

                if (!configuration.freebox.url) {
                    reject("Freebox URL must be defined");
                    return;
                }


                var json = {
                    "app_id": configuration.app.app_id,
                    "app_name": configuration.app.app_name,
                    "app_version": configuration.app.app_version,
                    "device_name": configuration.app.device_name
                };

                console.log("_authorize", "Request authorisation json=", json);

                var options = {
                    url: configuration.freebox.url + 'login/authorize/',
                    method: 'POST',
                    json: json,
                    encode: 'utf-8',
                    resolveWithFullResponse: true
                };

                request(options).then(function (response) {
                    //console.log(response.statusCode);
                    //console.log("_authorize", "Request login/authorize response=", response.body);

                    if (response.statusCode !== 200) {
                        configuration.app.app_token = null;
                        configuration.app.track_id = null;
                        reject("_authorize : Unsupported status code ! (" + response.statusCode + ")");
                    } else if (!response.body || response.body.success !== true) {
                        configuration.app.app_token = null;
                        configuration.app.track_id = null;
                        reject("_authorize : Unauthorized response=", response.body);
                    } else {
                        configuration.app.app_token = response.body.result.app_token;
                        configuration.app.track_id = response.body.result.track_id;

                        console.log("_authorize", "App_token=", configuration.app.app_token, "track_id=", configuration.app.track_id);
                        resolve(configuration);
                    }

                }).catch(function (err) {
                    //debug("_authorize", "Can not login/authorize", error);
                    reject(err);
                });

            });
        },

        waitStatusGranted: function (configuration, delay) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                sails.log.debug("[waitStatusGranted]");
                if (configuration.app.status === 'granted') {
                    resolve(configuration);
                } else {
                    _this._waitStatusGranted(delay, configuration, resolve, reject);
                }

            });
        },

        _waitStatusGranted: function (delay, configuration, resolve, reject) {

            console.log("_waitSatusGranted", "App status=", configuration.app.status, "delay=", delay);
            if (configuration.app.status === 'granted') {
                console.log("RESOLVE 1");
                resolve(configuration);
            } else {
                this.getAuthorizeStatus(configuration).then(() => {

                    console.log("_waitSatusGranted", "new app=", configuration.app);

                    if (configuration.app.status === 'granted') {
                        console.log("RESOLVE");
                        resolve(configuration);
                    } else if (configuration.app.status !== 'pending') { // If the app is denied or timeout or revoked
                        reject("The app is not accepted. You must register it.");
                    } else {
                        console.log("waitStatusGranted", "delay=", delay);
                        if (delay > 0) {
                            delay -= 1000;

                            setTimeout(() => {
                                this._waitStatusGranted(delay, configuration, resolve, reject);
                            }, 1000);
                        } else {
                            reject("Waiting for user timeout");
                        }
                    }
                }).catch((error) => {
                    console.log("_waitSatusGranted", "getAuthorize status returns error=", error);
                    reject(error);
                });
            }
        },


        getAuthorizeStatus(configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[getAuthorizeStatus]");
                if (!configuration.freebox.url) {
                    reject("Freebox URL must be defined");
                } else if (!configuration.app.track_id) {
                    reject("Application track id must be defined");
                } else {
                    var options = {
                        url: configuration.freebox.url + 'login/authorize/' + configuration.app.track_id,
                        json: true,
                        resolveWithFullResponse: true
                    };

                    request(options).then(function (response) {
                        console.log(response.statusCode);
                        console.log("_getAuthorizeStatus", "Request login/authorize status trackId=", configuration.app.track_id, "response=", response.body);


                        var oldStatus = configuration.app.status;
                        var oldChallenge = configuration.app.challenge;
                        var oldPassword = configuration.app.password;

                        if (response.statusCode !== 200) {
                            configuration.app.status = null;
                            configuration.app.challenge = null;
                            configuration.app.password = null;

                            reject("_getAuthorizeStatus", "Unsupported status code ! (" + response.statusCode + ")");
                        } else if (!response.body || response.body.success !== true) {
                            configuration.app.status = null;
                            configuration.app.challenge = null;
                            configuration.app.password = null;

                            reject("_getAuthorizeStatus", "getTrackStatus response=", response.body.result);
                        } else {
                            configuration.app.status = response.body.result.status; // Normaly 'pending'
                            configuration.app.challenge = response.body.result.challenge;

                            console.log("_getAuthorizeStatus", "status=", configuration.app.status, "challenge=", configuration.app.challenge);
                        }

                        if (oldStatus != configuration.app.status || oldChallenge != configuration.app.challenge) {
                            configuration.app.password = null;
                        }

                        resolve(configuration);
                    }).catch(function (error) {
                        console.log("_getAuthorizeStatus", "Can not login/authorize", error);
                        reject(err);
                    });
                }
            });
        },

        login: function (configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[login]");
                // Asking a new challenge

                if (!configuration.freebox.url) {
                    reject("Freebox URL must be defined");
                } else {
                    var options = {
                        url: configuration.freebox.url + 'login',
                        json: true,
                        resolveWithFullResponse: true
                    };

                    request(options).then(function (response) {
                        if (response.statusCode !== 200) {
                            configuration.app.logged_in = false;
                            configuration.app.challenge = null;
                            configuration.app.password = null;

                            reject("_login - Unsupported status code ! (" + response.statusCode + ")");
                        } else if (!response.body.result || response.body.success !== true) {
                            configuration.app.logged_in = false;
                            configuration.app.challenge = null;
                            configuration.app.password = null;

                            reject("_login - getTrackStatus response=" + response.body.result);
                        } else {
                            configuration.app.logged_in = response.body.result.logged_in; // Update login status
                            configuration.app.challenge = response.body.result.challenge; // Update challenge
                            configuration.app.password = crypto.createHmac('sha1', configuration.app.app_token).update(configuration.app.challenge).digest('hex');
                        }

                        resolve(configuration);
                    }).catch((error) => {
                        reject(error);
                    });
                }

            });
        },

        session: function (configuration) {
            return new Promise(function (resolve, reject) {
                sails.log.debug("[session]");

                if (!configuration.freebox.url) {
                    reject("Freebox URL must be defined");
                } else if (!configuration.app.password) {
                    reject("Application password must be defined");
                } else {
                    // POST app_id & password
                    var options = {
                        url: configuration.freebox.url + 'login/session/',
                        method: 'POST',
                        json: {
                            "app_id": configuration.app.app_id,
                            "app_version": configuration.app.app_version,
                            "password": configuration.app.password,
                        },
                        encode: 'utf-8',
                        resolveWithFullResponse: true
                    };

                    request(options).then((response) => {
                        if (response.statusCode == 200) { // OK
                            configuration.app.challenge = response.body.result.challenge; // Update challenge
                            configuration.app.session_token = response.body.result.session_token; // Save session token
                            configuration.app.logged_in = true; // Update login status
                            configuration.app.permissions = response.body.result.permissions;

                        } else if (response.statusCode == 403) { // Forbidden
                            configuration.app.challenge = response.body.result.challenge; // Update challenge
                            configuration.app.logged_in = false;
                            configuration.app.session_token = null;
                            configuration.app.password = null;

                            reject("Session failed !");
                        } else {
                            reject("Unsupported status code (" + response.statusCode + ")");
                        }

                        resolve(configuration);
                    }).catch((error) => {
                        reject(error);
                    })
                }
            });
        },

        getLanDevice: function (configuration) {
            return new Promise(function (resolve, reject) {
                var options = {
                    url: configuration.freebox.url + 'lan/browser/pub/',
                    json: true,
                    resolveWithFullResponse: true
                };

                options.headers = options.headers || {};
                options.headers['X-Fbx-App-Auth'] = configuration.app.session_token;

                sails.log.debug("[getLanDevice]");


                request(options).then((response) => {
                    if (response.statusCode != 200) {
                        reject("Invalid response" + response.statusCode);
                    } else {
                        resolve(response.body.result);
                    }
                }).catch((error) => {
                    reject(error);
                });

            });


        }
    }

};