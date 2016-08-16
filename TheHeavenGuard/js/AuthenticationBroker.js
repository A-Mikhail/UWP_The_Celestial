(function () {
    "use strict";

    // Constant variables 
    const header = { "Content-Type": "application/x-www-form-urlencoded" };
    const psswdCredentialResource = "OauthToken";
    const redirectURI = "https://localhost/oauth2callback";

    // Global variables
    let PasswordVault = Windows.Security.Credentials.PasswordVault;
    let PasswordCredential = Windows.Security.Credentials.PasswordCredential;
    let messageDialog;

    class Authentication {
        constructor(cloudName, authUrl, oauthUrl, clientId, clientSecret, scopes) {
            // Required
            this.cloudName = cloudName;
            this.authUrl = authUrl;
            this.oauthUrl = oauthUrl;
            this.clientId = clientId;
            this.clientSecret = clientSecret;

            // Optional
            this.scopes = scopes;
        }

        connect() {
            let auth = this;
            let responseType = "code"; // https://tools.ietf.org/html/rfc6749#section-4.1.1
            let authenticateURI;

            return new Promise(function (done, error) {
                let retrieveToken = retreiveTokenFromVault(auth.cloudName);
                let request = auth.authUrl
                            + "?client_id=" + auth.clientId
                            + "&redirect_uri=" + redirectURI
                            + "&response_type=" + responseType;

                if (!retrieveToken) {
                    // Check on optional argument
                    if (auth.scopes === undefined) {
                        authenticateURI = request
                    } else {
                        authenticateURI = request + "&scope=" + auth.scopes;
                    }

                    console.log("authURI = " + authenticateURI);

                    // Send request to authenticate in cloud service
                    let authenticate = new Authorization().authenticate(authenticateURI, redirectURI);

                    authenticate.then(function (token) {
                        let grantTokenURI = "code=" + encodeURIComponent(token)
                                            + "&redirect_uri=" + encodeURIComponent(redirectURI)
                                            + "&client_id=" + encodeURIComponent(auth.clientId)
                                            + "&client_secret=" + encodeURIComponent(auth.clientSecret)
                                            + "&grant_type=authorization_code";

                        console.log("grantTokenURI = " + grantTokenURI);

                        // Send request to grant token
                        let grant = new Authorization(auth.oauthUrl, "POST", header, grantTokenURI, false, true).sendRequest();

                        return grant.then(function (accessToken) {
                            let cred = new PasswordCredential(psswdCredentialResource, auth.cloudName, accessToken.refresh_token);
                            retrieveToken = accessToken.refresh_token;

                            let passwordVault = new PasswordVault();
                            passwordVault.add(cred);

                            done(accessToken);
                        });
                    });
                } else {
                    let refreshTokenURI = "refresh_token=" + encodeURIComponent(retrieveToken)
                                        + "&redirect_uri=" + encodeURIComponent(redirectURI)
                                        + "&client_id=" + encodeURIComponent(auth.clientId)
                                        + "&client_secret=" + encodeURIComponent(auth.clientSecret)
                                        + "&grant_type=refresh_token";

                    console.log("refreshTokenURI = " + refreshTokenURI);

                    // Send request to refresh token
                    let refresh = new Authorization(auth.oauthUrl, "POST", header, refreshTokenURI, false, true).sendRequest();

                    refresh.then(function (accessToken) {
                        return done(accessToken);
                    });
                }
            });
        }
    }

    class Authorization {
        constructor(url, method, headers, body, cached, credentials) {
            this.url = url;
            this.method = method;
            this.headers = headers;
            this.body = body;
            this.cached = cached;
            this.credentials = credentials;
        }

        authenticate(startURL, endURL) {
            this.startURL = startURL;
            this.endURL = endURL;

            let startURI = new Windows.Foundation.Uri(this.startURL);
            let endURI = new Windows.Foundation.Uri(this.endURL);

            console.log("startURI = " + startURI);

            return new Promise(function (complete, error) {
                Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
                    Windows.Security.Authentication.Web.WebAuthenticationOptions.none, startURI, endURI).done(function (result) {
                        if (result.responseStatus == 0) {
                            // Get recieved code without redirect uri
                            complete(result.responseData.replace('https://localhost/oauth2callback?code=', '')); 
                        } else {
                            // Windows has closed or other error
                            return error(result);
                        }

                    }, function (error) {
                        messageDialog = new Windows.UI.Popups.MessageDialog("Error returned by WebAuth broker: " + error);
                        messageDialog.showAsync();
                    });
            });
        }

        sendRequest() {
            let request = oboe({
                url: this.url,
                method: this.method,
                headers: this.headers,
                body: this.body,
                cached: this.cached,
                withCredentials: this.credentials
            });

            return new Promise(function (complete, error) {
                request.done(function (parsedJson) {
                    return complete(parsedJson);
                }).fail(function (errorReport) {
                    messageDialog = new Windows.UI.Popups.MessageDialog("Error while sending request: " + errorReport.statusCode);
                    error(messageDialog.showAsync());
                });
            });
        }
    }

    function retreiveTokenFromVault(cloudName) {
        let passwordVault = new PasswordVault();
        let storedToken;

        try {
            let credential = passwordVault.retrieve(psswdCredentialResource, cloudName);
            storedToken = credential.password;

            // passwordVault.remove(credential);

        } catch (err) {
            // retrive has not found user
        }

        return storedToken;
    }

    WinJS.Namespace.define("AuthenticationBroker", {
        Authentication: Authentication
    });
})();