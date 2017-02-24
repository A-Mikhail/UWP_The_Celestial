(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let itemsArray = new Array;
    let items;

    function database(database) {
        /// <signature>
        /// <summary>
        /// Create or return database.
        /// </summary>
        /// <param name="database" type="String">
        /// Name of database to create or get.
        /// </param>
        /// <returns type="Object">
        /// A Object with database.
        /// </returns>
        /// </signature>
        let db = new PouchDB(database, { auto_compaction: true });

        return db;
    }

    function destroyDatabase(nameOfDB) {
        /// <signature>
        /// <summary>
        /// Destroy database and clear items from listView
        /// </summary>
        /// <param name="nameOfDB" type="String">
        /// Name of database to be destroyed.
        /// </param>
        /// </signature>
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemData = listView.itemDataSource.list;

        database(nameOfDB).destroy().then(function (response) {
            // Clear listView without destroying Binding.List
            itemData.splice(0, itemData.length);

            generateItems(nameOfDB);
        }).catch(function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while destroying UserDB"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    function databaseWrite(nameOfDB, dateCreated, name, objectType, relativeId, path, listItemSize, itemParent = null, nested = false) {
        /// <signature>
        /// <summary>
        /// Write recieved parameters into database.
        /// </summary>
        /// <param name="nameOfDB" type="String">
        /// In which database write data.
        /// </param>
        /// <param name="dateCreated" type="String">
        /// Date when object was last modified.
        /// </param>
        /// <param name="name" type="String">
        /// Displayed name of object.
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
        /// <param name="listItemSize" optional="false" type="String">
        /// Size of the item in List View -- small, medium or large
        /// </param>
        /// </signature>

        // Convert name to hex for avoid error with naming
        let id = "";

        for (let i = 0; i < name.length; i++) {
            id += name[i].charCodeAt(0).toString(16);
        }

        if (nested === false) {
            database(nameOfDB).put({
                _id: id,
                relativeId: relativeId,
                dateCreated: dateCreated.toLocaleString(),
                name: name,
                objectType: objectType,
                path: path,
                nested: "root",
                listItemSize: listItemSize
            }).catch(function (error) {
                messageDialog = new Windows.UI.Popups.MessageDialog(
                    "Occured error while writing items in userDB"
                    + " Status: " + error.name
                    + " Message: " + error.message
                    , " Error: " + error.status);

                messageDialog.showAsync();
            });
        } else {
            // Add folder name of a parent and nested key equal -- childern; for searching by this key.
            database(nameOfDB).put({
                _id: "children_" + id,
                relativeId: relativeId,
                dateCreated: dateCreated.toLocaleString(),
                name: name,
                objectType: objectType,
                path: path,
                itemParent: itemParent,
                nested: "children",
                listItemSize: listItemSize
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

    function removeFromDatabase(nameOfDB, item) {
        /// <signature>
        /// <summary>
        /// Removing item from database.
        /// </summary>
        /// <param name="nameOfDB" type="String">
        /// From which database remove item.
        /// </param>
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
        database(nameOfDB).get(id).then(function (doc) {
            database(nameOfDB).remove(doc);
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
        database(nameOfDB).createIndex({
            index: { fields: ['itemParent'] }
        }).then(function () {
            database(nameOfDB).find({
                selector: { itemParent: { $eq: item } }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    database(nameOfDB).remove(result.docs[i])
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
        /// Get items from array and add to listView - data
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

    function generateItems(nameOfDB, nested, parent = null) {
        /// <signature>
        /// <summary>
        /// Read from database all information and send to listView array for displaying.
        /// </summary>
        /// <param name="nameOfDB" type="String">
        /// From which database take data.
        /// </param>
        /// <param name="nested" type="String">
        /// Location of curent items 'root' or 'children'.
        /// </param>
        /// <param name="parent" optional="true" type="String">
        /// Parent folder of wanted 'nested' items.
        /// </param>
        /// </signature>
        if (nested === "root") {
            database(nameOfDB).createIndex({
                index: { fields: ['nested'] }
            }).then(function () {
                database(nameOfDB).find({
                    selector: { nested: { $eq: nested } }
                }).then(function (result) {
                    for (let i = 0; i < result.docs.length; i++) {
                        itemsArray.push({
                            title: result.docs[i].name,
                            text: result.docs[i].dateCreated,
                            type: result.docs[i].objectType,
                            listItemSize: result.docs[i].listItemSize
                        });
                    }

                    pushItemsToListView().then(function () {
                        onChangeDatabase(nameOfDB);
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
        } else {
            database(nameOfDB).createIndex({
                index: { fields: ['nested', 'itemParent'] }
            }).then(function () {
                database(nameOfDB).find({
                    selector: {
                        nested: { $eq: nested },
                        itemParent: { $eq: parent }
                    }
                }).then(function (result) {
                    for (let i = 0; i < result.docs.length; i++) {
                        itemsArray.push({
                            title: result.docs[i].name,
                            text: result.docs[i].dateCreated,
                            type: result.docs[i].objectType,
                            listItemSize: result.docs[i].listItemSize
                        });
                    }

                    pushItemsToListView().then(function () {
                        onChangeDatabase(nameOfDB);
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
    }

    function onChangeDatabase(nameOfDB) {
        /// <signature>
        /// <summary>
        /// Listen to changes created in database and write the changes to itemsArray.
        /// </summary>
        /// </signature>
        database(nameOfDB).changes({
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
                    type: change.doc.objectType,
                    listItemSize: change.doc.listItemSize
                });

                // Send new item to listView
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
        return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

    function getGroupKey(dataItem) {
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
        database: database,
        destroyDatabase: destroyDatabase,
        databaseWrite: databaseWrite,
        removeFromDatabase: removeFromDatabase,
        pushItemsToListView: pushItemsToListView,
        generateItems: generateItems,
        data: new WinJS.Binding.List(items).createGrouped(getGroupKey, getGroupData, compareGroups)
    });
})();