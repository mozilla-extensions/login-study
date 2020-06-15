# Login Study

This is based on the [2019-style Normandy add-on study](https://github.com/mozilla/normandy-nextgen-study-example).

## Development

```bash
yarn install
yarn build
```

Several built add-ons will be placed in `./web-ext-artifacts/`. Each is
nearly identical except for the extension ID, which includes the name of the
variant built. The variants are "a", "b", and "c". Nothing changes about the
add-on in each variant except the ID.

## Installing the Add-on

Run one of the variants:

```bash
yarn run start:a
yarn run start:b
yarn run start:c
```

For the add-on to work, it must be used in a version of Firefox with the
Normandy Studies web-extension APIs available. These should be available in
Firefox 69 or above, starting with Nightly 2019-06-28. Additionally, it must
be run on a pre-release build, such as Nightly, Dev-Edition, or an unbranded
build, and the preference `extensions.legacy.enabled` must be set to true.

## Testing the Addon
- Click the green puzzle piece, this will trigger a custom telemetry ping to send. Note: this is for testing purposes, and will not be in the final version.
- Navigate to about:telemetry and view the "archived ping data".
- Select `Normandy-login-study` and the timestamp you want to inspect.
- You should see the custom ping data. 

- Note: in order to use `browser.normandyAddonStudy.endStudy`, you must create the study as if it has been added by Normandy. Run the following code in your browser console before trying to end the study.
```
const { AddonStudies } = ChromeUtils.import(
  "resource://normandy/lib/AddonStudies.jsm",
);
await AddonStudies.add({
  recipeId: 42,
  slug: "test",
  userFacingName: "Test",
  userFacingDescription: "Description",
  branch: "red",
  active: true,
  addonId: "normandy-nextgen-study-example-a@mozilla.org",
  addonUrl:
    "https://example.com/normandy-nextgen-study-example-a@mozilla.org-signed.xpi",
  addonVersion: "0.1.0",
  extensionApiId: 1,
  extensionHash: "badhash",
  hashAlgorithm: "sha256",
  studyStartDate: new Date(),
  studyEndDate: null,
});
```

## Example Payload on a New Profile
```


{
  "password_manager_enabled": false,
  "browser_privatebrowsing_autostart": false,
  "network_cookie_lifetime_policy": 0,
  "privacy_sanitize_sanitize_on_shutdown": false,
  "privacy_clear_on_shutdown_cookies": true,
  "network_cookie_cookie_behavior": 4,
  "browser_startup_page": 0,
  "session_days_old": 0,
  "profile_days_old": 0,
  "logins_accounts": false,
  "logins_accounts_uses_per_month": 0,
  "google_accounts_cookie_present": false,
  "google_accounts_cookie_days_old": null,
  "has_allow_cookie_exceptions": false,
  "has_block_cookie_exceptions": false,
  "cookies_oldest_days_old": 0,
  "activeAddons": [
    {
      "id": "doh-rollout@mozilla.org",
      "name": "DoH Roll-Out"
    },
    {
      "id": "formautofill@mozilla.org",
      "name": "Form Autofill"
    },
    {
      "id": "screenshots@mozilla.org",
      "name": "Firefox Screenshots"
    },
    {
      "id": "webcompat-reporter@mozilla.org",
      "name": "WebCompat Reporter"
    },
    {
      "id": "webcompat@mozilla.org",
      "name": "Web Compat"
    },
    {
      "id": "firefox-compact-dark@mozilla.org",
      "name": "Dark"
    },
    {
      "id": "login-telemetry-study-a@mozilla.org",
      "name": "Login Telemetry Study"
    },
    {
      "id": "google@search.mozilla.org",
      "name": "Google"
    },
    {
      "id": "amazon@search.mozilla.org",
      "name": "Amazon.co.uk"
    },
    {
      "id": "bing@search.mozilla.org",
      "name": "Bing"
    },
    {
      "id": "ddg@search.mozilla.org",
      "name": "DuckDuckGo"
    },
    {
      "id": "ebay@search.mozilla.org",
      "name": "eBay"
    },
    {
      "id": "twitter@search.mozilla.org",
      "name": "Twitter"
    },
    {
      "id": "wikipedia@search.mozilla.org",
      "name": "Wikipedia (en)"
    },
    {
      "id": "gmp-gmpopenh264",
      "name": "OpenH264 Video Codec provided by Cisco Systems, Inc."
    },
    {
      "id": "gmp-widevinecdm",
      "name": "Widevine Content Decryption Module provided by Google Inc."
    }
  ],
  "default_search_engine_is_google": true,
  "default_private_search_engine_is_google": true,
  "accounts_days_visited_per_month": 0,
  "has_browser_search_with_ads": false,
  "has_browser_search_ad_clicks": false,
  "history_oldest_days_old": null
}
```
