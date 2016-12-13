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

    // Array of image extensions for replacing by default image 
    let mediaImageArray = [".png"
        , ".cur"
        , ".jps"
        , ".jpg"
        , ".jpe"
        , ".jpeg"
        , ".tif"
        , ".tiff"
        , ".gif"
        , ".bmp"
        , ".dib"
        , ".rle"
        , ".exif"
        , ".ico"];

    // Picked item information
    let dateCreated
        , name
        , itemType
        , relativeId
        , path
        , size;

    let attachment;

    // Icons
    let globeIcon = "&#xe12B;";

    let FLTimeout;

    let thumbnailBatch;

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

        thumbnailBatch = createBatch();

        // Start generate root items for listViews
        generateItems("root");

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
        let fileOpenPicker = new Windows.Storage.Pickers.FileOpenPicker();
        fileOpenPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.fileList;
        fileOpenPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
        fileOpenPicker.fileTypeFilter.replaceAll(["*"]);

        // Image size - 32px x 32px
        let requestedSize = 32;
        let thumbnailMode = Windows.Storage.FileProperties.ThumbnailMode.singleItem;

        let substrType;

        let memoryStream;
        let dataWriter;
        let thumbBuffer;
        let buffer;

        fileOpenPicker.pickMultipleFilesAsync().then(function (file) {
            if (file.size > 0) {
                for (let i = 0; i < file.size; i++) {
                    dateCreated = file[i].dateCreated;
                    name = file[i].name;
                    itemType = file[i].fileType;
                    relativeId = file[i].folderRelativeId;
                    path = file[i].path;

                    // Send picked file information to User Database
                    Databases.userDatabaseWrite(dateCreated, name, itemType, relativeId, path);

                    let image = mediaImageArray.find(function (element) { return element === itemType; });

                    // If file type not an image then create file with it thumbnail
                    if (!image) {
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
                                localCacheFolder.createFileAsync("icon_" + itemType + ".png", Windows.Storage.CreationCollisionOption.replaceExisting)
                                    .then(function (file) {
                                        return Windows.Storage.FileIO.writeBufferAsync(file, buffer);
                                    });
                            }
                        });
                    }

                    // Send choosen files to global array for xhr
                    storageFileArray.push(file[i]);
                }
            } else {
                // The picker was dismissed with no selected file
                messageDialog = new Windows.UI.Popups.MessageDialog("File not picked");
                messageDialog.showAsync();

                return;
            }
        });
    }

    function pickFolder(event) {
        let folderOpenPicker = new Windows.Storage.Pickers.FolderPicker();
        folderOpenPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.thumbnail;
        folderOpenPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
        folderOpenPicker.fileTypeFilter.replaceAll(["*"]);

        folderOpenPicker.pickSingleFolderAsync().then(function (folder) {
            if (folder) {
                dateCreated = folder.dateCreated;
                itemType = folder.displayType;
                relativeId = folder.folderRelativeId;
                name = folder.name;
                path = folder.path;

                // Send picked folder to DB
                Databases.userDatabaseWrite(dateCreated, name, itemType, relativeId, path);

                // Show files inside folder
                let query = folder.createItemQuery();
                query.getItemsAsync().done(function (items) {
                    if (items) {
                        let itemName
                            , itemDateCreated
                            , itemDisplayType
                            , itemRelativeId
                            , itemPath
                            , itemParent;

                        items.forEach(function (item) {
                            itemName = item.name;
                            itemDateCreated = item.dateCreated;
                            itemDisplayType = item.displayType;
                            itemRelativeId = item.folderRelativeId;
                            itemPath = item.path;
                            itemParent = name;

                            Databases.userDatabaseWrite(itemDateCreated, itemName, itemDisplayType, itemRelativeId, itemPath, itemParent, true);
                        });
                    }
                });
            } else {
                // The picker was dismissed with no selected folder
                messageDialog = new Windows.UI.Popups.MessageDialog("Folder not picked");
                messageDialog.showAsync();

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

    function generateItems(nested, parent) {
        /// <signature>
        /// <summary>
        /// Read from Database - UserDB() all information and send to listView array for displaying
        /// </summary>
        /// <param name="nested" type="String">
        /// Location of curent items 'root' or 'children'.
        /// </param>
        /// <param name="parent" optional="true" type="String">
        /// Parent folder of wanted 'nested' items.
        /// </param>
        /// </signature>
        Databases.userDB().createIndex({
            index: { fields: ['nested'] }
        }).then(function () {
            Databases.userDB().find({
                selector: { nested: { $eq: nested } }
            }).then(function (result) {
                for (let i = 0; i < result.docs.length; i++) {
                    itemArray.push({
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

    // Function onChangeDatabase() - listen to change created in user database and write this change to the itemArray
    // Databases.userDB().changes - watch for change in database and add new file/files
    function onChangeDatabase() {
        Databases.userDB().changes({
            since: 'now',
            timeout: false,
            live: true,
            include_docs: true
        }).on("change", function (change) {
            // Put in listView only root elements
            if (change.doc.nested === "root") {
                itemArray.push({
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
    function batchRenderer(itemPromise) {
        let element
            , item
            , img
            , title
            , text;

        let itemTitle, itemText, itemType;

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

            renderComplete: itemPromise.then(function (i) {
                item = i;

                if (!title) { title = element.querySelector(".zoomedIn-item-title"); }
                if (!text) { text = element.querySelector(".zoomedIn-item-date"); }

                itemTitle = item.data.title;
                itemText = item.data.text;
                itemType = item.data.type;

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
            }).then(function () {
                let imageType = mediaImageArray.find(function (elem) { return elem === itemType; });

                if (itemType === "File folder") {
                    return item.loadImage("/img/folder-32x32.png");
                } else if (itemType === imageType) {
                    return item.loadImage("/img/image-32x32.png");
                } else if (!imageType) {
                    return localCacheFolder.getFileAsync("icon_" + itemType + ".png").then(function (thumbnail) {
                        return item.loadImage(URL.createObjectURL(thumbnail, { oneTimeOnly: false }));
                    });
                }
            }).then(thumbnailBatch()
            ).then(function (newImg) {
                img.src = newImg.src;
                return item.isOnScreen();
            }).then(function (onscreen) {
                if (!onscreen) {
                    img.style.opacity = 1;
                } else {
                    WinJS.UI.Animation.fadeIn(img);
                }
            }).then(null, function (error) {
                if (error.name === "Canceled") {
                    return WinJS.Promise.wrapError(error);
                } else {
                    img = element.querySelector(".zoomedIn-item-img");

                    if (img) {
                        img.src = "/img/placeholder-32x32.png";
                        img.style.opacity = 1;
                    }

                    return;
                }
            })
        };
    }

    function createBatch(waitPeriod) {
        let batchTimeout = WinJS.Promise.as();
        let batcheItems = [];

        function completeBatch() {
            let callbacks = batcheItems;
            batcheItems = [];

            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i]();
            }
        }

        return function () {
            batchTimeout.cancel();
            batchTimeout = WinJS.Promise.timeout(waitPeriod || 64).then(completeBatch);

            let delayedPromise = new WinJS.Promise(function (c) {
                batcheItems.push(c);
            });

            return function (v) {
                return delayedPromise.then(function () { return v; });
            };
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

    WinJS.Utilities.markSupportedForProcessing(batchRenderer);
    WinJS.Utilities.markSupportedForProcessing(placeholderRenderer);

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        storageFileArray: storageFileArray,
        generateItems: generateItems,
        batchRenderer: batchRenderer,
        placeholderRenderer: placeholderRenderer,
        data: new WinJS.Binding.List(items).createGrouped(getGroupKey, getGroupData, compareGroups),
        suggestionsRequestedHandler: WinJS.UI.eventHandler(suggestionsRequestedHandler),
        querySubmittedHandler: WinJS.UI.eventHandler(querySubmittedHandler)
    });
})();