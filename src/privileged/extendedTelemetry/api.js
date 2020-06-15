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

// Moved to a helper function so we only get this once. This checks during startup, and caches the result.
const checkHasCookieExceptions = () => {
  return Services.perms.getAllWithTypePrefix("cookie");
};

// Takes a ratio of times used per age-in-ms, and multiplies by ms_per_month to convert that ratio into uses per month.
// Rounds to 1 decimal place.
const msFrequencyToMonths = (frequency) => {
  return Math.round((frequency * MILLISECONDS_PER_MONTH) * 10) / 10;
};

// Rounds down to the nearest day.
const msToDays = (time) => {
  return Math.floor(time / MILLISECONDS_PER_DAY);
};

// Rounds down to the nearest day.
const calculateProfileAgeInDays = (creationDate) => {
  return Math.floor((Date.now() - creationDate) / MILLISECONDS_PER_DAY);
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
        async daysSinceProcessStart() {
          return msToDays(Services.telemetry.msSinceProcessStart());
        },

        async profileAge() {
          const profile = await ProfileAge();
          return calculateProfileAgeInDays(await profile.created);
        },

        async hasGoogleAccountsLogin() {
          return (Services.logins.countLogins("https://accounts.google.com", "", null) +
          Services.logins.countLogins("http://accounts.google.com", "", null)) > 0;
        },

        async timesUsedPerMonth() {
          if (!Services.logins.isLoggedIn) {
            return 0.0;
          }
          const logins = Services.logins.findLogins("https://accounts.google.com", "", null).concat(Services.logins.findLogins("http://accounts.google.com", "", null));
          if (logins.length) {
            const mostUsedLogin = logins.reduce((prev, current) => { (prev.timesUsed > current.timesUsed) ? prev : current; });
            return msFrequencyToMonths(mostUsedLogin.timesUsed / (Date.now() - mostUsedLogin.timeCreated));
          }
          return 0.0;
        },

        async hasGoogleCookieAndAge() {
          let result = {
            google_accounts_cookie_present: false,
            google_accounts_cookie_days_old: null,
          };
          const currentTimestamp = Date.now();
          const cookies = Services.cookies.getCookiesFromHost("google.com", {}).filter(c => c.host === "accounts.google.com");
          const googleCookie = cookies.find((cookie) => {
            // if the cookie is already expired, throw it away.
            if (!cookie.isSession && (cookie.expiry * 1000 < Date.now())) {
              return false;
            }
            // LSID cookie exists when a user is logged in to any Google product.
            // Note: this cookie can be deleted (perhaps through other means, excluding a log out action) and the user will not be
            // logged out of any google product, but will have to reauthenticate if they log into a different google product.
            // This cookie gets deleted if a user actively logs out.
            return cookie.name === "LSID";
          });
          if (googleCookie) {
            result.google_accounts_cookie_present = true;
            // Convert exiry to ms, then subtract date created.
            result.google_accounts_cookie_days_old = msToDays(currentTimestamp - (googleCookie.creationTime / 1000));
          }
          return result;
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

        async countVisitsToAccountsPage() {
          const query = async function(db) {
            // To avoid divide by 0 issues, the youngest profile will be counted as 1 day old.
            // Select count of days which included a visit to accounts.google.com,
            // calculate how many days ago the oldest day recorded in this user's history is,
            // divide days which included a visit by the total days,
            // multiply by 28 to get a number between 0 and 28, round to two decimal places.
            const rows = await db.executeCached(
              `SELECT ROUND(
                (SELECT CAST(COUNT(DISTINCT v.visit_date / 1000 / 1000 / 86400) AS FLOAT)
                AS distinct_days
                FROM moz_historyvisits v
                JOIN moz_places h ON h.id = v.place_id
                WHERE h.rev_host LIKE "moc.elgoog.stnuocca.")
                /
                (WITH totalDays AS
                  (SELECT
                  CAST(julianday('now') - julianday(MIN(visit_date) / 1000 / 1000, 'unixepoch') AS FLOAT)
                  AS history_oldest_days_old
                  FROM moz_historyvisits
                  LIMIT 1)
                SELECT CAST( history_oldest_days_old as int ) + ( history_oldest_days_old > CAST( history_oldest_days_old as int ))
                FROM totalDays)
                * 28 , 2) AS visits_per_month;`);
            return rows;
          };

          const results = await PlacesUtils.withConnectionWrapper("Login Study: fetch login count", query);
          if (results[0].getResultByName("visits_per_month")) {
            return (results[0].getResultByName("visits_per_month"));
          }
          return 0.00;
        },

        // Note, this is checking historical telemetry pings, it does not check the current ping.
        async searchWithAdsPlusClick() {
          const pingList = await TelemetryArchive.promiseArchivedPingList();
          const currentTimestamp = Date.now();
          let results = {
            has_browser_search_with_ads: false,
            has_browser_search_ad_clicks: false,
          };
          for (const outerPing of pingList) {
            if (outerPing.type === "main") {
              const ping = await TelemetryArchive.promiseArchivedPingById(outerPing.id);
              if (ping.payload.processes && ping.payload.processes.parent.keyedScalars["browser.search.with_ads"]) {
                results.has_browser_search_with_ads = true;
              }
              if (ping.payload.processes && ping.payload.processes.parent.keyedScalars["browser.search.ad_clicks"]) {
                results.has_browser_search_ad_clicks = true;
              }
              // exit early if both have been found.
              if (results.has_browser_search_ad_clicks && results.has_browser_search_with_ads) {
                return results;
              }
              // Only check historical pings up to two weeks in the past
              if (currentTimestamp - ping.timestampCreated > SECONDS_PER_TWO_WEEKS) {
                return results;
              }
            }
          }
          return results;
        },

        // Returns NULL if there are no history entries, 0 if oldest history is same-day.
        async getOldestHistoryAgeInDays() {
          const query = async function(db) {
            const rows = await db.executeCached(
              `SELECT CAST(julianday('now') - julianday(MIN(visit_date) / 1000 / 1000, 'unixepoch') as int)
              AS history_oldest_days_old
              FROM moz_historyvisits
              LIMIT 1;`);
            return rows;
          };

          const results = await PlacesUtils.withConnectionWrapper("Login Study: fetch oldest history", query);
          // This returns "null" if no results, 0 if same-day.
          return results[0].getResultByName("history_oldest_days_old");
        },

        async getAverageHistoryDaysPerMonth() {
          const query = async function(db) {
            // To avoid divide by 0 issues, the youngest profile will be counted as 1 day old.
            // Select count of days which have a history entry,
            // calculate how many days ago the oldest day recorded in this user's history is,
            // divide days which included a visit by the total days,
            // multiply by 28 to get a number between 0 and 28, round to two decimal places.
            const rows = await db.executeCached(
              `SELECT ROUND(
                (SELECT CAST(COUNT(DISTINCT visit_date / 1000 / 1000 / 86400) AS FLOAT)
                AS distinct_days
                FROM moz_historyvisits)
                /
                (WITH totalDays AS
                  (SELECT
                  CAST(julianday('now') - julianday(MIN(visit_date) / 1000 / 1000, 'unixepoch') AS FLOAT)
                  AS history_oldest_days_old
                  FROM moz_historyvisits
                  LIMIT 1)
                SELECT CAST( history_oldest_days_old as int ) + ( history_oldest_days_old > CAST( history_oldest_days_old as int ))
                FROM totalDays)
                * 28 , 2) AS visits_per_month;`);
            return rows;
          };

          const results = await PlacesUtils.withConnectionWrapper("Login Study: fetch login count", query);
          if (results[0].getResultByName("visits_per_month")) {
            return (results[0].getResultByName("visits_per_month"));
          }
          return 0.00;
        },
      },
    };
  }
};
