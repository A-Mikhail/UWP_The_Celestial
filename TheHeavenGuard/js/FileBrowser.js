(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let items;

    let storageFileArr = []; // Array of File choosen by user to send in xhr
    let itemArray = [];

    // File information
    let file,
        dateCreated,
        name,
        fileType,
        folderRelativeId,
        path;

    function init() {
        // File choose button
        let chFilesBtn = document.getElementById("toolbarAddFilesBtn");
        chFilesBtn.addEventListener("click", pickFiles, false);

        // Remove selected item from List View and database
        let removeItemsBtn = document.getElementById("removeItemsBtn");
        removeItemsBtn.addEventListener("click", removeSelected, false);

        let selectAllItemsBtn = document.getElementById("selectAllItemsBtn");
        selectAllItemsBtn.addEventListener("click", (function () {
            let listView = document.getElementById("zoomedInListView").winControl;

            listView.selection.selectAll();
        }), false);

        let clearSelectionBtn = document.getElementById("clearSelectionBtn");
        clearSelectionBtn.addEventListener("click", (function () {
            let listView = document.getElementById("zoomedInListView").winControl;

            listView.selection.clear();
        }), false);

        // Start generate Items for listViews
        generateItems();
    }

    // Function pickFiles() - use FileOpenPicker interface, get picked files splice to string data for send into user database
    // write picked files in source format and push it to the global array - storageFileArr for xhr needs (need rethink this)
    function pickFiles(event) {
        // Verify that we are currently not snapped, or that we can unsnap to open the picker
        let currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
            !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
            // Fail silently if we can't unsnap
            return;
        }

        let openPicker = new Windows.Storage.Pickers.FileOpenPicker();
        openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.fileList;
        openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        openPicker.fileTypeFilter.replaceAll(["*"]); // Open all format files 

        let options = {
            weekday: "narrow", year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", minute: "2-digit"
        };

        openPicker.pickMultipleFilesAsync().then(function (files) {
            if (files.size > 0) {
                for (let i = 0; i < files.size; i++) {
                    dateCreated = files[i].dateCreated.toLocaleTimeString("en-us", options);
                    name = files[i].name;
                    fileType = files[i].fileType;
                    folderRelativeId = files[i].folderRelativeId;
                    path = files[i].path;

                    // Send choosen files to global array for xhr
                    storageFileArr.push(files[i]);

                    // Send picked file information to User Database
                    Databases.userDatabaseWrite(dateCreated, name, fileType, folderRelativeId, path);
                }
            } else {
                // The picker was dismissed with no selected file
                return;
            }
        });
    }

    // Pick icon by file type
    function iconToListView(fileType) {
        let imgArr = [
            ".png",
            ".jpeg",
            ".psd",
            ".gif",
            ".tiff"
        ];

        let textArr = [
            ".txt",
            ".doc",
            ".docx",
            ".odt",
            ".pdf"
        ];

        for (let i = 0; i < imgArr.length; i++) {
            if (fileType == imgArr[i]) {
                return "&#xe158;";
            } else if (fileType == textArr[i]) {
                return "&#xe160;";
            } else {
                return "&#xe11B"; // default 
            }
        }
    }

    // Function pushItemsToListView() get all items from array and push it to Binding.List
    function pushItemsToListView() {
        return new Promise(function (resolve, reject) {
            resolve(
                itemArray.forEach(function (item) {
                    FileBrowser.data.push(item);
                })
            );

            // Clear array of item each time function is called
            itemArray.length = 0;
        }, function (err) {
            reject(err);
        });
    }

    // Function generateItems() - read from database information and write it to the objects
    // Databases.userDB().allDocs - get all items from database and push it to FileBrowser.data when MainWindow function get information about it
    function generateItems() {
        Databases.userDB().allDocs({
            include_docs: true,
            attachments: false
        }).then(function (result) {
            for (let i = 0; i < result.total_rows; i++) {
                itemArray.push({
                    title: result.rows[i].doc.name, text: result.rows[i].doc.dateCreated,
                    icon: iconToListView(result.rows[i].doc.fileType)
                });
            }

            pushItemsToListView().then(function () {
                onChangeDatabase();
            });
        }).catch(function (err) {
            console.log(err);
        });
    }

    // Function onChangeDatabase() - listen to change created in user database and write this change to the itemArray
    // Databases.userDB().changes - watch for change in database and add new file/files
    function onChangeDatabase() {
        Databases.userDB().changes({
            since: 'now',
            live: true,
            include_docs: true
        }).on("change", function (change) {
            itemArray.push({
                title: change.doc.name, text: change.doc.dateCreated,
                icon: iconToListView(change.doc.fileType)
            });

            pushItemsToListView();
        }).on("error", function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Fail to listen changes in database 'user'" +
                "; Status: " + error.name + "; Message: " + error.message, "Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    // Function removeFromDatabase() - functionality for removing documents from database
    function removeFromDatabase(item) {
        Databases.userDB().get(item).then(function (doc) {
            console.log(doc);
            return Databases.userDB().remove(doc);
        }).then(function (result) {
            console.log(result);
        }).catch(function (err) {
            console.log(err);
        });
    }

    // Function removeSelected() - removed selected items form listView and from database
    function removeSelected() {
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemsTitle;
        let itemsKey;

        if (listView.selection.count() > 0) {
            // Wait while selection items is correct returning it's value    
            listView.selection.getItems().done(function (items) {
                // Sort the selection to ensure its in index order
                items.sort(function CompareForSrt(item1, item2) {
                    let first = item1.index, second = item2.index;

                    if (first === second) {
                        return 0;
                    } else if (first < second) {
                        return -1;
                    } else {
                        return 1;
                    }
                });

                for (let i = items.length - 1; i >= 0; i--) {
                    // Get title of selected items
                    itemsTitle = listView.selection.getItems()._value[i].data.title;

                    removeFromDatabase(itemsTitle);

                    // Delete items from listView
                    FileBrowser.data.splice(items[i].index, 1);
                }
            });
        }
    }

    // Function used to sort the groups by first letter
    function compareGroups(left, right) {
        return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

    // Function which returns the group key that an item belongs to
    function getGroupKey(dataItem) {
        return dataItem.title.toUpperCase().charAt(0);
    }

    // Function which returns the data for a group
    function getGroupData(dataItem) {
        return { title: dataItem.title.toUpperCase().charAt(0) };
    }

    function suggestionsRequestedHandler(eventObject) {
        let queryText = eventObject.detail.queryText,
            query = queryText.toLowerCase(),
            suggestionCollection = eventObject.detail.searchSuggestionCollection,
            suggestionList = FileBrowser.data._groupedItems;

        if (queryText.length > 0) {
            for (let i = 1, len = FileBrowser.data.length; i < len; i++) {
                if (suggestionList[i].data.title.substr(0, query.length).toLowerCase() === query) {
                    suggestionCollection.appendQuerySuggestion(suggestionList[i].data.title);
                }
            }
        }
    }

    function querySubmittedHandler(eventObject) {
        var queryText = eventObject.detail.queryText;
    }

    // Function multistageRendered - create temporary placeholder and update it when data is available 
    function multistageRenderer(itemPromise) {
        let element, icon, title, text;

        element = document.createElement("div");
        element.className = "listview-template-item";

        // create temporary DOM - copy from original in MainWindow.html
        element.innerHTML = "<div class='listview-template-item-icon' style='opacity: 0;'>" +
            "</div> <div class='listview-template-item-detail'>" +
            "<div class='listview-template-item-title'></div>" +
            "<div class='listview-template-item-date'></div> </div>";

        icon = element.querySelector(".listview-template-item-icon");

        title = element.querySelector(".listview-template-item-title");
        title.innerHTML = "..."; // text by default

        text = element.querySelector(".listview-template-item-date");
        text.innerHTML = "..."; // text by default

        // return the element as the placeholder, and a callback to update it when data is available
        return {
            element: element,

            renderComplete: itemPromise.then(function (item) {
                if (!title) { title = element.querySelector(".listview-template-item-title"); }
                if (!text) { text = element.querySelector(".listview-template-item-date"); }

                title.innerHTML = item.data.title;
                text.innerHTML = item.data.text;

                return item.ready;
            }).then(function (item) {
                icon.innerHTML = item.data.icon;

                return item.isOnScreen();
            }).then(function (onscreen) {
                if (!onscreen) {
                    icon.style.opacity = 1;
                } else {
                    WinJS.UI.Animation.fadeIn(icon);
                }
            }).then(null, function (err) {
                if (err.name === "Canceled") {
                    return WinJS.Promise.wrapError(err);
                }

                icon.innerHTML = "&#xe155;"; // icon by default for placeholder
                icon.style.opacity = 1;

                return;
            })
        };
    }

    // function placeholder renderer - create placeholder for zoomOut items
    function placeholderRenderer(itemPromise) {
        // create a basic template for the item which doesn't depend on the data
        let element = document.createElement("div");
        element.className = "zoomed-out-item";
        element.innerHTML = "<h2 class='zoomed-out-item-title'>...</h2>";

        return {
            element: element,

            renderComplete: itemPromise.then(function (item) {
                element.querySelector(".zoomed-out-item-title").innerText = item.data.title;
                element.querySelector(".zoomed-out-item-title").addEventListener("click", (function () { scrollToItem(item.data.title) }), false);
            })
        };
    }

    function scrollToItem(title) {
        let listView = document.getElementById("zoomedInListView").winControl;
        let itemOffset;

        // Get characteristics of item
        itemOffset = listView._getItemOffsetPosition(FileBrowser.data.groups.dataSource._list._groupItems[title].firstItemIndexHint);

        // Scroll to choosen item
        return listView.scrollPosition = itemOffset._value.left;
    }

    WinJS.Utilities.markSupportedForProcessing(multistageRenderer);
    WinJS.Utilities.markSupportedForProcessing(placeholderRenderer);

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        storageFileArr: storageFileArr,
        generateItems: generateItems,
        multistageRenderer: multistageRenderer,
        placeholderRenderer: placeholderRenderer,
        data: new WinJS.Binding.List(items).createGrouped(getGroupKey, getGroupData, compareGroups),
        suggestionsRequestedHandler: WinJS.UI.eventHandler(suggestionsRequestedHandler),
        querySubmittedHandler: WinJS.UI.eventHandler(querySubmittedHandler)
    });
})();