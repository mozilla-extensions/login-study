# Data Collected for Google Login Check Study

This document describes the data collected for the google login check study. The purpose of the study is to understand if Firefox users are being signed out of their Google accounts unintentionally.

Data will be collected from a small sample of clients in a one-off fashion: the addon collects and sends a single ping after it is installed, then uninstalls.

The chart below describes the complete list of measurements collected via the addon. Some of the measurements are duplicated from existing telemetry and some are new measurements.

| Measurement Description|Data Collection Category|Tracking Bug #|
|---|---|---|
|How many days old if the Firefox profile?|2|1122052|
|How many days has Firefox been running for?|   2|  1204823 |
|Is the password manager enabled? | 2  | 1643383  |
|Does the client have a saved login for accounts.google.com?|2   |  1643383 |
|Number of accounts.google.com logins per month the saved login existed|2   | 1643383  |
|How many days old is the oldest cookie?|   2|  1643383 |
|Does the client currently have a accounts.google.com login cookie?|2   | 1643383  |
|How many days old is an accounts.google.com login cookie? |2   | 1643383  |
|Is permanent private browsing enabled? |2   | 1643383  |
|Does the client have set “Delete cookies and site data when Firefox is closed?”|  2 |  1589753, 1617241 |
|Are there any exception to block/allow cookies?| 2  | 1589753, 1617241  |
|Has the client set “Clear History when Firefox closes”?   |2   |1589753, 1617241 |
|Are cookies blocked by default? |  2 |  1484251,  1561384  |
|Which addons does the client have installed?|2   |1122050|
|Client's session restore setting|2   | 1643383  |
|Default search engine is a Google built-in one   | 2  | 1138503  |
|How many days old is the oldest history visit? |2   |   1643383|
|Average number of days per month with a history visit |2   |   1643383|
|Number of days accounts.google.com was visited per month |2   |   1643383|
|Does the client have any searches with ads (last 14 days)? |2   |   1495548, 1505411|
|Does the client have any ad clicks (last 14 days)?|2   |  1495548, 1505411|

These data are sent in a custom ping with no other telemetry identifiers or environment information.
