(function () {
    "use strict";

    // Globar variable
    let messageDialog;
    let PasswordVault = Windows.Security.Credentials.PasswordVault;

    // Varibale for class
    let defaultEventTimer,
        panel,
        pickedButton,
        buttons,
        undoPanel;

    WinJS.UI.Pages.define("/html/SVSettings.html", {
        ready: function (element, options) {
            let splitView = document.getElementById("splitView");

            // Open settings panel
            let settingsBtn = document.getElementById("settingsBtn");
            settingsBtn.addEventListener("click", (function () {
                splitView.winControl.paneOpened = true;
            }), false)

            let SVHelpCommand = document.getElementById("helpSVCommand");
            SVHelpCommand.addEventListener("click", (function () { console.log("help") }), false);

            let SVAboutCommand = document.getElementById("aboutSVCommand");
            SVAboutCommand.addEventListener("click", function () {
                WinJS.Navigation.navigate("/SVFragments/about.html");
            }, false);
        }
    });

    WinJS.Navigation.addEventListener("navigated", function (e) {
        let SVBody = document.getElementById("splitViewBody");

        WinJS.UI.Animation.exitPage(SVBody.children).then(function () {
            SVBody.winControl && SVBody.winControl.unload && SVBody.winControl.unload();

            WinJS.Utilities.empty(SVBody);
            WinJS.UI.Pages.render(e.detail.location, SVBody)
                .then(function () {
                    return WinJS.UI.Animation.enterPage(SVBody.children);
                });
        });
    });

    // Function init() - main function which contains eventListeners and function calls
    function init() {
        // Minimize authPanel by clicking on hamburger button 
        let panelBtn = document.getElementById("hamburgerBtn");
        panelBtn.addEventListener("click", (function () {
            let mainPage = document.getElementById("mainPage");

            mainPage.className = (mainPage.className == "minimized-panel") ? "main-page" : "minimized-panel";
        }), false);

        // Synchronize files; functional of it placed in BackgroundTransfer.js
        let syncBtn = document.getElementById("startSyncFilesBtn");
        syncBtn.addEventListener("click", BackgroundTransfer.init, false);

        // Create Buttons for panel and set eventListener on it
        createButton().then(function () {
            buttons = document.querySelectorAll(".auth-panel-btn");

            // Initialize popup menu on all button from auth panel
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener("contextmenu", buttonMenu, false);
                buttons[i].addEventListener("click", authInService, false);
            }
        }, function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog("Occurs error while creating button, pls do something! " + error);
            messageDialog.showAsync();
        });
    }

    // Class Button - have constructor with title and status arguments
    // Function create() - create button inside authorization panel 
    // Function remove(button) - remove picked button via popup menu; button argument gets from buttonMenu function
    // Function undo(button) - undo change exactly restore "deleted" button; button arguments gets from remove function
    class Button {
        constructor(title) {
            this.title = title;
        }

        create() {
            panel = document.getElementById("panelBody");

            let elementButton = document.createElement("button");
            let elementImg = document.createElement("img");
            let elementP = document.createElement("p");

            elementButton.className = "auth-panel-btn win-button"
            elementButton.id = `btn-${this.title}`;

            elementImg.src = "/img/Avatar-48x48.png";
            elementImg.className = "cloud-avatar img-circle";

            elementP.className = "auth-btn-text";
            elementP.innerText = this.title;

            panel.appendChild(elementButton);
            elementButton.appendChild(elementImg);
            elementButton.appendChild(elementP);
        }

        // Remove choosen button from authPanel
        // Add message to restore to default
        remove(button) {
            panel = document.getElementById("authPanel");
            pickedButton = document.getElementById(button);
            buttons = document.querySelectorAll(".auth-panel-btn");

            undoPanel = document.getElementById("undoChangeLine");

            let closeUndoPanelBtn = document.getElementById("closeUndoPanelBtn");
            let collapseAnimation = WinJS.UI.Animation.createCollapseAnimation(pickedButton, buttons);

            // Hide button before deleting; that user can restore it
            pickedButton.style.position = "absolute";
            pickedButton.style.opacity = "0";

            collapseAnimation.execute().done(
              function () {
                  pickedButton.style.display = "none";

                  // Show undo line to interact with them
                  undoPanel.style.display = "block";
              });

            // Close line before timer is finished
            closeUndoPanelBtn.addEventListener("click", function () {
                // remove default event
                clearTimeout(defaultEventTimer);

                undoPanel.style.display = "none";

                panel.removeChild(pickedButton); // Crashed here!!!!!
            }, false);


            ///
            /// Important! 
            /// Clear timer if next button was deleted before end of previous button timer
            ///

            // Event by default remove button and close undo line after 10 seconds
            defaultEventTimer = setTimeout(
                function () {
                    undoPanel.style.display = "none";
                    panel.removeChild(pickedButton);
                }, 10000); // wait 10 seconds before delete button

            // Send picked button to undo function
            this.undo(pickedButton);
        }

        // Function undo() - undo change from remove function
        undo(button) {
            pickedButton = button;
            panel = document.getElementById("authPanel");
            buttons = document.querySelectorAll(".auth-panel-btn");

            undoPanel = document.getElementById("undoChangeLine");
            let undoBtn = document.getElementById("undoChangeBtn");

            let expandAnimation = WinJS.UI.Animation.createExpandAnimation(pickedButton, buttons);

            // Undo delete button
            undoBtn.addEventListener("click", function () {
                undoPanel.style.display = "none";

                clearTimeout(defaultEventTimer); // remove default event

                pickedButton.style.position = "inherit";
                pickedButton.style.display = "block"; // show button 
                pickedButton.style.opacity = "1";

                expandAnimation.execute();
            }, false);
        }
    }

    // Function createButton() - contain objects with button arguments in array to create all the button in one call
    // Creating 3 buttons - Google Drive, Dropbox, OneDrive
    function createButton() {
        return new Promise(function (done) {
            let createButtonArr = [
                new Button("Google Drive"),
                new Button("Dropbox"),
                new Button("OneDrive"),
                new Button("Test"),
                new Button("ButtonTest")
            ];

            for (let i = 0; i < createButtonArr.length; i++) {
                done(createButtonArr[i].create());
            }
        });
    }

    // Temporary function
    function authInService() {
        switch (this.id) {
            case "btn-Google Drive":
                // Src of image inside button and text inside p - tag 
                googledriveAuth(this.getElementsByTagName("img"), this.getElementsByTagName("p"));
                break;
            case "btn-Dropbox":
                // Src of image inside button and text inside p - tag 
                dropboxAuth(this.getElementsByTagName("img"), this.getElementsByTagName("p"));
                break;
            case "btn-OneDrive":
                onedriveAuth(this.getElementsByTagName("img"), this.getElementsByTagName("p"));
                break;
            case "btn-Test":
                Test();
                break;
            case "btn-ButtonTest":
                ButtonTest();
                break;
            default:
                new Windows.UI.Popups.MessageDialog("Error by definition button, please try again!");
        }
    }

    function ButtonTest() {
        MainWindow.renderPivotItems("ButtonTest", "/html/Dropbox.html");
    }

    function Test() {
        MainWindow.renderPivotItems("Test", "/html/Dropbox.html");
    }

    function dropboxAuth(elementImage, elementText) {
        let auth = dropboxConfig.auth,
            oauthUrl = dropboxConfig.oauthUrl,
            clientId = dropboxConfig.appKey,
            clientSecret = dropboxConfig.appSecret;

        let oauth = new AuthenticationBroker.Authentication("Dropbox", auth, oauthUrl, clientId, clientSecret).connect().then(function (token) {
            // Create page for dropbox files and folders
            MainWindow.renderPivotItems("Dropbox", "/html/Dropbox.html");

            // ---------------------------------------
            // Block of xhr requests
            // ---------------------------------------

            XHR.getUser(token.access_token).then(function (result) {
                elementImage[0].src = result.profile_photo_url;
                elementText[0].innerText = result.name.display_name;
            });
        });
    }

    function onedriveAuth(elementImage, elementText) {
        let auth = onedriveConfig.auth,
            oauthUrl = onedriveConfig.oauthUrl,
            clientId = onedriveConfig.appId,
            clientSecret = onedriveConfig.appSecret,
            scopes = onedriveConfig.scopes;

        let oauth = new AuthenticationBroker.Authentication("OneDrive", auth, oauthUrl, clientId, clientSecret, scopes).connect().then(function (token) {
            // Create page for oneDrive files and folders
            MainWindow.renderPivotItems("OneDrive", "/html/OneDrive.html");

            // ---------------------------------------
            // Block of xhr requests
            // ---------------------------------------
        });
    }

    function googledriveAuth(elementImage, elementText) {
        let output = document.getElementById("output");

        let auth = googleConfig.auth,
            oauthUrl = googleConfig.oauthUrl,
            clientId = googleConfig.clientId,
            clientSecret = googleConfig.clientSecret,
            scopes = googleConfig.scopes;

        let oauth = new AuthenticationBroker.Authentication("Google Drive", auth, oauthUrl, clientId, clientSecret, scopes).connect().then(function (token) {
            // Create page for google drive files and folders
            MainWindow.renderPivotItems("Google Drive", "/html/GoogleDrive.html");

            // ---------------------------------------
            // Block of xhr requests
            // ---------------------------------------

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

    // Converts from page to WinRT coordinates, which take scale factor into consideration. 
    function pageToWinRT(pageX, pageY) {
        var zoomFactor = document.documentElement.msContentZoomFactor;
        return {
            x: (pageX - window.pageXOffset) * zoomFactor,
            y: (pageY - window.pageYOffset) * zoomFactor
        };
    }

    // Function buttonMenu() - add popups window called on the right click which include additional options
    // onRemove - remove button from authPanel
    // onLogOut - logout from current account (i.e. delete data from password vault)
    function buttonMenu(event) {
        let menu = new Windows.UI.Popups.PopupMenu();

        let button = this;

        menu.commands.append(new Windows.UI.Popups.UICommand("Remove", function () { onRemove(button) }));
        menu.commands.append(new Windows.UI.Popups.UICommand("Log out", function () { onLogOut(button) }));

        // Crashed here too! :c
        menu.showAsync(pageToWinRT(event.pageX, event.pageY)).done(function (invokedCommand) {
            if (invokedCommand === null) {
                // The command is null if no command was invoked.
                WinJS.log && WinJS.log("Context menu dismissed", "sample", "status");
            }
        });

    }

    // Function onRemove() - command button from popup menu 
    // Send picked button id to Button class
    function onRemove(button) {
        new Button().remove(button.id);
    }

    // Function onLogOut() - command button from popup menu
    // delete password from PasswordVault
    function onLogOut(button) {
        let passwordVault = new PasswordVault();
        let buttonId = button.id;
        let removePrefix = buttonId.replace(/\bbtn\S/ig, "");

        // Return text and image to default
        // childNodes[0] - img
        // childNodes[1] - p
        document.getElementById(buttonId).childNodes[0].src = "/img/Avatar-48x48.png";
        document.getElementById(buttonId).childNodes[1].innerText = removePrefix;

        MainWindow.removePivotItems(removePrefix);

        try {
            // reg expression removed 'btn-' from id 
            let credential = passwordVault.retrieve("OauthToken", removePrefix);

            passwordVault.remove(credential);
        } catch (err) {
            // retrive has not found user
        }
    }

    WinJS.Namespace.define("AuthPanel", {
        init: init
    });
})();