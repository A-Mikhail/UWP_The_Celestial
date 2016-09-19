(function () {
    "use strict";

    let app = WinJS.Application;
    let activation = Windows.ApplicationModel.Activation;
    let background = Windows.ApplicationModel.Background;

    let itemsSet = new Map();

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize your application here.
            } else {
                // TODO: This application was suspended and then terminated.
                // To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
            }

            args.setPromise(WinJS.UI.processAll().then(function () {
                let syncBtn = document.getElementById("startSyncFilesBtn");
                syncBtn.addEventListener("click", BackgroundTransfer.init, false); // start sync files
                // Init Additional files
                FileBrowser.init();
                AuthPanel.init();
                SettingsPage.init();
            }));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();

    // Function pushItem() - set to the Map data key of Item and it's name - headerItems
    // try..catch need for skip error that occur when loop called number 1 which doesn't exist in PivotItems array
    function pushItems() {
        let pivotItems = document.getElementById("pivot").winControl.items;
        let keyItems, headerItems;

        for (let i = 0; i <= pivotItems.length; i++) {
            try {
                keyItems = pivotItems._keyMap[i].key;
                headerItems = pivotItems._keyMap[i].data._header;

                itemsSet.set(keyItems, headerItems);
            } catch (error) {

            }
        }
    }

    // Function renderPivotItems create dynamically PivotItems in Pivot Menu
    // pivotName - set displayed menu name
    // pagePath - set path of html page 
    function renderPivotItems(pivotName, pagePath) {
        return new Promise(function (resolve, reject) {
            let pivot = document.getElementById("pivot").winControl;

            let createDiv = document.createElement("div");
            createDiv.id = pivotName;

            let pivotItem = new WinJS.UI.PivotItem(createDiv, { isHeaderStatic: true, header: pivotName });
            let pivotItemContent = pivotItem.element.querySelector(".win-pivot-item-content");

            WinJS.UI.Pages.render(pagePath, pivotItemContent).then(function () {
                resolve(pivot.items.push(pivotItem));
            }, function (err) {
                reject(err);
            });
        });
    }

    // Function removePivotItems get name of pivot and remove it from DOM and from pivot items array
    function removePivotItems(pivotName) {
        return new Promise(function (done, error) {
            let pivotItems = document.getElementById("pivot").winControl.items;

            pushItems();

            for (let key of itemsSet.entries()) {
                if (key[1] == pivotName) {
                    done(pivotItems.dataSource.remove(`${key[0]}`));
                    itemsSet.delete(key[0]);

                    pivotItems._currentKey = pivotItems._lastNotifyLength; // "normalize" _currentKey of items after deleting 
                }
            }
        });
    }


    WinJS.Namespace.define("MainWindow", {
        renderPivotItems: renderPivotItems,
        removePivotItems: removePivotItems
    });
})();