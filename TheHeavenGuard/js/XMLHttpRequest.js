(function () {
    "use strict";

    // Global variables
    let baseUrl = googleConfig.baseUrl;

    function getFiles(token) {
        let headers = {
            Authorization: `Bearer ${token}`
        };

        let url = baseUrl + "/files";

        return WinJS.xhr({
            url: url,
            headers: headers
        }).then(function (x) { return JSON.parse(x.response); });
    }

    function getAbout(token) {
        let headers = {
            Authorization: `Bearer ${token}`
        };

        let url = baseUrl + "/about?fields=user, storageQuota";

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