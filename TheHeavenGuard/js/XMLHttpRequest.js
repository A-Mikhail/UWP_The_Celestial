// TODO: Add all XMR from project to this file
(function () {
    "use strict";

    // Global var
    var baseUrl = googleConfig.baseUrl;

    // Google XHR
    function GoogleXHR() {
        function uploadFiles(token) {
            var headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/related; boundary=foo_bar_baz",
                "Content-Length": `${number}`
            };

            var url = baseUrl + "/upload/drive/v3/files?uploadType=multipart HTTP/1.1";

            var dataParams = dataFromDB; // :C

            return WinJS.xhr({
                type: "POST",
                url: url,
                data: dataParams,
                headers: headers,
                // Example of name request - name: `${BackgroundTransfer.name}`
            }).then(function (x) { return JSON.parse(x.response); });
        }

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
    }


    WinJS.Namespace.define("GoogleDrive", {
        toUrl: WinJS.Binding.converter(function (url) {
            return `url('${url}')`;
        })
    });

    // Define XHR as global file
    WinJS.Namespace.define("XMLHttpRequest", {
        GoogleXHR: GoogleXHR
    });
})();