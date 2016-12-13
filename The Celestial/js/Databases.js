(function () {
    "use strict";

    // Global variables
    let messageDialog;

    // create db for user files
    function userDB() {
        let userDB = new PouchDB("user", { auto_compaction: true });

        return userDB;
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
        }).catch(function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while destroying UserDB"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    // Close database
    // db - Database to close
    function closeDatabase(db) {
        Databases.db.close();
    }

    function userDatabaseWrite(dateCreated, name, objectType, relativeId, path, itemParent, nested) {
        /// <signature>
        /// <summary>
        /// Write recieved parameters into UserDB();
        /// </summary>
        /// <param name="dateCreated" type="String">
        /// Date when object was last modified.
        /// </param>
        /// <param name="name" type="String">
        /// Displayed name of object
        /// </param>
        /// <param name="objectType" type="String">
        /// Type of item; for files - file extensions.
        /// </param>
        /// <param name="relativeId" type="String">
        /// Unique id of item.
        /// </param>
        /// <param name="path" type="String">
        /// Absolute path to the item.
        /// </param>
        /// <param name="itemParent" optional="true" type="String">
        /// Parent of item if it's nested.
        /// </param>
        /// <param name="nested" optional="true" type="Boolean">
        /// </param>
        /// </signature>

        // Convert name to hex for avoid error with naming
        let id = "";

        for (let i = 0; i < name.length; i++) {
            id += name[i].charCodeAt(0).toString(16);
        }

        // If nested equal true then add folder parent name and nested key for searching by this key
        if (nested === true) {
            Databases.userDB().put({
                _id: id,
                relativeId: relativeId,
                dateCreated: dateCreated.toLocaleString(),
                name: name,
                objectType: objectType,
                path: path,
                itemParent: itemParent,
                nested: "children"
            }).catch(function (error) {
                messageDialog = new Windows.UI.Popups.MessageDialog(
                    "Occured error while writing items in userDB"
                    + " Status: " + error.name
                    + " Message: " + error.message
                    , " Error: " + error.status);

                messageDialog.showAsync();
            });
        } else {
            Databases.userDB().put({
                _id: id,
                relativeId: relativeId,
                dateCreated: dateCreated.toLocaleString(),
                name: name,
                objectType: objectType,
                path: path,
                nested: "root"
            }).catch(function (error) {
                messageDialog = new Windows.UI.Popups.MessageDialog(
                    "Occured error while writing items in userDB"
                    + " Status: " + error.name
                    + " Message: " + error.message
                    , " Error: " + error.status);

                messageDialog.showAsync();
            });
        }
    }

    function removeFromDatabase(item) {
        /// <signature>
        /// <summary>
        /// Functionality for removing items from database.
        /// </summary>
        /// <param name="item" type="String">
        /// _id of removed items
        /// </param>
        /// </signature>

        // Convert name to hex for removing by using id
        let id = "";

        for (let i = 0; i < item.length; i++) {
            id += item[i].charCodeAt(0).toString(16);
        }

        // Remove root item
        Databases.userDB().get(id).then(function (doc) {
            Databases.userDB().remove(doc);
        }).catch(function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while removing items from userDB"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });

        // Remove nested item
        // Search by name all the nested element 
        Databases.userDB().createIndex({
            index: { fields: ['itemParent'] }
        }).then(function () {
            Databases.userDB().find({
                selector: { itemParent: { $eq: item } }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    Databases.userDB().remove(result.docs[i])
                        .catch(function (error) {
                            messageDialog = new Windows.UI.Popups.MessageDialog(
                                "Occured error while deleting item."
                                + " Status: " + error.name
                                + " Message: " + error.message
                                , " Error: " + error.status);

                            messageDialog.showAsync();
                        });
                }
            }).catch(function (error) {
                messageDialog = new Windows.UI.Popups.MessageDialog(
                    "Error. Can't find requested item for deleting."
                    + " Status: " + error.name
                    + " Message: " + error.message
                    , " Error: " + error.status);

                messageDialog.showAsync();
            });
        });
    }

    WinJS.Namespace.define("Databases", {
        userDB: userDB,
        destroyUserDB: destroyUserDB,
        userDatabaseWrite: userDatabaseWrite,
        removeFromDatabase: removeFromDatabase
    });
})();