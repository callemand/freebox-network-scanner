


function error (msg) {
    print("ERROR", msg);
}
function warn (msg) {
    print("WARN", msg);
}
function debug (msg) {
    print("DEBUG", msg);
}
function info (msg) {
    print("INFO", msg);
}
function verbose (msg) {
    print("VERBOSE", msg);
}
function silly (msg) {
    print("SILLY", msg);
}
function print(level, msg){
    //console.log("[", level, "]", msg);
}

module.exports = {
    log: {
        error: error,
        warn: warn,
        debug: debug,
        info: info,
        verbose: verbose,
        silly: silly
    }
};