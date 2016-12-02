(function () {
    'use strict';

    WinJS.UI.Pages.define("/SVPages/general.html", {
        ready: function () {
            let back = document.getElementById("back");
            back.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/SVSettings.html");
            });

            let dstUserDb = document.getElementById("destroyUserDB");
            dstUserDb.addEventListener("click", function () { Databases.destroyUserDB() }, false);
        }
    });
})();