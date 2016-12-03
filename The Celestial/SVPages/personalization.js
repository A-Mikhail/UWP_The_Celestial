(function () {
    'use strict';

    let applicationData = Windows.Storage.ApplicationData.current;
    let roamingSettings = applicationData.roamingSettings;

    WinJS.UI.Pages.define("/SVPages/personalization.html", {
        ready: function () {
            let back = document.getElementById("back");
            back.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/SVSettings.html");
            });
            
            let colorDarkModeRB = document.getElementById("colorDarkMode");
            let colorLightModeRB = document.getElementById("colorLightMode");

            colorDarkModeRB.addEventListener("click", function () { themeColor(this, this.value); }, false);
            colorLightMode.addEventListener("click", function () { themeColor(this, this.value); }, false);
        }
    });

    function themeColor(checked, value) {
        let styleSheet = document.getElementById("stylesheet");
        //let value = document.querySelector("[input=themeColor]").value;

        // Change loaded css style
        if (value === "dark") {
            styleSheet.href = "/Microsoft.WinJS.4.4/css/ui-dark.css";

            roamingSettings.values["themeColor"] = "dark";

            checked = true;
        } else {
            styleSheet.href = "/Microsoft.WinJS.4.4/css/ui-light.css";

            roamingSettings.values["themeColor"] = "light";

            checked = true;
        }
    }

})();