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
                var splitView = document.querySelector(".splitView").winControl;
                var host = document.querySelector("#app");

                // Temporary workaround: Draw keyboard focus visuals on NavBarCommands
                new WinJS.UI._WinKeyboard(splitView.paneElement);

                var syncBtn = document.getElementById("startSync-btn");
                syncBtn.addEventListener("click", BackgroundTransfer.init, false); // start sync files

                // NavBar Clouds button
                var authBtn = document.getElementById("gdrive-btn");
                authBtn.addEventListener("click", googleDriveAuth, false);

                // Init Additional files
                FileSystem.init();
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
        console.log("Stage One - Push the button");

        var oauth = new GoogleDrive.oauth();
        var googleIdArray = [];

        oauth.connect().then(function (token) {
            Xhr.getFiles(token.access_token).then(function (result) {
                for (let i = 0; i < result.files.length; i++) {
                    document.getElementById("output").innerHTML += result.files[i].name + "\r"; // Get All files

                    document.getElementById("icon").innerHTML += result.files[i].createdTime + "\r"; // Put all files into DB or object or array
                }
            });

            Xhr.getAbout(token.access_token).then(function (result) {
                document.getElementById("user").innerHTML = result.user.displayName; // Get User Name
                document.getElementById("userImage").src = result.user.photoLink; // Get User Photo

                // Information from get response receive in Kib format
                document.getElementById("storageQuota").innerHTML = result.storageQuota.limit / 1024 / 1024 + " GB"; // Google Drive limit
                document.getElementById("usage").innerHTML = result.storageQuota.usage / 1024 / 1024 + " GB"; // Usage memory now in all places (Gmail, Image, Gdrive)
            })
        });
    }

    WinJS.Namespace.define("MainWindow"); // define parent
})();