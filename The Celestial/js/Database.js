(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let itemsArray = new Array;
    let items;

    /**
     * @description Create or return database.
     * @param {string} DBName Name of database to create or call.
     * @returns {object} An object with called database.
     */
    function database(DBName) {
        let db = new PouchDB(DBName, { auto_compaction: true });

        return db;
    }

    /**
     * @description Destroy database and clear items from List View
     * @param {string} DBName Name of database to destroy
     */
    function destroyDatabase(DBName) {
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemData = listView.itemDataSource.list;

        database(DBName).destroy().then(function (response) {
            // Clear listView without destroying Binding.List
            itemData.splice(0, itemData.length);

            generateItems(DBName);
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
     * @description Write item into database
     * @param {any} DBName Name of database to write
     * @param {any} iCreated Item Date created
     * @param {any} iName Item name
     * @param {any} iType Item type
     * @param {any} iRelId Item relative id
     * @param {any} iPath Item path
     * @param {any} iListSize Item size in List View -- 'smallListItem' or 'largeListItem'
     * @param {any} iNested Item nested or not
     * @param {any} iParent Item parent name if it children
     */
    function databaseWrite(DBName, iCreated, iName, iType, iRelId, iPath, iListSize = "smallListItem", iNested = false, iParent = null) {
        // Convert name to hex for avoid error with naming
        let generatedId = "";

        // Check if item is parent or children
        // if children add prefix '_children' to avoid collision with name
        if (iNested === true) {
            for (let i = 0; i < iName.length; i++) {
                generatedId += "children_" + iName[i].charCodeAt(0).toString(16);
            }
        } else {
            for (let i = 0; i < iName.length; i++) {
                generatedId += iName[i].charCodeAt(0).toString(16);
            }
        }

        database(DBName).put({
            _id: generatedId,
            itemRelativeId: iRelId,
            itemDateCreated: iCreated.toLocaleString(),
            itemName: iName,
            itemType: iType,
            itemPath: iPath,
            itemParent: iParent,
            itemNested: iNested,
            itemListSize: iListSize
        }).catch(function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while writing items in userDB"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    /**
     * @description Removing item from database
     * @param {string} DBName Name of database from which delete an item
     * @param {string} item _id of removed item
     */
    function removeFromDatabase(DBName, item) {
        // Convert name to hex for removing by using id
        let id = "";

        for (let i = 0; i < item.length; i++) {
            id += item[i].charCodeAt(0).toString(16);
        }

        // Remove root item
        database(DBName).get(id).then(function (doc) {
            database(DBName).remove(doc);
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
        database(DBName).createIndex({
            index: { fields: ['itemParent'] }
        }).then(function () {
            database(DBName).find({
                selector: { itemParent: { $eq: item } }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    database(DBName).remove(result.docs[i])
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
     * @param {string} DBName Name of database from which read data
     * @param {boolean} itemNested nested item or not
     * @param {string} itemParent Name of parent folder if requested item nested
     */
    function generateItems(DBName, itemNested = false, itemParent = null) {
        database(DBName).createIndex({
            index: { fields: ['itemNested', 'itemParent'] }
        }).then(function () {
            database(DBName).find({
                selector: {
                    itemNested: { $eq: itemNested },
                    itemParent: { $eq: itemParent }
                }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    itemsArray.push({
                        title: result.docs[i].itemName,
                        text: result.docs[i].itemDateCreated,
                        type: result.docs[i].itemType,
                        itemListSize: result.docs[i].itemListSize
                    });
                }

                pushItemsToListView().then(function () {
                    onChangeDatabase(DBName);
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

    /**
     * @description Listen to changes in database and write it to itemsArray
     * @param {string} DBName Name of database from which to listen changes
     */
    function onChangeDatabase(DBName) {
        database(DBName).changes({
            since: 'now',
            timeout: false,
            live: true,
            include_docs: true
        }).on("change", function (change) {
            // Put in main List View only parent elements
            if (change.doc.itemNested === false) {
                itemsArray.push({
                    title: change.doc.itemName,
                    text: change.doc.itemDateCreated,
                    type: change.doc.itemType,
                    itemListSize: change.doc.itemListSize
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