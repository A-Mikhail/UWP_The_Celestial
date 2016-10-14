(function () {
    "use strict";

    function init() {
        // Display splitView 
        let splitView = document.getElementById("splitView").winControl;
        splitView.paneOpened = true;
    }

    WinJS.Namespace.define("SettingsPanel", {
        init: init
    });
})();