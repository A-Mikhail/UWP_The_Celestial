(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let itemsArray = new Array;
    let items;

    // Create db for user files
    function userDB() {
        let userDB = new PouchDB("user", { auto_compaction: true });

        return userDB;
    }

    // destroyUserDB - function that destroyed userDB
    // and clean all items from ListView array
    function destroyUserDB() {
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemData = listView.itemDataSource.list;

        userDB().destroy().then(function (response) {
            // Clear listView without destroying Binding.List
            itemData.splice(0, itemData.length);

            generateItems();
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
        Database.db.close();
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
            userDB().put({
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
            userDB().put({
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
        userDB().get(id).then(function (doc) {
            userDB().remove(doc);
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
        userDB().createIndex({
            index: { fields: ['itemParent'] }
        }).then(function () {
            userDB().find({
                selector: { itemParent: { $eq: item } }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    userDB().remove(result.docs[i])
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

    function pushItemsToListView() {
        /// <signature>
        /// <summary>
        /// Get items from array and added to Database.data
        /// </summary>
        /// </signature>

        return new Promise(function (resolve, reject) {
            resolve(
                itemsArray.forEach(function (item) {
                    Database.data.push(item);
                })
            );

            // Clear array of item each time function is called
            itemsArray.length = 0;
        }, function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while create list of items in Binding.List"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    function generateItems(nested, parent) {
        /// <signature>
        /// <summary>
        /// Read from database all information and send to listView array for displaying
        /// </summary>
        /// <param name="nested" type="String">
        /// Location of curent items 'root' or 'children'.
        /// </param>
        /// <param name="parent" optional="true" type="String">
        /// Parent folder of wanted 'nested' items.
        /// </param>
        /// </signature>
        userDB().createIndex({
            index: { fields: ['nested'] }
        }).then(function () {
            userDB().find({
                selector: { nested: { $eq: nested } }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    itemsArray.push({
                        title: result.docs[i].name,
                        text: result.docs[i].dateCreated,
                        type: result.docs[i].objectType
                    });
                }

                pushItemsToListView().then(function () {
                    onChangeDatabase();
                });
            }).catch(function (error) {
                messageDialog = new Windows.UI.Popups.MessageDialog(
                    "Occured error while generate items into ListView"
                    + " Status: " + error.name
                    + " Message: " + error.message
                    , " Error: " + error.status);

                messageDialog.showAsync();
            });
        });
    }

    function onChangeDatabase() {
        /// <signature>
        /// <summary>
        /// Listen to changes created in database and write this changes to the itemsArray
        /// </summary>
        /// <param name="itemsArray" type="Array">
        /// Array of items for listView
        /// </param>
        /// </signature>
        userDB().changes({
            since: 'now',
            timeout: false,
            live: true,
            include_docs: true
        }).on("change", function (change) {
            // Put in listView only root elements
            if (change.doc.nested === "root") {
                itemsArray.push({
                    title: change.doc.name,
                    text: change.doc.dateCreated,
                    type: change.doc.objectType
                });

                pushItemsToListView();
            }
        }).on("error", function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while adding new items in userDB"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    // Sorting variables, each type has they own filter
    let specialChRegex = /[-!$@#%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g;
    let numberChRegex = /[0-9]/g;
    let engChRegex = /[a-zA-Z]/g;

    function compareGroups(left, right) {
        /// <signature>
        /// <summary>
        /// Sort the groups by first letter
        /// </summary>
        /// <param name="left" type="Object">
        /// First sorted object
        /// </param>
        /// <param name="right" type="Object">
        /// Second sorted object
        /// </param>
        /// </signature>
        return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

    function getGroupKey(dataItem) {
        /// <signature>
        /// <summary>
        /// Returns the group key that an item belongs to 
        /// </summary>
        /// <param name="dataItem" type="Array">
        /// Array of sorted items
        /// </param>
        /// </signature>
        let titleFirstLetter = dataItem.title.toUpperCase().charAt(0);

        if (titleFirstLetter.search(specialChRegex) !== -1) {
            return "&";
        } else if (titleFirstLetter.search(numberChRegex) !== -1) {
            return "#";
        } else if (titleFirstLetter.search(engChRegex) !== -1) {
            return dataItem.title.toUpperCase().charAt(0);
        } else {
            return globeIcon;
        }
    }

    function getGroupData(dataItem) {
        /// <signature>
        /// <summary>
        /// Return the data for a group
        /// </summary>
        /// <param name="dataItem" type="Array">
        /// Array of sorted items
        /// </param>
        /// </signature>
        let titleFirstLetter = dataItem.title.toUpperCase().charAt(0);

        if (titleFirstLetter.search(specialChRegex) !== -1) {
            return { title: "&" };
        } else if (titleFirstLetter.search(numberChRegex) !== -1) {
            return { title: "#" };
        } else if (titleFirstLetter.search(engChRegex) !== -1) {
            return { title: titleFirstLetter };
        } else {
            return { title: globeIcon };
        }
    }

    WinJS.Namespace.define("Database", {
        userDB: userDB,
        destroyUserDB: destroyUserDB,
        userDatabaseWrite: userDatabaseWrite,
        removeFromDatabase: removeFromDatabase,
        pushItemsToListView: pushItemsToListView,
        generateItems: generateItems,
        data: new WinJS.Binding.List(items).createGrouped(getGroupKey, getGroupData, compareGroups)
    });
})();