// Google Drive documentation - https://developers.google.com/drive/v3/reference
window.googleConfig = {
    baseUrl: "https://www.googleapis.com/drive/v3",
    auth: "https://accounts.google.com/o/oauth2/auth",
    clientId: "678629822073-0o7dm97emlp2boen4rdei7mdpsvflvtk.apps.googleusercontent.com",
    clientSecret: "FhVndGtt4U1AuS7qFBmqbOr5",
    scopes: "https://www.googleapis.com/auth/drive",
    oauthUrl: "https://accounts.google.com/o/oauth2/token"
};

// Dropbox documentation - https://www.dropbox.com/developers/documentation/http/documentation
window.dropboxConfig = {
    rpcEndpoints: "https://api.dropboxapi.com",
    contentUploadEndpoints: "https://content.dropboxapi.com",
    contentDownloadEndpoints: "https://content.dropboxapi.com",
    auth: "https://www.dropbox.com/oauth2/authorize",
    appKey: "oyt9daobcffp5ta",
    appSecret: "ap0blor8jkek2bu",
    oauthUrl: "https://api.dropboxapi.com/2/auth/token/revoke"
};

// OneDrive documentation - https://dev.onedrive.com/auth/msa_oauth.htm#code-flow
window.onedriveConfig = {
    auth: "https://login.live.com/oauth20_authorize.srf",
    appId: "000000004C17EF61",
    appSecret: "IRXjAtRUOlIsSyfm4ZLf2APHD4I/3dE9",
    oauthUrl: "https://login.live.com/oauth20_token.srf",
    scopes: "onedrive.readwrite onedrive.appfolder offline_access"
};