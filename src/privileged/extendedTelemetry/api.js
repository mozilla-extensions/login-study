"use strict";

/* global ExtensionAPI */
// eslint-disable-next-line no-var
var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { ProfileAge } = ChromeUtils.import("resource://gre/modules/ProfileAge.jsm");

// One month here is 30 days
const MILLISECONDS_PER_MONTH = 3 * 24 * 60 * 60 * 1000;
const ALLOW_COOKIE_EXCEPTION = 1;
const BLOCK_COOKIE_EXCEPTION = 2;
// const ALLOW_COOKIE_SESSION = 8; TODO: are we interested in this?

// Moved to a helper function so we only get this once. This checks during startup, and caches the result.
const checkHasCookieExceptions = () => {
  return Services.perms.getAllWithTypePrefix("cookie");
};

const ageToMonths = (creationDate) => {
  return Math.floor((Date.now() - creationDate) / MILLISECONDS_PER_MONTH);
};

this.extendedTelemetry = class extends ExtensionAPI {

  constructor(extension) {
    super(extension);
    this.hasCookieExceptions = checkHasCookieExceptions();
  }

  getAPI(context) {
    const self = this;
    return {
      extendedTelemetry: {
        msSinceProcessStart: Services.telemetry.msSinceProcessStart,

        async profileAge() {
          const profile = await ProfileAge();
          return await profile.created;
        },

        async hasLogins() {
          return (Services.logins.countLogins("https://accounts.google.com", "", null) +
          Services.logins.countLogins("http://accounts.google.com", "", null)) > 0;
        },

        async timesUsedPerMonth() {
          const logins = Services.logins.findLogins("https://accounts.google.com", "", null).concat(Services.logins.findLogins("http://accounts.google.com", "", null));
          if (logins.length) {
            const mostUsedLogin = logins.reduce((prev, current) => { (prev.timesUsed > current.timesUsed) ? prev : current; });
            return mostUsedLogin.timesUsed / ageToMonths(mostUsedLogin.timeCreated);
          }
          return 0;
        },

        async isLoggedInWithGoogle() {
          // TODO
          // accounts.google.com login cookie presence waiting to confirm that this cookie is correct
          // google_accounts_cookie_present
          return false;
        },

        async hasAllowCookieExceptions() {
          return self.hasCookieExceptions.filter(item => item.capability === ALLOW_COOKIE_EXCEPTION).length > 0;
        },

        async hasBlockCookieExceptions() {
          return self.hasCookieExceptions.filter(item => item.capability === BLOCK_COOKIE_EXCEPTION).length > 0;
        },
      },
    };
  }
};
