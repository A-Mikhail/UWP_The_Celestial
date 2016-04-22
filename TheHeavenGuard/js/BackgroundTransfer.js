(function () {
    "use strict";

    function init() {
        Windows.Networking.BackgroundTransfer.BackgroundUploader.getCurrentUploadsAsync().then(function (uploads) {
            printLog("Start Upload.<br/>");

            var upload = new UploadOperation();

            var baseUrl = googleConfig.baseUrl;
            var url = baseUrl + "/upload/drive/v3/files?uploadType=multipart";

            Databases.userDB().query(function (doc, emit) {
                emit(doc.path);
            }).then(function (result) {
                var fileName = result.rows[0].id; // File Name

                upload.start(url, fileName);
            });

            console.log("storageFile from FileSystem file: " + FileSystem.storageFileArr);
            
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

        function uploadFiles(token) {
            var headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/related; boundary=foo_bar_baz",
                "Content-Length": `${number}`
            };

            var url = baseUrl + "/upload/drive/v3/files?uploadType=multipart";

            var dataParams = dataFromDB; // :C

            return WinJS.xhr({
                type: "POST",
                url: url,
                data: dataParams,
                headers: headers,
                // Example of name request - name: `${BackgroundTransfer.name}`
            }).then(function (x) { return JSON.parse(x.response); });
        }

        this.start = function (uri, fileName) {
            printLog("Using URI: " + uri + "<br/>");

            var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();
            var uploadURI = new Windows.Foundation.Uri(uri); 
            var storageFile = FileSystem.storageFileArr[0]; // Get first storageFile for send

            // Set a header, so the server can save the file (configuration for Google Disc).
            uploader.setRequestHeader("Authorization", `Bearer ${token}`); // authorization token
            uploader.setRequestHeader("Content-Type", "multipart/related; boundary=foo_bar_baz"); 
            uploader.setRequestHeader("Content-Length", `${storageFile.length}`); // File size

            // Create a new upload operation.
            upload = uploader.createUpload(uploadURI, storageFile);

            // Start the upload and persist the promise to be able to cancel the upload.
            promise = upload.startAsync().then(complete, error, progress);
        };

        this.startMultipart = function (uri, files) {
            printLog("Using URI:" + uri.absoluteUri + "<br/>");

            var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();
            var contentParts = [];

            files.forEach(function (file, index) {
                var part = new Windows.Networking.BackgroundTransfer.BackgroundTransferContentPart("File" + index, file.name);
                part.setFile(file);
                contentParts.push(part);
            });

            // Create a new upload operation
            uploader.createUploadAsync(uri, contentParts).then(function (uploadOperation) {
                // Start the upload and persist the promise to be able to cancel the upload.
                upload = uploadOpertion;
                promise = uploadOperation.startAsync().then(complete, error, progress);
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
            displayStatus("Completed: " + uploaded.guid + ", Status Code: " + upload.getResponseInformation().statusCode);
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