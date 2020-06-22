# Google Login Check
This study will help us understand if Firefox users are being signed out of their Google accounts unintentionally. Learning about the Google accounts login state for our users will help us deliver an optimal experience in Firefox.

This is based on the [2019-style Normandy add-on study](https://github.com/mozilla/normandy-nextgen-study-example).

## Development

```bash
yarn install
yarn build
```

Several built add-ons will be placed in `./web-ext-artifacts/`.

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
- Wait 1 minute
- Navigate to about:telemetry and view the "archived ping data".
- Select `normandy-login-study` and the timestamp you want to inspect.
- You should see the custom ping data. 
- Note: `browser.normandyAddonStudy.endStudy` will throw an error unless this addon has been installed through Normandy.

## Example Payload on a New Profile
```json
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
  "history_average_days_per_month": 0,
  "history_oldest_days_old": null
}
```

Read our [Data Disclosure](login-check-metrics.md)
