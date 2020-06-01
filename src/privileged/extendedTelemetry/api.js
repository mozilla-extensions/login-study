"use strict";

/* global ExtensionAPI */
// eslint-disable-next-line no-var
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { ProfileAge } = ChromeUtils.import("resource://gre/modules/ProfileAge.jsm");
const { TelemetryEnvironment } = ChromeUtils.import("resource://gre/modules/TelemetryEnvironment.jsm");
const { AddonManager } =  ChromeUtils.import("resource://gre/modules/AddonManager.jsm");

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

const roundToSpecificDecimal = (number, decimal) => {
  let res = Math.round(number * decimal) / decimal;
  console.log(number, res);
  return Math.round(number * decimal) / decimal;
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

        // Returns NULL if there are no cookies, 0 if oldest cookie is same-day.
        async getOldestCookieAgeInDays() {
          // eslint-disable-next-line no-undef
          const dbFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
          dbFile.append("cookies.sqlite");
          const conn = Services.storage.openDatabase(dbFile);
          const stmt = conn.createStatement(
            `SELECT CAST(julianday('now') - julianday(MIN(creationTime) / 1000 / 1000, 'unixepoch') as int) 
            AS days_since_oldest_cookie 
            FROM moz_cookies 
            LIMIT 1;`);
          if (stmt.executeStep()) {
            return stmt.getInt32(0);
          }
          return null;
        },

        async getActiveAddons() {
          const { addons } = await AddonManager.getActiveAddons();
          return addons.map(addon => { return {id: addon.id, name: addon.name}; });
        },

        async defaultSearchEngineIsGoogle() {
          return (TelemetryEnvironment.currentEnvironment.settings.defaultSearchEngineData.name === "Google");
        },

        async defaultPrivateSearchEngineIsGoogle() {
          if (TelemetryEnvironment.currentEnvironment.settings.defaultPrivateSearchEngineData) {
            return (TelemetryEnvironment.currentEnvironment.settings.defaultPrivateSearchEngineData.name === "Google");
          }
          // Not all versions have a seperate default private search engine, so it must match the regular default search engine.
          return (TelemetryEnvironment.currentEnvironment.settings.defaultSearchEngineData.name === "Google");
        },
      },
    };
  }
};
