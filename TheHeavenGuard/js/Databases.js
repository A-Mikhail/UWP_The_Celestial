(function () {
    "use strict";

    // create db for user files
    function userDB() {
        var userFilesDB;

        return userFilesDB = new PouchDB("user");
    }

    // create db for google files
    function googleDB() {
        var googleFilesDB;

        return googleFilesDB = new PouchDB("google");
    }

    WinJS.Namespace.define("Databases", {
        userDB: userDB,
        googleDB: googleDB
    });
})();