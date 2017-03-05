(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let itemsArray = new Array;
    let items;

    /**
     * @description Create or return database.
     * @param {string} database Name of database to create or call.
     * @returns {object} An object with called database.
     */
    function database(database) {
        let db = new PouchDB(database, { auto_compaction: true });

        return db;
    }

    /**
     * @description Destroy database and clear items from List View
     * @param {string} nameOfDB Name of database to destroy
     */
    function destroyDatabase(nameOfDB) {
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
    
    /**
     * @description Write data into database
     * @param {string} nameOfDB Name of database to write
     * @param {string} dateCreated Date when item was last modified
     * @param {string} name Name of an item
     * @param {string} objectType Type of item, for files - file extension
     * @param {string} relativeId Unique id of item
     * @param {string} path Absolute path of item
     * @param {string} listItemSize Size of item to display in List View
     * @param {string} itemParent Parent name
     * @param {boolean} nested Children an item or parent
     */
    function databaseWrite(nameOfDB, dateCreated, name, objectType, relativeId, path, listItemSize, itemParent = null, nested = false) {
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

    /**
     * @description Removing item from database
     * @param {string} nameOfDB Name of database from which delete an item
     * @param {string} item _id of removed item
     */
    function removeFromDatabase(nameOfDB, item) {
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

    /**
     * @description Get items from itemsArray and push to List View data
     */
    function pushItemsToListView() {
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

    /**
     * @description Read from database requested information and sended to
     * itemsArray for displaying in List View
     * @param {string} nameOfDB Name of database from which read data
     * @param {string} nested 'root' or 'children' requested items
     * @param {string} parent Name of parent folder if requested items -- children
     */
    function generateItems(nameOfDB, nested, parent = null) {
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

    /**
     * @description Listen to changes in database and write it to itemsArray
     * @param {string} nameOfDB Name of database from which to listen changes
     */
    function onChangeDatabase(nameOfDB) {
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