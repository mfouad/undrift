/* Ticks once a second; worker timers keep running when the tab is in the background. */
setInterval(function () { postMessage(0); }, 1000);
