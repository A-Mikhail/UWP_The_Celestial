(function () {
    "use strict";

    var PasswordVault = Windows.Security.Credentials.PasswordVault;
    var PasswordCredential = Windows.Security.Credentials.PasswordCredential;
    
    WinJS.Namespace.define("GoogleDrive", {
        oauth: WinJS.Class.define(function() {
            return this.refreshToken = retreiveTokenFromVault();
        },
        {
            connect: function () {
                return new Promise(function (done, error) {
                    var retrieveToken = GoogleDrive.oauth();

                    if (!retrieveToken) {
                        authenticate().then(function (token) {
                            return grant(token).then(function (accessToken) {
                                var cred = new PasswordCredential("OauthToken", "CurrentUser", accessToken.refresh_token);
                                retrieveToken = accessToken.refresh_token;

                                var passwordVault = new PasswordVault();
                                passwordVault.add(cred);

                                done(accessToken);
                            });
                        });
                    } else {
                        refresh(retrieveToken).then(function (accessToken) {
                            return done(accessToken);
                        });
                    }
                });
            }
        })
    });

    let auth            = googleConfig.auth,
        clientId        = googleConfig.clientId,
        clientSecret    = googleConfig.clientSecret,
        redirectURI     = googleConfig.redirectURI,
        scopes          = googleConfig.scopes,
        oauthUrl        = googleConfig.oauthUrl;

    function authenticate() {
        var startURL = auth + "client_id=" +
                       clientId + "&redirect_uri=" +
                       redirectURI + "&response_type=code&access_type=offline&scope=" +
                       scopes + "&immediate=false";

        var startURI = new Windows.Foundation.Uri(startURL);
        var endURI = new Windows.Foundation.Uri(redirectURI);

        return new Promise(function (complete, error) {
            Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
                Windows.Security.Authentication.Web.WebAuthenticationOptions.none, startURI, endURI).done(function (result) {
                    if (result.responseStatus == 0) {
                        complete(result.responseData.replace('https://localhost/oauth2callback?code=', ''));
                    } else {
                        error(result);
                    }

                }, function (err) {
                    var messageDialog = new Windows.UI.Popups.MessageDialog("Error returned by WebAuth broker: " + err);
                    messageDialog.showAsync();
                });
        });
    }

    function grant(token) {
        let dataParams = "code=" + encodeURIComponent(token) +
                            "&redirect_uri=" + encodeURIComponent(redirectURI) +
                            "&client_id=" + encodeURIComponent(clientId) +
                            "&client_secret=" + encodeURIComponent(clientSecret) +
                            "&grant_type=authorization_code";

        return WinJS.xhr({
            type: "POST",
            url: oauthUrl,
            data: dataParams,
            headers:
            {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(function (x) { return JSON.parse(x.response) });
    };

    function refresh(token) {
        let dataParams = "refresh_token=" + encodeURIComponent(token) +
                            "&redirect_uri=" + encodeURIComponent(redirectURI) +
                            "&client_id=" + encodeURIComponent(clientId) +
                            "&client_secret=" + encodeURIComponent(clientSecret) +
                            "&grant_type=refresh_token";

        return WinJS.xhr({
            type: "POST",
            url: oauthUrl,
            data: dataParams,
            headers:
            {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(function (x) { return JSON.parse(x.response) });
    }

    function retreiveTokenFromVault() {
        var passwordVault = new PasswordVault()
        var storedToken;

        try {
            var credential = passwordVault.retrieve("OauthToken", "CurrentUser");
            storedToken = credential.password;

            // passwordVault.remove(credential); // Uncomment to delete authorization token from password vault
        } catch (e) {
            // no stored credentials
        }

        return storedToken;
    }
})();