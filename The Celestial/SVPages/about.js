﻿(function () {
    'use strict';

    WinJS.UI.Pages.define("/SVPages/about.html", {
        ready: function () {
            let back = document.getElementById("back");
            back.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/SVSettings.html");
            });
        }
    });
})();