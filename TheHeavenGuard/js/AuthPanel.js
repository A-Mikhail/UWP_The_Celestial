(function () {
    "use strict";


    function init() {
        var authGoogleBtn = document.getElementById("google-drive-btn");
        authGoogleBtn.addEventListener("click", googleDriveAuth, false);

    }

    function googleDriveAuth(e) {
        this.removeEventListener("click", googleDriveAuth, false); // remove click event listener

        var oauth = new GoogleDrive.oauth();
        var googleIdArray = [];

        oauth.connect().then(function (token) {
            Xhr.getFiles(token.access_token).then(function (result) {
                for (let i = 0; i < result.files.length; i++) {
                    document.getElementById("output").innerHTML += result.files[i].name + "\r"; // Get All files
                }
            });

            // When criteria is met...
            // Find the pivot in the DOM
            var pivot = document.getElementById("pivot").winControl;

            var pivotItem = new WinJS.UI.PivotItem(document.createElement("div"), { isHeaderStatic: true, header: 'Google Drive' });

            var pivotItemContent = pivotItem.element.querySelector(".win-pivot-item-content");

            WinJS.UI.Pages.render("/html/GoogleDrive.html", pivotItemContent);

            // Add new PivotItem
            // You could use other things like splice to add it to a specific index etc.
            pivot.items.push(pivotItem);

            Xhr.getAbout(token.access_token).then(function (result) {
                document.getElementById("google-drive-btn-text").innerText = result.user.displayName; // Get User Name
                document.getElementById("google-drive-avatar").src = result.user.photoLink; // Get User Photo

                // Information from get response receive in Kib format
                document.getElementById("storageQuota").innerHTML = result.storageQuota.limit / 1024 / 1024 + " GB"; // Google Drive limit
                document.getElementById("usage").innerHTML = result.storageQuota.usage / 1024 / 1024 + " GB"; // Usage memory now in all places (Gmail, Image, Gdrive)
            });
        });
    }

    WinJS.Namespace.define("AuthPanel", {
        init: init
    });
})();