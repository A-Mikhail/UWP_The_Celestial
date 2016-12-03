(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let items;

    // LocalCache folder
    let applicationData = Windows.Storage.ApplicationData.current;
    let localCacheFolder = applicationData.localCacheFolder;

    // Array of objects choosen by user to send in xhr (!temporary)
    let storageFileArray = [];
    let itemArray = [];

    // Picked object information
    let dateCreated
        , name
        , objectType
        , relativeId
        , path
        , size;

    let attachment;

    // Icons
    let globeIcon = "&#xe12B;";
    let folderIcon = "&#xe188;";
    let questionIcon = "&#xe11B;";

    let FLTimeout;

    function init() {
        // Global variable of listView for other functions
        var zoomedInListView = document.getElementById('zoomedInListView');
        var zoomedOutListView = document.getElementById('zoomedOutListView');

        // Files/Folder pick buttons
        let chFilesBtn = document.getElementById("addFilesBtn");
        chFilesBtn.addEventListener("click", pickFiles, false);

        let chFolderBtn = document.getElementById("addFolderBtn");
        chFolderBtn.addEventListener("click", pickFolder, false);

        // Remove selected item from List View and database
        let removeItemsBtn = document.getElementById("removeItemsBtn");
        removeItemsBtn.addEventListener("click", removeSelected, false);

        let selectAllItemsBtn = document.getElementById("selectAllItemsBtn");
        selectAllItemsBtn.addEventListener("click", function () {
            zoomedInListView.winControl.selection.selectAll();
        }, false);

        let clearSelectionBtn = document.getElementById("clearSelectionBtn");
        clearSelectionBtn.addEventListener("click", function () {
            zoomedInListView.winControl.selection.clear();
        }, false);

        // Start generate items for listViews
        generateItems();

        // Bad decision of autoadjusting height of SemanticZoom
        FLTimeout = setTimeout(function () { forceLayout(); }, 1000);

        let testBtn = document.getElementById("testBtn");
        testBtn.addEventListener("click", function () {
            let newWindow = window.open("/html/DetailedFilesManager.html", null, "height=200, width=400, status=yes, toolbar=no, menubar=no, location=no");
         }, false);
    }

    function forceLayout() {
        zoomedInListView.winControl.forceLayout();
        zoomedOutListView.winControl.forceLayout();

        clearTimeout(FLTimeout);
    }

    // Function pickFiles() - use FileOpenPicker interface, get picked files splice to string data for send into user database
    // write picked files in source format and push it to the global array - storageFileArray for xhr needs (need rethink this)
    function pickFiles(event) {
        // Verify that we are currently not snapped, or that we can unsnap to open the picker
        let currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
            !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
            // Fail silently if we can't unsnap
            return;
        }

        let options = {
            weekday: "narrow", year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", minute: "2-digit"
        };

        let fileOpenPicker = new Windows.Storage.Pickers.FileOpenPicker();
        fileOpenPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.fileList;
        fileOpenPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
        fileOpenPicker.fileTypeFilter.replaceAll(["*"]);

        // Image size - 32px x 32px
        let requestedSize = 32;
        let thumbnailMode = Windows.Storage.FileProperties.ThumbnailMode.documentsView;

        let substrType;

        let memoryStream;
        let dataWriter;
        let thumbBuffer;
        let buffer;

        fileOpenPicker.pickMultipleFilesAsync().then(function (file) {
            if (file.size > 0) {
                for (let i = 0; i < file.size; i++) {
                    dateCreated = file[i].dateCreated.toLocaleTimeString("en-us", options);
                    name = file[i].name;
                    objectType = file[i].fileType;
                    relativeId = file[i].folderRelativeId;
                    path = file[i].path;

                    // Remove dot from name for createFileAsync naming
                    substrType = objectType.substr(1);

                    // Send picked file information to User Database
                    Databases.userDatabaseWrite(dateCreated, name, objectType, relativeId, path);

                    // Get Thumbnail in StorageItemThumbnail format
                    file[i].getThumbnailAsync(thumbnailMode, requestedSize).then(function (thumbnail) {
                        if (thumbnail) {
                            memoryStream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
                            dataWriter = new Windows.Storage.Streams.DataWriter(memoryStream);

                            // Size of buffer
                            thumbBuffer = new Windows.Storage.Streams.Buffer(thumbnail.size);

                            // Write data from thumbnail into dataWriter stream
                            // 0 - Windows.Storage.Streams.InputStreamOptions.none
                            thumbnail.readAsync(thumbBuffer, thumbBuffer.capacity, 0).then(function (data) {
                                dataWriter.writeBuffer(data);
                            });

                            // Close buffer and stream after work is done
                            buffer = dataWriter.detachBuffer();
                            dataWriter.close();

                            // Create new file in localCache folder.
                            // e.g. of created file - pdf.png
                            localCacheFolder.createFileAsync("icon" + substrType + ".png", Windows.Storage.CreationCollisionOption.replaceExisting)
                            .then(function (file) {
                                return Windows.Storage.FileIO.writeBufferAsync(file, buffer);
                            });
                        }
                    });

                    // Send choosen files to global array for xhr
                    storageFileArray.push(file[i]);
                }
            } else {
                // The picker was dismissed with no selected file
                return;
            }
        });
    }

    function pickFolder(event) {
        // Verify that we are currently not snapped, or that we can unsnap to open the picker
        let currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
            !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
            // Fail silently if we can't unsnap
            return;
        }

        let options = {
            weekday: "narrow", year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", minute: "2-digit"
        };

        let folderOpenPicker = new Windows.Storage.Pickers.FolderPicker();
        folderOpenPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.thumbnail;
        folderOpenPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
        folderOpenPicker.fileTypeFilter.replaceAll(["*"]);

        folderOpenPicker.pickSingleFolderAsync().then(function (folder) {
            if (folder !== null) {
                dateCreated = folder.dateCreated.toLocaleTimeString("en-us", options);
                objectType = folder.displayType;
                relativeId = folder.folderRelativeId;
                name = folder.name;
                path = folder.path;

                // Send picked folder to DB
                Databases.userDatabaseWrite(dateCreated, name, objectType, relativeId, path);
            } else {
                // The picker was dismissed with no selected folder
                return;
            }
        });
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
        }, function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while create list of items in Binding.List"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    // Function generateItems() - read from database information and write it to the objects
    // Databases.userDB().allDocs - get all items from database and push it to FileBrowser.data
    function generateItems() {
        Databases.userDB().allDocs({
            include_docs: true,
            attachments: false
        }).then(function (result) {
            for (let i = 0; i < result.total_rows; i++) {
                itemArray.push({
                    title: result.rows[i].doc.name,
                    text: result.rows[i].doc.dateCreated,
                    icon: result.rows[i].doc.objectType
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
    }

    // Function onChangeDatabase() - listen to change created in user database and write this change to the itemArray
    // Databases.userDB().changes - watch for change in database and add new file/files
    function onChangeDatabase() {
        Databases.userDB().changes({
            since: 'now',
            live: true,
            include_docs: true
        }).on("change", function (change) {
            name = change.doc.name;
            dateCreated = change.doc.dateCreated;
            objectType = change.doc.objectType;

            itemArray.push({
                title: name,
                text: dateCreated,
                icon: objectType
            });

            pushItemsToListView();
        }).on("error", function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while adding new items in userDB"
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    // Function removeSelected() - removed selected items form listView and from database
    function removeSelected() {
        let itemsTitle;
        let itemsKey;

        if (zoomedInListView.winControl.selection.count() > 0) {
            // Wait while selection items is correct returning it's value    
            zoomedInListView.winControl.selection.getItems().done(function (items) {
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
                    itemsTitle = zoomedInListView.winControl.selection.getItems()._value[i].data.title;

                    Databases.removeFromDatabase(itemsTitle);

                    // Delete items from listView
                    FileBrowser.data.splice(items[i].index, 1);
                }
            });
        }
    }

    let specialChRegex = /[-!$@#%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g;
    let numberChRegex = /[0-9]/g;
    let engChRegex = /[a-zA-Z]/g;

    // Function used to sort the groups by first letter
    function compareGroups(left, right) {
        return left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

    // Function which returns the group key that an item belongs to
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

    // Function which returns the data for a group
    // All special characters goes to "&" section
    // All numbers goes to "#" section
    // All other go to "global" section
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

    // Suggestion in AutoSuggestBox
    function suggestionsRequestedHandler(eventObject) {
        let query = eventObject.detail.queryText.toLowerCase();
        let suggestionCollection = eventObject.detail.searchSuggestionCollection;
        let suggestionList = FileBrowser.data._groupedItems;

        if (query.length > 0) {
            for (let i = 1; i < FileBrowser.data._lastNotifyLength; i++) {
                if (suggestionList[i].data.title.substr(0, query.length).toLowerCase() === query) {
                    suggestionCollection.appendQuerySuggestion(suggestionList[i].data.title);
                }
            }
        }
    }

    // Work with picked files
    function querySubmittedHandler(eventObject) {
        let queryText = eventObject.detail.queryText;
    }

    // Function multistageRendered - create temporary placeholder and update it when data is available 
    function multistageRenderer(itemPromise) {
        let element
            , img
            , title
            , text;

        let itemTitle, itemText;

        let maxLength = 25;

        element = document.createElement("div");
        element.className = "zoomedIn-item";

        // Create DOM for displaying items
        element.innerHTML = "<img class='zoomedIn-item-img' style='opacity: 0;'/>"
            + "<div class='zoomedIn-item-detail'>"
            + "<div class='zoomedIn-item-title win-type-body'></div>"
            + "<div class='zoomedIn-item-date win-type-body'></div> </div>";

        img = element.querySelector(".zoomedIn-item-img");

        title = element.querySelector(".zoomedIn-item-title");
        title.innerHTML = "..."; // Title by default

        text = element.querySelector(".zoomedIn-item-date");
        text.innerHTML = "..."; // Text by default

        // Return the element as the placeholder, and a callback to update it when data is available
        return {
            element: element,

            renderComplete: itemPromise.then(function (item) {
                if (!title) { title = element.querySelector(".zoomedIn-item-title"); }
                if (!text) { text = element.querySelector(".zoomedIn-item-date"); }

                itemTitle = item.data.title;
                itemText = item.data.text;

                if (itemTitle.length > maxLength) {
                    itemTitle = itemTitle.substr(0, maxLength - 1) + '&hellip;';
                }

                title.innerHTML = itemTitle;
                text.innerHTML = itemText;

                // Display full lenght title in a tooltip
                new WinJS.UI.Tooltip(element, {
                    innerHTML: "Name: " + item.data.title
                });

                return item.ready;
            }).then(function (item) {
                if (!img) {
                    img = element.querySelector(".zoomedIn-item-img");
                }

                let subItemIcon = item.data.icon.substr(1);

                // Read image from localCacheFolder
                localCacheFolder.getFileAsync("icon" + subItemIcon + ".png").then(function (thumbnail) {
                    return item.loadImage(img.src = URL.createObjectURL(thumbnail, { oneTimeOnly: true }), img).then(function () {
                        return item.isOnScreen();
                    });
                });
            }).then(function (onscreen) {
                if (!onscreen) {
                    img.style.opacity = 1;
                } else {
                    WinJS.UI.Animation.fadeIn(img);
                }
            }).then(null, function (err) {
                if (err.name === "Canceled") {
                    return WinJS.Promise.wrapError(err);
                }

                img.style.opacity = 1;

                return;
            })
        };
    }

    // Function placeholderRenderer - create placeholder for zoomOut items
    function placeholderRenderer(itemPromise) {
        // Create a basic template for the item which doesn't depend on the data
        let element = document.createElement("div");
        element.className = "zoomedOut-item";
        element.innerHTML = "<h2 class='zoomedOut-item-title win-type-subtitle'>...</h2>";

        return {
            element: element,

            renderComplete: itemPromise.then(function (item) {
                element.querySelector(".zoomedOut-item-title").innerHTML = item.data.title;
            })
        };
    }

    WinJS.Utilities.markSupportedForProcessing(multistageRenderer);
    WinJS.Utilities.markSupportedForProcessing(placeholderRenderer);

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        storageFileArray: storageFileArray,
        generateItems: generateItems,
        multistageRenderer: multistageRenderer,
        placeholderRenderer: placeholderRenderer,
        data: new WinJS.Binding.List(items).createGrouped(getGroupKey, getGroupData, compareGroups),
        suggestionsRequestedHandler: WinJS.UI.eventHandler(suggestionsRequestedHandler),
        querySubmittedHandler: WinJS.UI.eventHandler(querySubmittedHandler)
    });
})();