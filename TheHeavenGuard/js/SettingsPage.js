(function () {
    "use strict";

    // Function init() - main function which contains eventListeners and function calls
    function init() {
        MainWindow.renderPivotItems("Settings", "/html/Settings.html").then(function (response) { // !Error throw on this moment
            let dstUserDbBtn = document.getElementById("destroyUserDB");
            dstUserDbBtn.addEventListener("click", Databases.destroyUserDB, false); // detele user database
        }, function (error) {
            console.log("Failed!", error); // if error executed show to user and try to restart function
        });
    }

    WinJS.Namespace.define("SettingsPage", {
        init: init
    });
})();