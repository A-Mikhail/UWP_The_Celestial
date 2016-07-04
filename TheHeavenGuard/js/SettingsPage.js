(function () {
    "use strict";

    function init() {
        MainWindow.renderPivotItems("Settings", "/html/Settings.html"); // render PivotItem before get any results
    }

    WinJS.Namespace.define("SettingsPage", {
        init: init
    });
})();