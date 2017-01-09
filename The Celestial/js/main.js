(function () {
    "use strict";

    let app = WinJS.Application;
    let activation = Windows.ApplicationModel.Activation;
    let background = Windows.ApplicationModel.Background;

    let isFirstActivation = true;

    // Save all app settings in to storage
    let applicationData = Windows.Storage.ApplicationData.current;
    let roamingSettings = applicationData.roamingSettings;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.voiceCommand) {
            // TODO: Handle relevant ActivationKinds. For example, if your app can be started by voice commands,
            // this is a good place to decide whether to populate an input field or choose a different initial view.
        }
        else if (args.detail.kind === activation.ActivationKind.launch) {
            // A Launch activation happens when the user launches your app via the tile
            // or invokes a toast notification by clicking or tapping on the body.
            if (args.detail.arguments) {
                // TODO: If the app supports toasts, use this value from the toast payload to determine where in the app
                // to take the user in response to them invoking a toast notification.
            }
            else if (args.detail.previousExecutionState === activation.ApplicationExecutionState.terminated) {
                // TODO: This application had been suspended and was then terminated to reclaim memory.
                // To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
                // Note: You may want to record the time when the app was last suspended and only restore state if they've returned after a short period.
            }
        }

        if (!args.detail.prelaunchActivated) {
            // TODO: If prelaunchActivated were true, it would mean the app was prelaunched in the background as an optimization.
            // In that case it would be suspended shortly thereafter.
            // Any long-running operations (like expensive network or disk I/O) or changes to user state which occur at launch
            // should be done here (to avoid doing them in the prelaunch case).
            // Alternatively, this work can be done in a resume or visibilitychanged handler.
        }

        if (isFirstActivation) {
            // TODO: The app was activated and had not been running. Do general startup initialization here.
            document.addEventListener("visibilitychange", onVisibilityChanged);
            args.setPromise(WinJS.UI.processAll().then(function () {
                // TODO: This application has been newly launched. Initialize your application here.
                let passwrodProtection = roamingSettings.values["passwordProtection"];
                let themeColor = roamingSettings.values["themeColor"];

                let head = document.getElementsByTagName("head")[0];
                let styleSheet = document.createElement("style");

                if (themeColor === "dark") {
                    // Create stylesheet 
                    styleSheet.id = "styleSheet";
                    styleSheet.rel = "stylesheet";

                    styleSheet.href = "/libs/Microsoft.WinJS.4.4/css/ui-dark.css";
                    styleSheet.appendChild(document.createTextNode(styleSheet));
                } else {
                    styleSheet.id = "styleSheet";
                    styleSheet.rel = "stylesheet";

                    styleSheet.href = "/libs/Microsoft.WinJS.4.4/css/ui-light.css";
                    styleSheet.appendChild(document.createTextNode(styleSheet));
                }

                // Check if password is turn on
                if (passwrodProtection !== "disabled") {
                    checkConsentAvailability();
                } else {
                    initializeApp();
                }
            }));
        }

        isFirstActivation = false;
    };

    function onVisibilityChanged(args) {
        if (!document.hidden) {
            // TODO: The app just became visible. This may be a good time to refresh the view.
        }
    }

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();

    function initializeApp() {
        // Load user depending information from js files
        FileBrowser.init();
        AuthPanel.init();

        // Start generate root items for listView
        Database.generateItems("root");
    }

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
                            initializeApp();

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
                            initializeApp();

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

    // Function renderPivotItems create dynamically PivotItems in Pivot Menu
    // pivotName - set displayed menu name
    // pagePath - set path of html page 
    function renderPivotItems(pivotName, pagePath, pivotType) {
        let pivot = document.getElementById("pivot").winControl;
        let pivotArray = pivot.items._getArray();
        let pivotHeader;

        for (let i = 0; i < pivotArray.length; i++) {
            pivotHeader = pivotArray.find(function (element) {
                return element.header === pivotName;
            });
        }

        if (!pivotHeader) {
            return new Promise(function (resolve, reject) {
                let createDiv = document.createElement("div");

                let pivotItem = new WinJS.UI.PivotItem(createDiv, { header: pivotName });
                let pivotItemContent = pivotItem.element.querySelector(".win-pivot-item-content");

                WinJS.UI.Pages.render(pagePath, pivotItemContent).then(function () {
                    resolve(pivot.items.push(pivotItem));
                });
            });
        } else {
            return;
        }
    }

    // Function removePivotItems get name of pivot and remove it from DOM and from pivot items array
    function removePivotItems(pivotName) {
        return new Promise(function (done, error) {
            let deletedItem;
            let pivot = document.getElementById("pivot").winControl.items;
            let pivotItem;

            pivot._keys.forEach(function (element) {
                pivotItem = pivot.getItemFromKey(element);

                if (pivotItem.data.header === pivotName) {
                    // release memory
                    pivotItem.data.dispose();

                    done(pivot.dataSource.remove(element));

                    // "normalize" _currentKey of items after deleting 
                    pivot._currentKey = pivot._lastNotifyLength;

                    // For Debug!
                    if (performance && performance.mark) {
                        performance.mark("Deleted pivot");
                    }
                }
            });
        });
    }

    WinJS.Namespace.define("main", {
        renderPivotItems: renderPivotItems,
        removePivotItems: removePivotItems
    });
})();