(function () {
    "use strict";

    // Get all cloud's in array, 
    function init() {
        let authGoogleBtn = document.getElementById("googleDriveBtn");
        authGoogleBtn.addEventListener("click", googleDriveAuth, false);

        let panelBtn = document.getElementById("hamburgerBtn");
        panelBtn.addEventListener("click", minimizedPanel, false);
    }

    function googleDriveAuth(e) {
        this.removeEventListener("click", googleDriveAuth, false); // remove click event listener

        MainWindow.renderPivotItems("Google Drive", "/html/GoogleDrive.html"); // render PivotItem before get any results

        let oauth = new GoogleDrive.oauth();
        let googleIdArray = [];

        oauth.connect().then(function (token) {
            Xhr.getFiles(token.access_token).then(function (result) {
                for (let i = 0; i < result.files.length; i++) {
                    document.getElementById("output").innerHTML += result.files[i].name + "\r"; // Get All files
                }
            });

            Xhr.getAbout(token.access_token).then(function (result) {
                document.getElementById("googleDriveTextBtn").innerText = result.user.displayName; // Get User Name
                document.getElementById("googleDriveAvatar").src = result.user.photoLink; // Get User Photo

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

        mainPageMinimized.className = (mainPageMinimized.className == "minimized-panel") ? "main-page" : "minimized-panel"; // minimize pannel
    }

    WinJS.Namespace.define("AuthPanel", {
        init: init
    });
})();