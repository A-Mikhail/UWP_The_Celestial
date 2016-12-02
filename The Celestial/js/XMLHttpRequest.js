(function () {
    "use strict";

    let url;
    let baseUrl = googleConfig.baseUrl;

    function getUser(token) {
        let headers = {
            Authorization: `Bearer ${token}`
        };

        url = dropboxConfig.rpcEndpoints + "/2/users/get_account";

        return WinJS.xhr({
            url: url,
            headers: headers
        }).then(function (x) { return JSON.parse(x.response); });
    }

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

    WinJS.Namespace.define("AuthenticationBroker", {
        toUrl: WinJS.Binding.converter(function (url) {
            return `url('${url}')`;
        })
    });

    // Define XHR as global file
    WinJS.Namespace.define("XHR", {
        getAbout: getAbout,
        getFiles: getFiles,
        getUser: getUser
    });
})();