(function () {
    "use strict";

    // Global variable
    let messageDialog;
    let PasswordVault = Windows.Security.Credentials.PasswordVault;

    // Variable for class
    let defaultEventTimer,
        panel,
        pickedButton,
        buttons,
        undoPanel;

    WinJS.UI.Pages.define("/html/splitViewSettings.html", {
        ready: function (element, options) {
            let splitView = document.getElementById("splitView");

            // Open settings panel
            let settingsBtn = document.getElementById("settingNavCommand");
            settingsBtn.addEventListener("click", function () {
                splitView.winControl.paneOpened = true;
            }, false);

            // Command buttons inside Setting Panel
            let SVAboutCommand = document.getElementById("aboutSVCommand");
            SVAboutCommand.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/settings_about.html");
            }, false);

            let SVHelpCommand = document.getElementById("helpSVCommand");
            SVHelpCommand.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/settings_help.html");
            }, false);

            let SVGeneralCommand = document.getElementById("generalSVCommand");
            SVGeneralCommand.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/settings_general.html");
            }, false);

            let SVPersonalizationCommand = document.getElementById("personalizationSVCommand");
            SVPersonalizationCommand.addEventListener("click", function () {
                WinJS.Navigation.navigate("/html/settings_personalization.html");
            });
        }
    });

    // Navigate inside Split View
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

    function init() {
        // Create buttons for Split View panel 
        // and set context menu on it
        createButton().then(function () {
            buttons = document.querySelectorAll(".auth-panel-btn");

            for (let i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener("contextmenu", buttonMenu, false);
                buttons[i].addEventListener("click", authInService, false);
            }
        }, function (error) {
            messageDialog = new Windows.UI.Popups.MessageDialog(
                "Occured error while creating buttons: "
                + " Status: " + error.name
                + " Message: " + error.message
                , " Error: " + error.status);

            messageDialog.showAsync();
        });
    }

    /**
     * @description Class for work with buttons inside Split View,
     * contain create, remove and undo functions
     */
    class Button {

        /**
         * @param {string} title Name of the button
         */
        constructor(title) {
            this.title = title;
        }

        /**
         * @description Create Split View Command as button element
         */
        create() {
            panel = document.getElementById("authPanelNavCommands");

            let elementButton = document.createElement("div");

            elementButton.className = "auth-panel-btn";
            elementButton.id = `btn-${this.title}`;
            new WinJS.UI.SplitViewCommand(elementButton, { label: this.title, icon: 'contact' });

            panel.appendChild(elementButton);
        }

        /**
         * @description removed choosen button from Split View
         * @param {string} button Name of button to delete
         */
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

        /**
         * @description Restored deleted button if cancel button was pressed
         * @param {string} button Name of button to restore
         */
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

    /**
     * @description Create button and apply it to Split View panel
     */
    function createButton() {
        return new Promise(function (done) {
            let btnToCreateArray = [
                new Button("Google Drive"),
                new Button("Dropbox"),
                new Button("OneDrive"),
                new Button("Test"),
                new Button("ButtonTest")
            ];

            btnToCreateArray.forEach(function (item) {
                done(item.create());
            });
        });
    }

    /**
     * @description Create new Pivot Item with the name of clicked button
     */
    function authInService() {
        main.renderPivotItems(`${this.winControl.label}`, "/html/fileExplorer_cloud.html");

        // Send name of button to main function of clouds file explorer
        FileExplorerCloud.init(this.winControl.label);
    }

    function dropboxAuth(elementImage, elementText) {
        let auth = dropboxConfig.auth,
            oauthUrl = dropboxConfig.oauthUrl,
            clientId = dropboxConfig.appKey,
            clientSecret = dropboxConfig.appSecret;

        let oauth = new AuthenticationBroker.Authentication("Dropbox", auth, oauthUrl, clientId, clientSecret).connect().then(function (token) {
            // Create page for dropbox files and folders
            main.renderPivotItems("Dropbox", "/html/dropbox.html");

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
            main.renderPivotItems("OneDrive", "/html/oneDrive.html");

            // ---------------------------------------
            // Block of xhr requests
            // ---------------------------------------
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

        menu.commands.append(new Windows.UI.Popups.UICommand("Remove", function () { onRemove(button); }));
        menu.commands.append(new Windows.UI.Popups.UICommand("Log out", function () { onLogOut(button); }));

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

        main.removePivotItems(removePrefix);

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