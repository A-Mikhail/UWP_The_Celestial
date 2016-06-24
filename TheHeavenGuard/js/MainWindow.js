(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize your application here.
            } else {
                // TODO: This application was suspended and then terminated.
                // To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
            }

            args.setPromise(WinJS.UI.processAll().then(function completed() {
                var syncBtn = document.getElementById("start-sync-btn");
                syncBtn.addEventListener("click", BackgroundTransfer.init, false); // start sync files

                // NavBar Clouds button
                var authBtn = document.getElementById("google-drive-btn");
                authBtn.addEventListener("click", googleDriveAuth, false);

                // DestroyDB button
                var dstUserDB = document.getElementById("destroyUserDB");
                dstUserDB.addEventListener("click", Databases.destroyUserDB, false);

                // Init Additional files
                FileBrowser.init();
            }));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();

    function googleDriveAuth(e) {
        var oauth = new GoogleDrive.oauth();
        var googleIdArray = [];

        oauth.connect().then(function (token) {
            Xhr.getFiles(token.access_token).then(function (result) {
                for (let i = 0; i < result.files.length; i++) {
                    document.getElementById("output").innerHTML += result.files[i].name + "\r"; // Get All files
                }
            });

            // When criteria is met...
            // Find the pivot in the DOM
            var pivot = document.getElementById("pivot").winControl;

            var pivotItem = new WinJS.UI.PivotItem(document.createElement("div"), { isHeaderStatic: true, header: 'Google Drive' });

            var pivotItemContent = pivotItem.element.querySelector(".win-pivot-item-content");

            WinJS.UI.Pages.render("/html/GoogleDrive.html", pivotItemContent);

            // Add new PivotItem
            // You could use other things like splice to add it to a specific index etc.
            pivot.items.push(pivotItem);

            Xhr.getAbout(token.access_token).then(function (result) {
                document.getElementById("google-drive-btn-text").innerText = result.user.displayName; // Get User Name
                document.getElementById("google-drive-avatar").src = result.user.photoLink; // Get User Photo

                // Information from get response receive in Kib format
                document.getElementById("storageQuota").innerHTML = result.storageQuota.limit / 1024 / 1024 + " GB"; // Google Drive limit
                document.getElementById("usage").innerHTML = result.storageQuota.usage / 1024 / 1024 + " GB"; // Usage memory now in all places (Gmail, Image, Gdrive)
            })
        });
    }

    WinJS.Namespace.define("MainWindow"); // define parent
})();