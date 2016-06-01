(function () {
    "use strict";

    var messageDialog;
    var storageFileArr = [];
    
    function init() {
        // Drag and Drop
        var dropbox = document.getElementById("file-browser");
        dropbox.addEventListener("dragenter", dragenter, false);
        dropbox.addEventListener("dragover", dragover, false);
        dropbox.addEventListener("drop", drop, false);

        // File choose button
        var chFilesBtn = document.getElementById("toolbar-btn-add");
        chFilesBtn.addEventListener("click", chooseFiles, false);

        // DestroyDB button
        var dstUserDB = document.getElementById("destroyUserDB");
        dstUserDB.addEventListener("click", Databases.destroyUserDB, false);
        
        databaseRead(); // add data from DB to app
    }

    function dragenter(event) {
        event.dataTransfer.setData('text', event.target.textContent);

        doNothing(event);
    }

    function dragover(event) {
        doNothing(event);
    }

    function drop(event) {
        doNothing(event);

        var fileList = event.dataTransfer.files;

        if (!fileList) {
            return;
        }

        var fileCount = fileList.length;

        if (fileCount > 0) {
            var list = document.getElementById("list");
            var file,
                fileDiv;

            for (var i = 0; i < fileCount; i++) {
                file = event.dataTransfer.files[i].name + "\n"; // get fileName

                fileDiv = document.createElement('div'); // create Div on each element
                fileDiv.id = "fileN" + i;

                fileDiv.innerHTML = file;

                list.appendChild(fileDiv);

                console.log("file: " + file);
            }

            console.log("Item count: " + fileCount);
        }

        updateSize(event);
    }

    function doNothing(event) {
        event.stopPropagation();
        event.preventDefault();
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
                var outputString,
                    fileDiv;

                for (var i = 0; i < files.size; i++) {
                    // Send array of choosen files to global 
                    storageFileArr.push(files[i]);

                    outputString = files[i].name; // get name of the selected files
                    path = files[i].path; // get path of the selected files

                    fileDiv = document.createElement('div'); // create Div on each element
                    fileDiv.id = "fileNum_" + i; // <div id="fileNum_1..." />
                    fileDiv.className = "file";

                    fileDiv.innerHTML = outputString; // Name of added files
                    list.appendChild(fileDiv); // create div to selected file/folder

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
            var list = document.getElementById("list");
            var file,
                fileDiv;

            for (let i = 0; i < result.rows.length; i++) {
                fileDiv = document.createElement('div'); // create Div on each element
                fileDiv.innerHTML = result.rows[i].id; // get id from all db (very slow)

                list.appendChild(fileDiv);
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

    WinJS.Namespace.define("FileSystem", {
        init: init,
        storageFileArr: storageFileArr
    });
})();