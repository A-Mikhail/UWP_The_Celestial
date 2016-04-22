// TODO: Add all XHR from project to this file
(function () {
    "use strict";

    // Global var
    var baseUrl = googleConfig.baseUrl;

    function getFiles(token) {
        var headers = {
            Authorization: `Bearer ${token}`
        };

        var url = baseUrl + "/files";

        return WinJS.xhr({
            url: url,
            headers: headers
        }).then(function (x) { return JSON.parse(x.response); });
    }

    function getAbout(token) {
        var headers = {
            Authorization: `Bearer ${token}`
        };

        var url = baseUrl + "/about?fields=user, storageQuota";

        return WinJS.xhr({
            url: url,
            headers: headers
        }).then(function (x) { return JSON.parse(x.response); });
    }

   WinJS.Namespace.define("GoogleDrive", {
        toUrl: WinJS.Binding.converter(function (url) {
            return `url('${url}')`;
        })
    });
    

    // Define XHR as global file
    WinJS.Namespace.define("Xhr", {
        getAbout: getAbout,
        getFiles: getFiles
    });
})();