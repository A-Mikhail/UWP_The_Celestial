(function () {
    'use strict';

    let messageDialog;

    WinJS.UI.Pages.define("/html/fileExplorer_window.html", {
        ready: function (element, options) {
            WinJS.UI.processAll().then(function () {
                let pivotItem = document.getElementById("pivotItem").winControl;

                (window.addEventListener || window.attachEvent)(
                    (window.attachEvent && "on" || "") + "message", function (evt) {
                        let data = evt.data;

                        // Window title
                        Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = data;

                        pivotItem.header = data;

                        FileExplorer.init();

                        Database.generateItems("user", true, data);
                    },
                    false);

                // Completely close window and release resources after the window is closed.
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().addEventListener("consolidated", function () {
                    window.close();

                    // For Debug!
                    if (performance && performance.mark) {
                        performance.mark("fully ready new pivot");
                    }
                }, false);
            });
        }
    });
})();