(function () {
    "use strict";

    // Global variables
    let messageDialog;

    // create db for user files
    function userDB() {
        let userFilesDB;

        return userFilesDB = new PouchDB("user");
    }

    // destriyUserDB - function that destroyed userDB
    // and clean all items from ListView array
    function destroyUserDB() {
      
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemData = listView.itemDataSource.list;

        userDB().destroy().then(function (response) {
            // Clear listView without destroying Binding.List
            itemData.splice(0, itemData.length);

            FileBrowser.generateItems();

            console.log("database 'user' destroyed");
        }).catch(function (err) {
            console.log(err);
        });
    }

    // userDatabaseWrite - function that put recieved data into UserDB 
    // object - is files or folder
    // dateCreated - time when object last modified
    // name - Displayed name of object
    // objectType - Type of object; for files - file extensions, for folder - type of folder
    // relativeId - Unique id of objects
    // path - Absolute path to the object
    // size - Size of files
    function userDatabaseWrite(dateCreated, name, objectType, relativeId, path, size) {
        Databases.userDB().put({
            _id: name,
            relativeId: relativeId,
            dateCreated: dateCreated,
            name: name,
            objectType: objectType,
            path: path,
            size: size
        }).then(function (response) {
            console.log("response_id: " + response.id);
        }, function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Cannot add data to DB 'user'" +
            "; Status: " + error.name + "; Message: " + error.message, "Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    WinJS.Namespace.define("Databases", {
        userDB: userDB,
        destroyUserDB: destroyUserDB,
        userDatabaseWrite: userDatabaseWrite
    });
})();