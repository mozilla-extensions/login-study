"use strict";

/* global ExtensionAPI */
// eslint-disable-next-line no-var
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { ProfileAge } = ChromeUtils.import("resource://gre/modules/ProfileAge.jsm");
const { TelemetryEnvironment } = ChromeUtils.import("resource://gre/modules/TelemetryEnvironment.jsm");
const { AddonManager } =  ChromeUtils.import("resource://gre/modules/AddonManager.jsm");
const { PlacesUtils } = ChromeUtils.import("resource://gre/modules/PlacesUtils.jsm");
const { TelemetryArchive } = ChromeUtils.import("resource://gre/modules/TelemetryArchive.jsm");


// One month here is 28 days
const MILLISECONDS_PER_MONTH = 28 * 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const SECONDS_PER_TWO_WEEKS = 2 * 7 * 24 * 60 * 60;
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

const msToDays = (time) => {
  return Math.floor(time / MILLISECONDS_PER_DAY);
};

const roundToSpecificDecimal = (number, decimal) => {
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
          const cookies = Services.cookies.getCookiesFromHost("accounts.google.com", {});
          const result = cookies.some((cookie) => {
            // When both __Secure-3PSID or SID cookies are gone, the user gets logged out, when at least one is present, they will remain logged in.
            // If "HSID" cookie is gone, the user will be logged out.
            // All of these cookies seem to expire after 2 years.
            return cookie.name === "__Secure-3PSID" || cookie.name === "SID" || cookie.name === "HSID";
          });
          return result;
        },

        // Returns null if no cookie.
        async googleCookieDaysRemaining() {
          const currentTimestamp = Date.now();
          const cookies = Services.cookies.getCookiesFromHost("accounts.google.com", {});
          const googleCookie = cookies.find((cookie) => {
            // When both __Secure-3PSID or SID cookies are gone, the user gets logged out, when at least one is present, they will remain logged in.
            // If "HSID" cookie is gone, the user will be logged out.
            // All of these cookies seem to expire after 2 years.
            return cookie.name === "__Secure-3PSID" || cookie.name === "SID" || cookie.name === "HSID";
          });
          if (googleCookie) {
            // Convert exiry to ms, then subtract date created.
            return msToDays((googleCookie.expiry * 1000) - currentTimestamp);
          }
          return null;
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

        // TODO fix up this query.
        async countVisitsToAccountsPage() {
          const query = async function(db) {
            const rows = await db.executeCached(
              `SELECT SUM(visit_count)
              as visits_per_month
              FROM moz_places p
              LEFT JOIN moz_historyvisits h
              ON h.place_id = p.id
              WHERE rev_host
              LIKE 'moc.elgoog.stnuocca.';`);
            return rows;
          };

          const results = await PlacesUtils.withConnectionWrapper("Login Study: fetch login count", query);
          if (results[0].getResultByName("visits_per_month")) {
            return (roundToSpecificDecimal(results[0].getResultByName("visits_per_month"), 10));
          }
          return 0.0;
        },

        // TODO consider requestIdleCallback // note: test this more thoroughly
        async searchWithAds() {
          const pingList = await TelemetryArchive.promiseArchivedPingList();
          const currentTimestamp = Date.now();
          for (const outerPing of pingList) {
            if (outerPing.type === "main") {
              const ping = await TelemetryArchive.promiseArchivedPingById(outerPing.id);
              if (ping.payload.processes && ping.payload.processes.parent.scalars["browser.search.with_ads"]) {
                return true;
              }
              // Only check historical pings up to two weeks in the past
              if (currentTimestamp - ping.timestampCreated > SECONDS_PER_TWO_WEEKS) {
                return false;
              }
            }
          }
          return false;
        },

        // TODO consider requestIdleCallback // note: test this more thoroughly
        async searchClickAds() {
          const pingList = await TelemetryArchive.promiseArchivedPingList();
          const currentTimestamp = Date.now();
          for (const outerPing of pingList) {
            if (outerPing.type === "main") {
              const ping = await TelemetryArchive.promiseArchivedPingById(outerPing.id);
              if (ping.payload.processes && ping.payload.processes.parent.scalars["browser.search.ad_clicks"]) {
                return true;
              }
              // Only check historical pings up to two weeks in the past
              if (currentTimestamp - ping.timestampCreated > SECONDS_PER_TWO_WEEKS) {
                return false;
              }
            }
          }
          return false;
        },

        // Returns NULL if there are no history entries, 0 if oldest history is same-day.
        async getOldestHistoryAgeInDays() {
          const query = async function(db) {
            const rows = await db.executeCached(
              `SELECT CAST(julianday('now') - julianday(MIN(visit_date) / 1000 / 1000, 'unixepoch') as int)
              AS history_oldest_days_old
              FROM moz_historyvisits;`);
            return rows;
          };

          const results = await PlacesUtils.withConnectionWrapper("Login Study: fetch oldest history", query);
          // This returns "null" if no results, 0 if same-day.
          return results[0].getResultByName("history_oldest_days_old");
        },
      },
    };
  }
};
