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

                // DestroyDB button
                var dstUserDB = document.getElementById("destroyUserDB");
                dstUserDB.addEventListener("click", Databases.destroyUserDB, false);

                // Init Additional files
                AuthPanel.init();
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

    WinJS.Namespace.define("MainWindow"); // define parent
})();