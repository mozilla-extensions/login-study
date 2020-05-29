

browser.browserAction.onClicked.addListener(async () => {
  await browser.tabs.create({
    url: "debug-page/index.html",
  });

  const sendTelemetry = async () => {

    const password_manager_enabled = await browser.prefs.getBoolPref("signon.rememberSignons");
    const browser_privatebrowsing_autostart = await browser.prefs.getBoolPref("browser.privatebrowsing.autostart");
    const network_cookie_lifetime_policy = await browser.prefs.getIntPref("network.cookie.lifetimePolicy");
    const privacy_sanitize_sanitize_on_shutdown = await browser.prefs.getBoolPref("privacy.sanitize.sanitizeOnShutdown");
    const privacy_clear_on_shutdown_cookies = await browser.prefs.getBoolPref("privacy.clearOnShutdown.cookies");
    const network_cookie_cookie_behavior = await browser.prefs.getIntPref("network.cookie.cookieBehavior");
    const browser_startup_page = await browser.prefs.getIntPref("browser.startup.page");

    const payload = {
      loginstudy:
      {
        password_manager_enabled,
        browser_privatebrowsing_autostart,
        network_cookie_lifetime_policy,
        privacy_sanitize_sanitize_on_shutdown,
        privacy_clear_on_shutdown_cookies,
        network_cookie_cookie_behavior,
        browser_startup_page,

      },
    };


    // addClientId defaults to false, being explicit.
    TelemetryController.submitExternalPing("normandy-login-study", payload, {addClientId: false});
  };

  await sendTelemetry();
});
