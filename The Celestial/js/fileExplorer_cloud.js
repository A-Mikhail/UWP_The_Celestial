/// <reference path="database.js" />
(function () {
    "use strict";

    function init(id) {
        switch (id) {
            case "Dropbox":
                console.log("this is dropbox");
                break;
            case "Google Drive":
                authGoogleDrive();
                break;
            case "Test":
                buttonTest();
                break;
            case "ButtonTest":
                buttonTest();
                break;
            default:
                console.log("undefined parameter");
        }
    }

    function buttonTest() {
        Database.generateItems("user", true, "Programming");
    }
 
    function authGoogleDrive() {
        let auth = googleConfig.auth,
            oauthUrl = googleConfig.oauthUrl,
            clientId = googleConfig.clientId,
            clientSecret = googleConfig.clientSecret,
            scopes = googleConfig.scopes;

        let oauth = new AuthenticationBroker.Authentication("Google Drive", auth, oauthUrl, clientId, clientSecret, scopes).connect().then(function (token) {
            XHR.getFiles(token.access_token).then(function (result) {
                for (let i = 0; i < result.files.length; i++) {
                    output.innerText += result.files[i].name + "\r"; // Get All files
                }
            });

            XHR.getAbout(token.access_token).then(function (result) {
                // Apply received user name to the button text
                elementText[0].innerText = result.user.displayName;

                // Apply received user avatar to the button img
                elementImage[0].src = result.user.photoLink;

                // Information from get response receive in Kib format
                // result.storageQuota.limit; // Google Drive limit
                // result.storageQuota.usage; // Usage memory in all places (Gmail, Image, Gdrive)
            });
        });
    }

    WinJS.Namespace.define("FileExplorerCloud", {
        init: init
    });
})();