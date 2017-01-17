(function () {
    "use strict";

    // Save all app settings in to storage
    let applicationData = Windows.Storage.ApplicationData.current;
    let roamingSettings = applicationData.roamingSettings;

    WinJS.UI.Pages.define("/html/settings_about.html", {
        ready: function () {
            navigateBack();
        }
    });

    WinJS.UI.Pages.define("/html/settings_help.html", {
        ready: function () {
            navigateBack();
        }
    });

    WinJS.UI.Pages.define("/html/settings_general.html", {
        ready: function () {
            navigateBack();

            let dstUserDb = document.getElementById("destroyUserDB");
            dstUserDb.addEventListener("click", function () { Database.destroyDatabase("user"); }, false);

            let toggleCredential = document.getElementById("winCredentialToggle").winControl;

            if (roamingSettings.values["passwordProtection"] === "enabled") {
                toggleCredential.checked = true;
            } else {
                toggleCredential.checked = false;
            }
        }
    });

    WinJS.UI.Pages.define("/html/settings_personalization.html", {
        ready: function () {
            navigateBack();

            let colorDarkModeRB = document.getElementById("colorDarkMode");
            let colorLightModeRB = document.getElementById("colorLightMode");

            colorDarkModeRB.addEventListener("click", function () { themeColor(this, this.value); }, false);
            colorLightMode.addEventListener("click", function () { themeColor(this, this.value); }, false);
        }
    });

    function navigateBack() {
        let back = document.getElementById("back");
        back.addEventListener("click", function () {
            WinJS.Navigation.navigate("/html/splitViewSettings.html");
        });
    }

    function themeColor(checked, value) {
        let styleSheet = document.getElementById("stylesheet");
        //let value = document.querySelector("[input=themeColor]").value;

        // Change loaded css style
        if (value === "dark") {
            styleSheet.href = "/libs/WinJS.4.4/css/ui-dark.css";

            roamingSettings.values["themeColor"] = "dark";

            checked = true;
        } else {
            styleSheet.href = "/libs/WinJS.4.4/css/ui-light.css";

            roamingSettings.values["themeColor"] = "light";

            checked = true;
        }
    }

    function toggleCredential() {
        let toggleCredential = document.getElementById("winCredentialToggle").winControl;

        if (toggleCredential.checked === true) {
            roamingSettings.values["passwordProtection"] = "enabled";
        } else {
            roamingSettings.values["passwordProtection"] = "disabled";
        }
    }

    WinJS.Utilities.markSupportedForProcessing(toggleCredential);

    WinJS.Namespace.define("settingControl", {
        toggleCredential: toggleCredential
    });
})();