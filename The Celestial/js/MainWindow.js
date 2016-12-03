(function () {
    "use strict";

    let app = WinJS.Application;
    let activation = Windows.ApplicationModel.Activation;
    let background = Windows.ApplicationModel.Background;

    // Save all app settings in to storage
    let applicationData = Windows.Storage.ApplicationData.current;
    let roamingSettings = applicationData.roamingSettings;

    let itemsSet = new Map();

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                WinJS.UI.processAll().then(function () {
                    // TODO: This application has been newly launched. Initialize your application here.
                    let passwrodProtection = roamingSettings.values["passwordProtection"];
                    let themeColor = roamingSettings.values["themeColor"];

                    let head = document.getElementsByTagName("head")[0];
                    let styleSheet = document.createElement("style");
                    
                    if (themeColor === "dark") {
                        // Create stylesheet 
                        styleSheet.id = "styleSheet";
                        styleSheet.rel = "stylesheet";

                        styleSheet.href = "/Microsoft.WinJS.4.4/css/ui-dark.css";
                        styleSheet.appendChild(document.createTextNode(styleSheet));
                    } else {
                        styleSheet.id = "styleSheet";
                        styleSheet.rel = "stylesheet";

                        styleSheet.href = "/Microsoft.WinJS.4.4/css/ui-light.css";
                        styleSheet.appendChild(document.createTextNode(styleSheet));
                    }

                    // Check if password is turn on
                    if (passwrodProtection !== "disabled") {
                        checkConsentAvailability();
                    } else {
                        // Load user depending information from js files
                        FileBrowser.init();
                        AuthPanel.init();
                    }
                });
            } else {
                // TODO: This application was suspended and then terminated.
                // To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
            }
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();

    function checkConsentAvailability() {
        try {
            Windows.Security.Credentials.UI.UserConsentVerifier.checkAvailabilityAsync()
            .then(function (consentAvailability) {
                switch (consentAvailability) {
                    case Windows.Security.Credentials.UI.UserConsentVerifierAvailability.available:
                        // Ask credential if available
                        secureUserData();
                        break;
                    case Windows.Security.Credentials.UI.UserConsentVerifierAvailability.deviceNotPresent:
                        console.log("No PIN or biometric found, INSTRUCTION! ask to set it up in windows setting");
                        break;
                    default:
                        console.log("Error of not currently unavailabe, send help");
                        break;
                }
            });
        }
        catch (error) {
            console.log("Error message: " + err.message, "sample", "error");
        }
    }

    function secureUserData() {
        try {
            let message = "Please provide your credentials";

            Windows.Security.Credentials.UI.UserConsentVerifier.requestVerificationAsync(message)
                .then(function (consentResult) {
                    switch (consentResult) {
                        // If credential was verified then loading user data
                        case Windows.Security.Credentials.UI.UserConsentVerificationResult.verified:
                            FileBrowser.init();
                            AuthPanel.init();

                            break;
                        case Windows.Security.Credentials.UI.UserConsentVerificationResult.deviceNotPresent:
                            console.log("No pin or some else found, please install one of them");
                            break;
                        case Windows.Security.Credentials.UI.UserConsentVerificationResult.canceled:
                            console.log("User consent verification canceled");
                            break;
                        default:
                            console.log("Error");
                            break;
                    }
                });
        }
        catch (error) {
            console.log("error ", +error.message);
        }
    }


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
                console.log("Error occured while creating the Item ", error);
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
                if (key[1] === pivotName) {
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