(function () {
    "use strict";

    // Global variables
    let messageDialog;

    // create db for user files
    function userDB() {
        let userFilesDB;

        return userFilesDB = new PouchDB("user");
    }

    // destroy db: user
    function destroyUserDB() {
      
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemData = listView.itemDataSource.list;

        userDB().destroy().then(function (response) {
            // Clear listView without destroing Binding.List
            itemData.splice(0, itemData.length);

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
            _id: name,
            folderRelativeId: folderRelativeId,
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
        destroyUserDB: destroyUserDB,
        userDatabaseWrite: userDatabaseWrite
    });
})();