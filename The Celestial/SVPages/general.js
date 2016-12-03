(function () {
    'use strict';

    // Save all app settings in to storage
    let applicationData = Windows.Storage.ApplicationData.current;
    let roamingSettings = applicationData.roamingSettings;

    WinJS.UI.Pages.define("/SVPages/general.html", {
        ready: function () {
            let back = document.getElementById("back");
            back.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/SVSettings.html");
            });

            let dstUserDb = document.getElementById("destroyUserDB");
            dstUserDb.addEventListener("click", function () { Databases.destroyUserDB() }, false);

            let toggleCredential = document.getElementById("winCredentialToggle").winControl;

            if (roamingSettings.values["passwordProtection"] === "enabled") {
                toggleCredential.checked = true;
            } else {
                toggleCredential.checked = false;
            }
        }
    });

    function toggleCredential() {
        let toggleCredential = document.getElementById("winCredentialToggle").winControl;

        if (toggleCredential.checked === true) {
            roamingSettings.values["passwordProtection"] = "enabled";
        } else {
            roamingSettings.values["passwordProtection"] = "disabled";
        }
    }

    WinJS.Utilities.markSupportedForProcessing(toggleCredential);

    WinJS.Namespace.define("General", {
        toggleCredential: toggleCredential
    });
})();