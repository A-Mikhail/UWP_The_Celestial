(function () {
    'use strict';

    let ViewManagement = Windows.UI.ViewManagement;

    let emptyTitle = "<title cleared>";

    function myAppView(window) {
        this.viewId = MSApp.getViewId(window),
        this.window = window;
    };

    function createNewView(page) {
        let newWindow = window.open(page, null, "msHideView=no");

        return new myAppView(newWindow);
    }

    function getViewOpener() {
        let openerWindow = window.opener;
        let parentWindow = window.parent;

        return new myAppView(openerWindow);
    }

    WinJS.Namespace.define("SecondaryViewsHelper", {
        thisDomain: document.location.protocol + "//" + document.location.host,

        ViewManager: WinJS.Class.define(function ViewManager_ctor() {
            this._viewReleasedWrapper = this._viewReleased.bind(this);
        },
        {
            _viewReleased: function ViewManager_viewReleased(e) {
                e.target.removeEventListener("released", this._viewReleasedWrapper, false);

                let i = this.findViewIndexByViewId(e.target.viewId);

                if (i !== null) {
                    this.secondaryViews.splice(i, 1);
                }
            },

            secondaryViews: new WinJS.Binding.List([]),

            findViewIndexByViewId: function ViewManager_findViewIndexByViewId(viewId) {
                for (let i = 0, len = this.secondaryViews.length; i < len; i++) {
                    let value = this.secondaryViews.getItem(i).data;

                    if (viewId === value.viewId) {
                        return i;
                    }
                }
                return null;
            },

            createNewView: function ViewManager_createNewView(page, initData) {
                if (!page) {
                    throw "Must specify a URL of a page from your app to show in the new view";
                }

                // Create new window
                let newView = createNewView(page); 

                let newProxy = new SecondaryViewsHelper.ViewLifetimeControlProxy(newView);
                newProxy.addEventListener("released", this._viewReleasedWrapper, false);

                this.secondaryViews.push(newProxy);

                return newProxy;
            }
        }),

        ViewLifetimeControlProxy: WinJS.Class.mix(WinJS.Class.define(function ViewLifetimeControlProxy_ctor(appView) {
            this.appView = appView;
            this.viewId = appView.viewId;
            this.title = "";
        },
            {
                _refCount: 0,

                appView: null,

                startViewInUse: function ViewLifetimeControlProxy_startViewInUse() {
                    this._refCount++;
                },

                stopViewInUse: function ViewLifetimeControlProxy_stopViewInUse() {
                    this._refCount--;

                    if (this._refCount === 0) {
                        console.log("_refCount === 0, what is this mean?");
                    }
                }
            }), WinJS.Utilities.eventMixin, WinJS.Binding.observableMixin),

        ViewLifetimeControl: WinJS.Class.mix(WinJS.Class.define(function () {
            this.opener = getViewOpener();
            this._onConsolidatedWrapper = this._onConsolidated.bind(this);
            this._onVisibilityChangeWrapper = this._onVisibilityChange.bind(this);
            this._finalizeReleaseWrapper = this._finalizeRelease.bind(this);
            this.viewId = ViewManagement.ApplicationView.getForCurrentView().id;
        },
        {
            _refCount: 0,
            _proxyReleased: false,
            _consolidated: true,

            _onConsolidated: function ViewLifetimeControlProxy_onConsolidated() {
                this._setConsolidated(true);
            },

            _onVisibilityChange: function ViewLifetimeControlProxy_onVisibilityChange() {
                if (!document.hidden) {
                    this._setConsolidated(false);
                }
            },

            _setConsolidated: function ViewLifetimeControlProxy_setConsolidated(value) {
                if (this.consolidated !== value) {
                    this._consolidated = value;

                    if (value) {
                        this.stopViewInUse();
                    } else {
                        this.startViewInUse();
                    }
                }
            },

            _finalizeRelease: function ViewLifetimeControlProxy_finalizeRelease() {
                if (this._refCount === 0) {
                    ViewManagement.ApplicationView.getForCurrentView().removeEventListener("consolidated", this._onConsolidatedWrapper, false);

                    document.addEventListener("visibilitychange", this._onVisibilityChangeWrapper, false);

                    this.dispatchEvent("released");

                    window.close();
                }
            },

            setTitle: function ViewLifetimeControlProxy_setTitle(value) {
                ViewManagement.ApplicationView.getForCurrentView().title = value;

                if (!value) {
                    value = emptyTitle;
                }
            },

            initialize: function ViewLifetimeControlProxy_initialize() {
                ViewManagement.ApplicationView.getForCurrentView().addEventListener("consolidated", this._onConsolidatedWrapper, false);

                document.addEventListener("visibilitychange", this._onVisibilityChangeWrapper, false);
            },

            startViewInUse: function ViewLifetimeControlProxy_startViewInUse() {
                this._refCount++;
            },

            stopViewInUse: function ViewLifetimeControlProxy_stopViewInUse() {
                this._refCount--;

                if (this._refCount === 0) {
                    if (this._proxyReleased) {
                        setImmediate(this._finalizeReleaseWrapper);
                    }
                }
            }
        }), WinJS.Utilities.eventMixin)
    });
})();