(function () {
    "use strict";

    function init() {
        Windows.Networking.BackgroundTransfer.BackgroundUploader.getCurrentUploadsAsync().then(function (uploads) {
            var upload = new UploadOperation();

            var url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

            if (FileBrowser.storageFileArr == 0) {
                var messageDialog = new Windows.UI.Popups.MessageDialog("Add file to your sync library");
                messageDialog.showAsync();
            } else {
                upload.startMultipart(url);
            }

            // If uploads from previous application state exist, reassign callback and persist to global array.
            for (var i = 0; i < uploads.size; i++) {
                upload.load(uploads[i]);
                uploadOperations.push(upload);
            }
        });
    }

    // Global array used to persist operations.
    var uploadOperations = [];

    var maxUploadFileSize = 100 * 1024 * 1024; // TODO: Change 100 MB file limit to cload's file limit

    // Class associated with each upload.
    function UploadOperation() {
        console.log("Start Upload Operation");

        var upload = null;
        var promise = null;

        this.startMultipart = function (url) {
            var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();
            var uploadURI = new Windows.Foundation.Uri(url);
            
            var storageFile = FileBrowser.storageFileArr; // Get storageFile for send

            var oauth = new GoogleDrive.oauth();

            // Boundary
            var str = storageFile[0].displayName;
            var boundary = str.replace(/[^\da-zA-Z0-9]/g, ''); // start|middle boundary
            
            console.log(boundary);

            var contentParts = [];
            
            storageFile.forEach(function (file, index) {
                var partHeader = new Windows.Networking.BackgroundTransfer.BackgroundTransferContentPart();
                var part = new Windows.Networking.BackgroundTransfer.BackgroundTransferContentPart("File" + index, file.name);

                partHeader.setHeader("Content-Type", "application/json; charset=UTF-8");
                partHeader.setText('{' + '\r "name" ' + ' : ' + `"${file.displayName}" \r` + '}');
                
                part.setHeader("Content-Type", file.contentType);
                part.setFile(file);

                //contentParts.push(partHeader, part);
                contentParts.push(partHeader);
                contentParts.push(part);
            });

            oauth.connect().then(function (token) {
                uploader.setRequestHeader("Authorization", `Bearer ${token.access_token}`); // authorization token
                uploader.setRequestHeader("Content-Type", "multipart/related; boundary=" + boundary); // header boundary

                // Create a new upload operation
                uploader.createUploadAsync(uploadURI, contentParts, "related", `${boundary}`).then(function (uploadOperation) {
                    // Start the upload and persist the promise to be able to cancel the upload.
                    upload = uploadOperation;
                    promise = uploadOperation.startAsync().then(complete, error, progress);
                });
            });
        };

        // On application activation, reassign callback for a upload
        // operation persisted from previous application state.
        this.load = function (loadedUpload) {
            upload = loadedUpload;
            printLog("Found upload: " + upload.guid + " from previous application run. <br\>");
            promise = upload.attachAsync().then(complete, error, progress);
        };

        // Cancel upload.
        this.cancel = function () {
            if (promise) {
                promise.cancel();
                promise = null;

                printLog("Canceling upload: " + upload.guid + "<br\>");
            } else {
                printLog("Upload " + upload.guid + " already canceled.<br\>");
            }
        };

        // Returns true if this is the upload identified by the guid.
        this.hasGuid = function (guid) {
            return upload.guid === guid;
        };

        // Removes upload operation from global array.
        function removeUpload(guid) {
            uploadOperations.forEach(function (operation, index) {
                if (operation.hasGuid(guid)) {
                    uploadOperations.splice(index, 1);
                }
            });
        }

        // Progress callback
        function progress() {
            // Output all attributs of the progress parameter.
            printLog(upload.guid + " - Progress: ");

            var currentProgress = upload.progress;

            for (var att in currentProgress) {
                printLog(att + ": " + currentProgress[att] + ", ");
            }

            printLog("<br/>");

            // Handle various pause status conditions. This will never happen when using POST verb (the default)
            // but may the using PUT. Application can change verb used by using method property of BackgroundUploader class.
            if (currentProgress.status === Windows.Networking.BackgroundTransfer.BackgroundTransferStatus.pausedCostedNetwork) {
                printLog("Upload " + upload.guid + " paused because of costed network <br\>");
            } else if (currentProgress.status === Windows.Networking.BackgroundTransfer.BackgroundTransferStatus.pausedNoNetwork) {
                printLog("Upload " + upload.guid + " paused because network is unavailable. <br\>");
            }
        }

        // Completion callback.
        function complete() {
            removeUpload(upload.guid);

            printLog(upload.guid + " - upload complete. Status code: " + upload.getResponseInformation().statusCode + "<br/>");
            displayStatus("Completed: " + upload.guid + ", Status Code: " + upload.getResponseInformation().statusCode);
        }

        // Error callback.
        function error(err) {
            if (upload) {
                removeUpload(upload.guid);

                printLog(upload.guid + " - upload completed with error. <br/>");
            }

            displayException(err);
        }
    }

    function displayException(err) {
        var message;

        if (err.stack) {
            message = err.stack;
        } else {
            message = err.message;
        }

        var errorStatus = Windows.Networking.BackgroundTransfer.BackgroundTransferError.getStatus(err.number);

        console.log("Status of error: " + errorStatus);

        if (errorStatus === Windows.Web.WebErrorStatus.cannotConnect) {
            message = "App cannot connected. Network may be down, connection was refused or the host is unreachable.";
        }

        displayError(message);
    }

    function displayError(/*@type(String)*/message) {
        WinJS.log && WinJS.log(message, "sample", "error");
    }

    function displayStatus(/*@type(String)*/message) {
        WinJS.log && WinJS.log(message, "sample", "status");
    }

    // Print helper function.
    function printLog(/*@type(String)*/txt) {
        var console = document.getElementById("outputConsole");
        console.innerHTML += txt;
    }

    function id(elementId) {
        return document.getElementById(elementId);
    }

    function uploadMultipleFilesAsync(uri, files) {
        var promise = validateFilesAsync(files);

        if (!promise) {
            return;
        }

        return promise.then(function (validatedFiles) {
            if (!validatedFiles) {
                return;
            }

            var upload = new UploadOperation();
            upload.startMultipart(uri, validatedFiles);

            // Persist the upload operation in the global array.
            uploadOperations.push(upload);
        });
    }

    function validateFilesAsync(files) {
        if (files.size == 0) {
            displayError("Error: No file selected");
            return;
        }

        var getPropertiesPromises = [];
        var totalFileSize = 0;

        // Get file size of all files. if the sum exceeds the maximum upload size, return null to indicate
        // invalid files.
        files.forEach(function (file, index) {
            getPropertiesPromises.push(file.getBasicPropertiesAsync().then(function (properties) {
                totalFileSize += properties.size;
            }));
        });

        return WinJS.Promise.join(getPropertiesPromises).then(function () {
            if (totalFileSize > maxUploadFileSize) {
                displayError("Size of selected files exceeds max. upload file size (" + (maxUploadFileSize / (1024 * 1024)) + "MB).");

                return null;
            }

            return files;
        });
    }

    // Cancel all uploads.
    function cancelAll() {
        for (var i = 0; i < uploadOperations.length; i++) {
            uploadOperations[i].cancel();
        }
    }

    WinJS.Namespace.define("BackgroundTransfer", {
        init: init
    });
})();