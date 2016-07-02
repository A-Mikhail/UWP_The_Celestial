(function () {
    "use strict";

    // Global letiables
    let messageDialog;
    let storageFileArr = []; // Array of File choosen by user to send in xhr

    let div = document.createElement('div'); // create <div> container
    let li  = document.createElement('li'); // create <li>

    function init() {
        // File choose button
        let chFilesBtn = document.getElementById("toolbar-btn-add");
        chFilesBtn.addEventListener("click", chooseFiles, false);

        databaseRead(); // add data from DB to app
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
        let browserWindow = document.getElementById("browser-window");
        
        if (file) {
            browserWindow.appendChild(fileType);
        } else if (folder) {
            browserWindow.appendChild(folderType);
        } else {
            browserWindow.appendChild(unknownType);
        }
    }

    // Main function to choose files
    function chooseFiles(event) {
        // Verify that we are currently not snapped, or that we can unsnap to open the picker
        let currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
            !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
            // Fail silently if we can't unsnap
            return;
        }

        let openPicker = new Windows.Storage.Pickers.FileOpenPicker();
        openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        openPicker.fileTypeFilter.replaceAll(["*"]); // Open all format files 

        let value,
            attributes,
            path;

        openPicker.pickMultipleFilesAsync().then(function (files) {
            if (files.size > 0) {
                // Application now has read/write access to the picked file(s)
                let outputString;

                for (let i = 0; i < files.size; i++) {
                    // Send array of choosen files to global 
                    storageFileArr.push(files[i]);

                    outputString = files[i].name; // get name of the selected files
                    path = files[i].path; // get path of the selected files

                    div.id = "fileNum_" + i; // <div id="fileNum_1..." />
                    div.className = "file";

                    div.innerHTML = outputString; // Name of added files
                    list.appendChild(div); // create div to selected file/folder

                    databaseWrite(outputString, path); // Send to db
                }
            } else {
                // The picker was dismissed with no selected file
                console.log("Operation cancelled.");
            }
        });
    }

    function databaseWrite(id, path) {
        // Put data from let's to database - "user"
        // _id = File name
        // path = Absoulte file path
        // if file success added create div in app
        Databases.userDB().put({
            _id: `${id}`,
            path: `${path}`
        }).then(function (response) {
            console.log("response_id: " + response.id);
        }, function (err) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Cannot add data to DB 'user'" +
            "; Status: " + err.name + "; Message: " + err.message, "Error: " + err.status);

            messageDialog.showAsync();
        });
    }

    function databaseRead() {
        Databases.userDB().query(function (doc, emit) {
            emit(doc.name);
        }).then(function (result) {
            let list = document.getElementById("browser-window");
            let file;

            for (let i = 0; i < result.rows.length; i++) {
                div.innerHTML = result.rows[i].id; // get id from all db (very slow)

                list.appendChild(div);
            }
        }).catch(function (err) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Error read data" + err);
            messageDialog.showAsync();
        });
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
        storageFileArr: storageFileArr
    });
})();