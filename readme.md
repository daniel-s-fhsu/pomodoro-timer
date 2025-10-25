Pomodoro Timer

The prototype PWA allows the user to time events.  When fully implemented, it will time the user for a 25-minute focus session and then a 5-minute break.  It should make use of push notifications to allow the user to be notified when the application completes a timer cycle.

It will track the usage stats per user and upload those for display on a statistics page.

It should run when published.  To run in a dev environment, make sure node is installed and run
"npx serv ."
from inside the application directory.

To install on a phone (running on LAN), run this command (starts HTTPS server):
"npx http-server -S -C localhost+2.pem -K localhost+2-key.pem ."

Service Worker and Caching Strategy
File: service-worker.js
On install, the service worker pre-caches the essential files.
On fetch, it serves cached responses first in order to allow offline use.
On activation, it removes outdated cache versions to prevent stale data.

The manifest is manifest.json.  Contains display names and icon definitions.