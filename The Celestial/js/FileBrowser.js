(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let items;

    // LocalCache folder
    let applicationData = Windows.Storage.ApplicationData.current;
    let localCacheFolder = applicationData.localCacheFolder;

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

    // Icons
    let globeIcon = "&#xe12B;";
    let newWindowIcon = "&#xe8A7;";

    let FLTimeout;
    let thumbnailBatch;

    function init() {
        /// <signature>
        /// <summary>
        /// Initialize all functions after calling
        /// </summary>
        /// </signature>

        // Global variable of listView for other functions
        var zoomedInListView = document.getElementById('zoomedInListView');
        var zoomedOutListView = document.getElementById('zoomedOutListView');

        // Synchronize all items in listView; functionality of it located in BackgroundTransfer.js file
        let syncItemsCmd = document.getElementById("SyncItemsCmd");
        syncItemsCmd.addEventListener("click", function () {
            BackgroundTransfer.init();
        }, false);

        // Add file to listView and database
        let chFileCmd = document.getElementById("addFileCmd");
        chFileCmd.addEventListener("click", pickFiles, false);

        // Add folder to listView and database
        let chFolderCmd = document.getElementById("addFolderCmd");
        chFolderCmd.addEventListener("click", pickFolder, false);

        // Remove selected item from List View and database
        let removeSelectedCmd = document.getElementById("removeSelectedCmd");
        removeSelectedCmd.addEventListener("click", removeSelected, false);

        let selectAllItemsCmd = document.getElementById("selectAllItemsCmd");
        selectAllItemsCmd.addEventListener("click", function () {
            zoomedInListView.winControl.selection.selectAll();
        }, false);

        let clearSelectionCmd = document.getElementById("clearSelectionCmd");
        clearSelectionCmd.addEventListener("click", function () {
            zoomedInListView.winControl.selection.clear();
        }, false);

        // Open selected folder in new window
        let openInNewWindowCmd = document.getElementById("openInNewWinCmd");
        openInNewWindowCmd.addEventListener("click", function () { openNewWindow(itemTitle); }, false);

        let itemType, itemTitle;

        zoomedInListView.winControl.addEventListener("selectionchanged", function () {
            zoomedInListView.winControl.selection.getItems().then(function (items) {
                if (items !== 0) {
                    items.forEach(function (item) {
                        itemType = item.data.type;
                        itemTitle = item.data.title;
                    });

                    if (itemType === "File folder") {
                        openInNewWindowCmd.winControl.disabled = false;
                    } else {
                        openInNewWindowCmd.winControl.disabled = true;
                    }
                } else {
                    openInNewWindowCmd.winControl.disabled = true;
                }
            });
        }, false);

        thumbnailBatch = createBatch();

        // Bad decision of autoadjusting height of SemanticZoom
        FLTimeout = setTimeout(function () { forceLayout(); }, 1000);
    }

    function forceLayout() {
        zoomedInListView.winControl.forceLayout();
        zoomedOutListView.winControl.forceLayout();

        clearTimeout(FLTimeout);
    }

    function pickFiles(event) {
        /// <signature>
        /// <summary>
        /// Get picked files, send all available informations about it to userDatabase; saved icon of file to localCache folder.
        /// </summary>
        /// </signature>
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
                    Database.userDatabaseWrite(dateCreated, name, itemType, relativeId, path);

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
                                // e.g. of created file - icon_.pdf.png
                                localCacheFolder.createFileAsync("icon_" + itemType + ".png", Windows.Storage.CreationCollisionOption.replaceExisting)
                                    .then(function (file) {
                                        return Windows.Storage.FileIO.writeBufferAsync(file, buffer);
                                    });
                            }
                        });
                    }
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
        /// <signature>
        /// <summary>
        /// Get picked folder, send all available informations about it to userDatabase.
        /// </summary>
        /// </signature>
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
                Database.userDatabaseWrite(dateCreated, name, itemType, relativeId, path);

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

                            Database.userDatabaseWrite(itemDateCreated, itemName, itemDisplayType, itemRelativeId, itemPath, itemParent, true);
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

    function removeSelected() {
        /// <signature>
        /// <summary>
        /// Removed selected items from listView and database
        /// </summary>
        /// </signature>
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

                    Database.removeFromDatabase(itemsTitle);

                    // Delete items from listView
                    Database.data.splice(items[i].index, 1);
                }
            });
        }
    }

    function batchRenderer(itemPromise) {
        /// <signature>
        /// <summary>
        /// Ordered and seamless rendering items in listView; 
        /// Loading icon from localCache folder into img element;
        /// Create tooltip for each items for displaying additional information.
        /// </summary>
        /// </signature>
        let element
            , item
            , img
            , title
            , text;

        let itemTitle
            , itemText
            , itemType
            , imageType;

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
                imageType = mediaImageArray.find(function (elem) { return elem === itemType; });

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


    function placeholderRenderer(itemPromise) {
        /// <signature>
        /// <summary>
        /// Simple rendering of items in listView; 
        /// </summary>
        /// </signature>

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

    function openNewWindow(title) {
        var newWindow = window.open("/html/DetailedFilesManager.html", title);
        newWindow.postMessage(title, "*");

        // For Debug!
        if (performance && performance.mark) {
            performance.mark("Creating new Pivot");
        }
    }

    WinJS.Utilities.markSupportedForProcessing(batchRenderer);
    WinJS.Utilities.markSupportedForProcessing(placeholderRenderer);

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        batchRenderer: batchRenderer,
        placeholderRenderer: placeholderRenderer
    });
})();