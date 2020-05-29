"use strict";

/* global ExtensionAPI */

var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

/* https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/functions.html */
this.prefs = class extends ExtensionAPI {
  getAPI(context) {
    return {
      prefs: {
        getStringPref: Services.prefs.getStringPref,
        getIntPref: Services.prefs.getIntPref,
        getBoolPref: Services.prefs.getBoolPref,
      },
    };
  }
};
