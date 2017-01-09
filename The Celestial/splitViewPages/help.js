(function () {
    'use strict';

    WinJS.UI.Pages.define("/splitViewPages/help.html", {
        ready: function () {
            let back = document.getElementById("back");
            back.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/splitViewSettings.html");
            });
        }
    });
})();