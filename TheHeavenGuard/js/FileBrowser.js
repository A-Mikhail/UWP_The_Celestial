(function () {
    "use strict";

    // Global Variables
    var messageDialog;
    var storageFileArr = [];

    var div = document.createElement('div'); // create <div> container
    var li  = document.createElement('li'); // create <li>

    function init() {
        // Drag and Drop
        var dropbox = document.getElementById("file-browser");
        dropbox.addEventListener("dragenter", dragenter, false);
        dropbox.addEventListener("dragover", dragover, false);
        dropbox.addEventListener("drop", drop, false);

        // File choose button
        var chFilesBtn = document.getElementById("toolbar-btn-add");
        chFilesBtn.addEventListener("click", chooseFiles, false);

        databaseRead(); // add data from DB to app
    }

    function dragenter(event) {
        event.dataTransfer.setData('text', event.target.textContent);

        doNothing(event);
    }

    function dragover(event) {
        doNothing(event);
    }

    // Function drop
    // get files attributes and create files or folders on file browser window
    function drop(event) {
        doNothing(event);

        var fileList = event.dataTransfer.files;

        if (!fileList) {
            return;
        }

        var fileCount = fileList.length;

        if (fileCount > 0) {
            var list = document.getElementById("browser-window");
            var fileName,
                fileType,
                filePath,
                fileModified;

            for (var i = 0; i < fileCount; i++) {
                fileName = fileList[i].name + "\n"; // get fileName
                fileType = fileList[i].type; // show mime-type 
                filePath = event.dataTransfer.items[i].fullPath; // show path
                fileModified = fileList[i].lastModifiedDate.toLocaleDateString();

                div.id = "fileN" + i;

                div.innerHTML = fileName;

                list.appendChild(div);

                var messageDialog = new Windows.UI.Popups.MessageDialog("File name: " + fileName + 
                    " file type: " + fileType + 
                    " path: " + filePath +
                    " file last modified: " + fileModified);

                messageDialog.showAsync();
            }
        }

        updateSize(event); // show size of current file
    }

    function doNothing(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // Progress bar shows current progress of events in animation line
    function progressBar() {
        var pBar = document.getElementById("progressBar");

        pBar.style = "display: block;";
    }

    // Function createFilesOrFolders 
    // Create file or folder by extension type inside broser-window
    // Create <div> inside <li> for grid display
    function createFilesOrFolders() {
        var browserWindow = document.getElementById("browser-window");
        
        if (file) {
            browserWindow.appendChild(fileType);
        } else if (folder) {
            browserWindow.appendChild(folderType);
        } else {
            browserWindow.appendChild(unknownType);
        }
    }

    // Button for non-work situation drag n' drop
    function chooseFiles(event) {
        // Verify that we are currently not snapped, or that we can unsnap to open the picker
        var currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
            !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
            // Fail silently if we can't unsnap
            return;
        }

        var openPicker = new Windows.Storage.Pickers.FileOpenPicker();
        openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
        openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        openPicker.fileTypeFilter.replaceAll(["*"]);

        var value,
            attributes,
            path;

        openPicker.pickMultipleFilesAsync().then(function (files) {


            if (files.size > 0) {
                // Application now has read/write access to the picked file(s)
                var outputString;

                for (var i = 0; i < files.size; i++) {
                    // Send array of choosen files to global 
                    storageFileArr.push(files[i]);

                    console.log("wich format? : " + files[i]);

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
        // Put data from var's to database - "user"
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
            var list = document.getElementById("browser-window");
            var file;

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
        var nBytes = 0,
            oFiles = event.dataTransfer.files,
            nFiles = oFiles.length;

        for (var nFileId = 0; nFileId < nFiles; nFileId++) {
            nBytes += oFiles[nFileId].size;
        }

        var sOutput = nBytes + " bytes";

        for (var aMultiples = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
            sOutput = nApprox.toFixed(3) + " " + aMultiples[nMultiple] + " (" + nBytes + " bytes)";
        }

        console.log("Drag and Drop: " + " size: " + sOutput);
        console.log("Drag and Drop: " + " count: " + nFiles);
    }
    
    console.log("Out:" + storageFileArr);

    WinJS.Namespace.define("FileBrowser", {
        init: init,
        storageFileArr: storageFileArr
    });
})();