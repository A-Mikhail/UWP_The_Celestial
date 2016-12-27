(function () {
    'use strict';

    let messageDialog;

    WinJS.UI.Pages.define("/html/DetailedFilesManager.html", {
        ready: function (element, options) {
            WinJS.UI.processAll().then(function () {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().title = "Files Manager";
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