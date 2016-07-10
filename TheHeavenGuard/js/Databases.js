(function () {
    "use strict";

    // Global variables
    let messageDialog;

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
      
        let listView = document.getElementById("listView").winControl;
        let itemData = listView.itemDataSource.list;

        userDB().destroy().then(function (response) {
            itemData.splice(0, itemData.length); // clear listView without destroing Binding.List

            FileBrowser.generateItems();

            console.log("database 'user' destroyed");
        }).catch(function (err) {
            console.log(err);
        });
    }

    function userDatabaseWrite(dateCreated, name, fileType, folderRelativeId, path) {
        // Put data from let's to database - "user"
        // _id = File name
        // path = Absoulte file path
        // if file success added create div in app
        Databases.userDB().put({
            _id: folderRelativeId,
            dateCreated: dateCreated,
            name: name,
            fileType: fileType,
            path: path
        }).then(function (response) {
            console.log("response_id: " + response.id);
        }, function (err) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Cannot add data to DB 'user'" +
            "; Status: " + err.name + "; Message: " + err.message, "Error: " + err.status);

            messageDialog.showAsync();
        });
    }

    WinJS.Namespace.define("Databases", {
        userDB: userDB,
        googleDB: googleDB,
        destroyUserDB: destroyUserDB,
        userDatabaseWrite: userDatabaseWrite
    });
})();