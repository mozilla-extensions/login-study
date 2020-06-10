"use strict";

const sendTelemetry = async () => {
  const password_manager_enabled = await browser.prefs.getBoolPref("signon.rememberSignons");
  const browser_privatebrowsing_autostart = await browser.prefs.getBoolPref("browser.privatebrowsing.autostart");
  const network_cookie_lifetime_policy = await browser.prefs.getIntPref("network.cookie.lifetimePolicy");
  const privacy_sanitize_sanitize_on_shutdown = await browser.prefs.getBoolPref("privacy.sanitize.sanitizeOnShutdown");
  const privacy_clear_on_shutdown_cookies = await browser.prefs.getBoolPref("privacy.clearOnShutdown.cookies");
  const network_cookie_cookie_behavior = await browser.prefs.getIntPref("network.cookie.cookieBehavior");
  const browser_startup_page = await browser.prefs.getIntPref("browser.startup.page");
  const session_days_old = await browser.extendedTelemetry.daysSinceProcessStart();
  const profile_days_old = await browser.extendedTelemetry.profileAge();
  const logins_accounts = await browser.extendedTelemetry.hasLogins();
  const logins_accounts_uses_per_month = await browser.extendedTelemetry.timesUsedPerMonth();
  const { google_accounts_cookie_present, google_accounts_cookie_days_old } = await browser.extendedTelemetry.hasGoogleCookieAndAge();
  const has_allow_cookie_exceptions = await browser.extendedTelemetry.hasAllowCookieExceptions();
  const has_block_cookie_exceptions = await browser.extendedTelemetry.hasBlockCookieExceptions();
  const cookies_oldest_days_old = await browser.extendedTelemetry.getOldestCookieAgeInDays();
  const activeAddons = await browser.extendedTelemetry.getActiveAddons();
  const default_search_engine_is_google = await browser.extendedTelemetry.defaultSearchEngineIsGoogle();
  const default_private_search_engine_is_google = await browser.extendedTelemetry.defaultPrivateSearchEngineIsGoogle();
  const accounts_days_visited_per_month = await browser.extendedTelemetry.countVisitsToAccountsPage();
  const { has_browser_search_with_ads, has_browser_search_ad_clicks} = await browser.extendedTelemetry.searchWithAdsPlusClick();
  const history_oldest_days_old = await browser.extendedTelemetry.getOldestHistoryAgeInDays();

  const payload = {
    password_manager_enabled,
    browser_privatebrowsing_autostart,
    network_cookie_lifetime_policy,
    privacy_sanitize_sanitize_on_shutdown,
    privacy_clear_on_shutdown_cookies,
    network_cookie_cookie_behavior,
    browser_startup_page,
    session_days_old,
    profile_days_old,
    logins_accounts,
    logins_accounts_uses_per_month,
    google_accounts_cookie_present,
    google_accounts_cookie_days_old,
    has_allow_cookie_exceptions,
    has_block_cookie_exceptions,
    cookies_oldest_days_old,
    activeAddons,
    default_search_engine_is_google,
    default_private_search_engine_is_google,
    accounts_days_visited_per_month,
    has_browser_search_with_ads,
    has_browser_search_ad_clicks,
    history_oldest_days_old,
  };

  // addClientId defaults to false, being explicit.
  browser.telemetry.submitPing("normandy-login-study", payload, {addClientId: false});

  // Uninstall the addon once the telemetry has been submitted.
  // This fails since it is not installed with Normandy at the moment. We will need to test on their staging server.
  browser.normandyAddonStudy.endStudy("study-finished-successfully");
};

function handleAlarm(alarmInfo) {
  if (alarmInfo.name === "send-telemetry" ) {
    sendTelemetry();
  }
}

browser.alarms.onAlarm.addListener(handleAlarm);
// Delay sending the telemetry until after the browser has finished starting up.
browser.alarms.create("send-telemetry", { delayInMinutes: 1 });
