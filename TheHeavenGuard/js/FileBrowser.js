(function () {
    "use strict";

    // Global variables
    let messageDialog;
    let storageFileArr = []; // Array of File choosen by user to send in xhr

    let items = [],
        itemArray = [];

    // File information
    let file,
        dateCreated,
        name,
        fileType,
        folderRelativeId,
        path;

    // Function init() - main function which contains eventListeners and function calls
    function init() {
        // File choose button
        let chFilesBtn = document.getElementById("toolbarAddFilesBtn");
        chFilesBtn.addEventListener("click", pickFiles, false);

        generateItems();
    }

    // Function progressBar() - shows current progress of events in animation line
    function progressBar() {
        let pBar = document.getElementById("progressBar");

        pBar.style = "display: block;";
    }

    // Function createFilesOrFolders() - create file or folder by extension type inside broser-window
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

        openPicker.pickMultipleFilesAsync().then(function (files) {
            if (files.size > 0) {
                for (let i = 0; i < files.size; i++) {
                    dateCreated         = files[i].dateCreated;
                    name                = files[i].name;
                    fileType            = files[i].fileType;
                    folderRelativeId    = files[i].folderRelativeId;
                    path                = files[i].path;

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

    // Function pushItemsToListView() create a promise that resolve item from global array to data in listView 
    // then clear all data from itemArray 
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

    // Function generateItems() - read from database information and write it to objects
    // Databases.userDB().allDocs - get all items from database and push it to FileBrowser.data when MainWindow function get information about it
    function generateItems() {
        Databases.userDB().allDocs({
            include_docs: true,
            attachments: false
        }).then(function (result) {
            for (let i = 0; i < result.total_rows; i++) {
                itemArray.push({ title: result.rows[i].doc.name, text: result.rows[i].doc.dateCreated, picture: "/img/testListViewPicture.png" });
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
            console.log("change has happened!");

            itemArray.push({ title: change.doc.name, text: change.doc.dateCreated });

            pushItemsToListView();
        }).on("error", function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Fail to listen changes in database 'user'" +
                "; Status: " + error.name + "; Message: " + error.message, "Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        storageFileArr: storageFileArr,
        generateItems: generateItems,
        data: new WinJS.Binding.List(items)
    });
})();