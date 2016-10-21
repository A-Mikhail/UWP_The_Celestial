(function () {
    'use strict';

    WinJS.UI.Pages.define("/SVFragments/about.html", {
        ready: function () {
            let back = document.getElementById("back");
            back.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/SVSettings.html");
            });
        }
    });
})();