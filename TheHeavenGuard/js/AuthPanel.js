(function () {
    "use strict";

    // Function init() - main function which contains eventListeners and function calls
    function init() {
        //let authGoogleBtn = document.getElementById("googleDriveBtn");
        //authGoogleBtn.addEventListener("click", googleDriveAuth, false);

        let panelBtn = document.getElementById("hamburgerBtn");
        panelBtn.addEventListener("click", minimizedPanel, false);

        // Create Buttons for panel
        createButton();

        // Initialize popup menu on all button from auth panel
        let buttons = document.querySelectorAll(".auth-panel-btn");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("contextmenu", buttonMenu, false);
        }
    }

    class Button {
        constructor(title, order, status) {
            this.title = title;
            this.order = order;
            this.status = status;
        }

        create() {
            let panel = document.getElementById("authPanel");

            if (this.status === true && this.oder !== Number.isInteger) {
                let elementButton = document.createElement("button");
                let elementImg = document.createElement("img");
                let elementP = document.createElement("p");

                elementButton.className = "auth-panel-btn win-button";
                elementButton.id = `btn-${this.title}`;

                elementImg.src = "../img/THG-avatar.png";
                elementImg.className = "cloud-avatar img-circle";

                elementP.className = "auth-btn-text";
                elementP.innerText = this.title;

                panel.appendChild(elementButton);
                elementButton.appendChild(elementImg);
                elementButton.appendChild(elementP);

            } else if (this.status === false && this.order !== Number.isInteger) {
                return panel.removeChild(elementButton); // Wirte correct remove function
            } else {
                let messageDialog = new Windows.UI.Popups.MessageDialog("Error while create button");
                messageDialog.showAsync();
            }
        }
    }

    function createButton() {
        return new Promise(function (done, error) {
            let createButton = [
                new Button("Google Drive", 0, true),
                new Button("Dropbox", 1, true),
                new Button("OneDrive", 2, true)
            ];

            for (let i = 0; i < createButton.length; i++) {
                done(createButton[i].create());
            }
        });
    }

    // Function connectionStatus() - display on the button if current status online or offline update status each 15 minutes 
    function connectionStatus(status) { // send or get status from xhr with response answer
        // Get buttons
        let googleDriveBtn = document.getElementById("googleDriveBtn");
        let oneDriveBtn = document.getElementById("oneDriveBtn");

        if (status != 0) {
            console.log("status is not 0 = " + status[0]);
        } else {
            console.log("status is 0");
        }
    }

    function googleDriveAuth(event) {
        let oauth = new GoogleDrive.oauth();
        let googleIdArray = [];
        let googleDriveTextBtn = document.getElementById("googleDriveTextBtn");
        let googleDriveAvatar = document.getElementById("googleDriveAvatar");
        let output = document.getElementById("output");

        if (GoogleDrive.authenticate != 0) {
            oauth.connect().then(function (token) {
                MainWindow.renderPivotItems("Google Drive", "/html/GoogleDrive.html"); // render PivotItem before get any results

                XHR.getFiles(token.access_token).then(function (result) {
                    for (let i = 0; i < result.files.length; i++) {
                        output.innerHTML += result.files[i].name + "\r"; // Get All files
                    }
                });

                XHR.getAbout(token.access_token).then(function (result) {
                    console.log("The Result = " + result);

                    googleDriveTextBtn.innerText = result.user.displayName; // Get User Name
                    googleDriveAvatar.src = result.user.photoLink; // Get User Photo

                    // Information from get response receive in Kib format
                    document.getElementById("storageQuota").innerHTML = result.storageQuota.limit / 1024 / 1024 + " GB"; // Google Drive limit
                    document.getElementById("usage").innerHTML = result.storageQuota.usage / 1024 / 1024 + " GB"; // Usage memory now in all places (Gmail, Image, Gdrive)
                });

            },
            function (reject) {
                console.log("Auth was dissmised" + reject);

            });
        } else {
            this.removeEventListener("click", googleDriveAuth, false); // remove click event listener

            console.log("second time");
        }
    }

    // Function buttonMenu() - add popups window called on the right click which include additional options
    // onRemove - remove button from authPanel
    // onRename - rename button name
    // onLogOut - logout from current account (i.event. delete data from password vault)
    function buttonMenu(event) {
        let menu = new Windows.UI.Popups.PopupMenu();

        menu.commands.append(new Windows.UI.Popups.UICommand("Up", onUp));
        menu.commands.append(new Windows.UI.Popups.UICommand("Down", onDown));
        menu.commands.append(new Windows.UI.Popups.UICommandSeparator);
        menu.commands.append(new Windows.UI.Popups.UICommand("Remove", onRemove));
        menu.commands.append(new Windows.UI.Popups.UICommand("Log out", onLogOut));

        menu.showAsync({ x: event.clientX, y: event.clientY })
            .done(function (invokeCommand) {
                if (invokeCommand === null) {

                }
            });
    }

    function onUp() {

    }

    function onDown() {

    }

    function onRemove() {

        console.log("remove");
    }

    function onLogOut() {
        let textBtn = document.getElementsByClassName("auth-btn-text")

        textBtn.innerText = "Google Drive";

        console.log("log out");
    }

    // Function minimizedPanel() - minimize left panel by click
    // need to remember this value for resume event
    function minimizedPanel() {
        let mainPageMinimized = document.getElementById("mainPage");

        mainPageMinimized.className = (mainPageMinimized.className == "minimized-panel") ? "main-page" : "minimized-panel"; // minimize pannel
    }

    WinJS.Namespace.define("AuthPanel", {
        init: init,
        connectionStatus: connectionStatus
    });
})();