(function () {
    "use strict";


    function init() {
        let authGoogleBtn = document.getElementById("google-drive-btn");
        authGoogleBtn.addEventListener("click", googleDriveAuth, false);

        let panelBtn = document.getElementById("hamburger-btn");
        panelBtn.addEventListener("click", minimizedPanel, false);
    }

    function googleDriveAuth(e) {
        this.removeEventListener("click", googleDriveAuth, false); // remove click event listener

        let oauth = new GoogleDrive.oauth();
        let googleIdArray = [];

        oauth.connect().then(function (token) {
            Xhr.getFiles(token.access_token).then(function (result) {
                for (let i = 0; i < result.files.length; i++) {
                    document.getElementById("output").innerHTML += result.files[i].name + "\r"; // Get All files
                }
            });

            // When criteria is met...
            // Find the pivot in the DOM
            let pivot = document.getElementById("pivot").winControl;

            let pivotItem = new WinJS.UI.PivotItem(document.createElement("div"), { isHeaderStatic: true, header: 'Google Drive' });

            let pivotItemContent = pivotItem.element.querySelector(".win-pivot-item-content");

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

    // Function minimizedPanel - minimize left panel by click
    // need to remember this value to resume
    function minimizedPanel() {
        let mainPageMinimized = document.getElementById("mainPage");
        let text = document.getElementById("google-drive-btn-text");

        mainPageMinimized.style["-ms-grid-columns"] = (mainPageMinimized.style["-ms-grid-columns"] == "48px 4fr") ? "1fr 4fr" : "48px 4fr";

        text.style.display = (text.style.display == "none") ? "block" : "none";
    }

    WinJS.Namespace.define("AuthPanel", {
        init: init
    });
})();