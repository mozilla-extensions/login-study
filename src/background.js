
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const convertMSToDays = (time) => {
  return Math.floor(time / MILLISECONDS_PER_DAY);
};

// Note: should we consider profile reset date?
const calculateProfileAgeInDays = (creationDate) => {
  return Math.floor((Date.now() - creationDate) / MILLISECONDS_PER_DAY);
};

browser.browserAction.onClicked.addListener(async () => {
  const sendTelemetry = async () => {

    const password_manager_enabled = await browser.prefs.getBoolPref("signon.rememberSignons");
    const browser_privatebrowsing_autostart = await browser.prefs.getBoolPref("browser.privatebrowsing.autostart");
    const network_cookie_lifetime_policy = await browser.prefs.getIntPref("network.cookie.lifetimePolicy");
    const privacy_sanitize_sanitize_on_shutdown = await browser.prefs.getBoolPref("privacy.sanitize.sanitizeOnShutdown");
    const privacy_clear_on_shutdown_cookies = await browser.prefs.getBoolPref("privacy.clearOnShutdown.cookies");
    const network_cookie_cookie_behavior = await browser.prefs.getIntPref("network.cookie.cookieBehavior");
    const browser_startup_page = await browser.prefs.getIntPref("browser.startup.page");
    const session_days_old = convertMSToDays(await browser.extendedTelemetry.msSinceProcessStart());
    const profile_days_old = calculateProfileAgeInDays(await browser.extendedTelemetry.profileAge());
    const logins_accounts = await browser.extendedTelemetry.hasLogins();
    const logins_accounts_uses_per_month = await browser.extendedTelemetry.timesUsedPerMonth();
    const google_accounts_cookie_present = await browser.extendedTelemetry.isLoggedInWithGoogle();
    const has_allow_cookie_exceptions = await browser.extendedTelemetry.hasAllowCookieExceptions();
    const has_block_cookie_exceptions = await browser.extendedTelemetry.hasBlockCookieExceptions();
    const cookies_oldest_days_old = await browser.extendedTelemetry.getOldestCookieAgeInDays();
    const activeAddons = await browser.extendedTelemetry.getActiveAddons();
    const default_search_engine_is_google = await browser.extendedTelemetry.defaultSearchEngineIsGoogle();
    const default_private_search_engine_is_google = await browser.extendedTelemetry.defaultPrivateSearchEngineIsGoogle();


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
      has_allow_cookie_exceptions,
      has_block_cookie_exceptions,
      cookies_oldest_days_old,
      activeAddons,
      default_search_engine_is_google,
      default_private_search_engine_is_google,
    };


    // addClientId defaults to false, being explicit.
    browser.telemetry.submitPing("normandy-login-study", payload, {addClientId: false});
    console.log("telemetry submitted");
  };

  await sendTelemetry();
});
