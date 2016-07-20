(function () {
    "use strict";

    // Global variables
    let baseUrl = googleConfig.baseUrl;
    let url;

    function getFiles(token) {
        let headers = {
            Authorization: `Bearer ${token}`
        };

        url = baseUrl + "/files";

        return WinJS.xhr({
            url: url,
            headers: headers
        }).then(function (x) { return JSON.parse(x.response); });
    }

    function getAbout(token) {
        let headers = {
            Authorization: `Bearer ${token}`
        };

        url = baseUrl + "/about?fields=user, storageQuota";

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
    WinJS.Namespace.define("XHR", {
        getAbout: getAbout,
        getFiles: getFiles
    });
})();