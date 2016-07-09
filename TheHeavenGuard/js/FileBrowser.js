(function () {
    "use strict";

    // Global letiables
    let messageDialog;
    let storageFileArr = []; // Array of File choosen by user to send in xhr

    let items = [],
        itemArray = []

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

        generateItems();
    }

    // Progress bar shows current progress of events in animation line
    function progressBar() {
        let pBar = document.getElementById("progressBar");

        pBar.style = "display: block;";
    }

    // Function createFilesOrFolders 
    // Create file or folder by extension type inside broser-window
    // Create <div> inside <li> for grid display
    function createFilesOrFolders() {
        let browserWindow = document.getElementById("browserWindow");

        if (file) {
            browserWindow.appendChild(fileType);
        } else if (folder) {
            browserWindow.appendChild(folderType);
        } else {
            browserWindow.appendChild(unknownType);
        }
    }

    // Main function to choose files
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

        openPicker.pickMultipleFilesAsync().then(function (files) {
            if (files.size > 0) {
                for (let i = 0; i < files.size; i++) {
                    dateCreated = files[i].dateCreated;
                    name = files[i].name;
                    fileType = files[i].fileType;
                    folderRelativeId = files[i].folderRelativeId;
                    path = files[i].path;

                    // Send choosen files to global array for xhr
                    storageFileArr.push(files[i]);

                    // send to user database
                    Databases.userDatabaseWrite(dateCreated, name, fileType, folderRelativeId, path);
                }
            } else {
                // The picker was dismissed with no selected file
                return;
            }
        });
    }

    // Test function :}
    function changedItemsArray() {
        return new Promise(function (resolve, reject) {
            resolve(
                itemArray.forEach(function (item) {
                    FileBrowser.data.push(item);
                })
            );
        }, function (err) {
            reject(err);
        });
    }

    // Function generateItems() read from database information and write it to objects
    // Databases.userDB().changes - watch for change in database and add new file/files
    // Databases.userDB().allDocs - get all items from database and push it to FileBrowser.data when MainWindow function get information about it
    function generateItems() {
        Databases.userDB().changes({
            since: 'now',
            live: true,
            include_docs: true
        }).on("change", function (change) {
            console.log("change has happened!");

            itemArray.push({ title: change.doc.name, text: change.doc.dateCreated });

            changedItemsArray().then(function () {
                itemArray.length = 0; // remove data from array after it's added
            });
        }).on("error", function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Fail to listen changes in database 'user'" +
                "; Status: " + error.name + "; Message: " + error.message, "Error: " + error.status);

            messageDialog.showAsync();
        });

        Databases.userDB().allDocs({
            include_docs: true,
            attachments: false
        }).then(function (result) {
            for (let i = 0; i < result.total_rows; i++) {
                itemArray.push({ title: result.rows[i].doc.name, text: result.rows[i].doc.dateCreated });
            }

            itemArray.forEach(function (item) {
                FileBrowser.data.push(item);
            });
        }).then(function () {
            itemArray.length = 0;
        }).catch(function (err) {
            console.log(err);
        });

        return items;
    }

    function updateSize(event) {
        let nBytes = 0,
            oFiles = event.dataTransfer.files,
            nFiles = oFiles.length;

        for (let nFileId = 0; nFileId < nFiles; nFileId++) {
            nBytes += oFiles[nFileId].size;
        }

        let sOutput = nBytes + " bytes";

        for (let aMultiples = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
            sOutput = nApprox.toFixed(3) + " " + aMultiples[nMultiple] + " (" + nBytes + " bytes)";
        }

        console.log("size: " + sOutput);
        console.log("count: " + nFiles);
    }

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        storageFileArr: storageFileArr,
        data: new WinJS.Binding.List(items),
        generateItems: generateItems
    });
})();