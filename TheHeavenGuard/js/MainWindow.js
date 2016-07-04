(function () {
    "use strict";

    let app = WinJS.Application;
    let activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize your application here.
            } else {
                // TODO: This application was suspended and then terminated.
                // To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
            }

            args.setPromise(WinJS.UI.processAll().then(function completed() {
                let syncBtn = document.getElementById("startSyncBtn");
                syncBtn.addEventListener("click", BackgroundTransfer.init, false); // start sync files

                // Init Additional files
                SettingsPage.init();
                AuthPanel.init();
                FileBrowser.init();

                //// DestroyDB button
                //let dstUserDB = document.getElementById("destroyUserDB");
                //dstUserDB.addEventListener("click", Databases.destroyUserDB, false);
            }));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();

    // Function renderPivotItems create dynamically PivotItems in Pivot Menu
    // pivotName - set displayed menu name
    // pagePth - set pth of html page 
    function renderPivotItems(pivotName, pagePath) {
        let pivot = document.getElementById("pivot").winControl;
        let pivotItem = new WinJS.UI.PivotItem(document.createElement("div"), { isHeaderStatic: true, header: pivotName });
        let pivotItemContent = pivotItem.element.querySelector(".win-pivot-item-content");

        WinJS.UI.Pages.render(pagePath, pivotItemContent);

        return pivot.items.push(pivotItem);
    }

    WinJS.Namespace.define("MainWindow", {
            renderPivotItems: renderPivotItems
    }); // define parent
})();