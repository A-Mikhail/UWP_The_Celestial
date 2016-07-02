(function () {
    "use strict";

    // create db for user files
    function userDB() {
        let userFilesDB;

        return userFilesDB = new PouchDB("user");
    }

    // create db for google files
    function googleDB() {
        let googleFilesDB;

        return googleFilesDB = new PouchDB("google");
    }

    // destroy db: user
    function destroyUserDB() {
        userDB().destroy().then(function (response) {
            console.log("database 'user' destroyed");
        }).catch(function (err) {
            console.log(err);
        });
    }

    WinJS.Namespace.define("Databases", {
        userDB: userDB,
        googleDB: googleDB,
        destroyUserDB: destroyUserDB
    });
})();