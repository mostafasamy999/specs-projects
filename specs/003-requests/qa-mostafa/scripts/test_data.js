// Fixed data for LV-FLT-01, set once at the start. Dates use the clock of
// the machine running Maestro: it must share the device's time zone.
//   output.todayIso / tomorrowIso   "2026-11-05": the leave form shows dates
//                                   as yyyy-MM-dd; the start wheel opens on
//                                   one of these (tomorrow when today is
//                                   blocked for this account)
//   output.todayUs / yesterdayUs    "11/05/2026": what the filter's date
//                                   picker takes in its typed-input mode
//   output.attempt                  0; plan_start.js counts up per try
//   output.state                    'retry' | 'done' | 'fatal'
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function us(d) { return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(); }

var now = new Date();
var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
var tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

output.todayIso = iso(today);
output.tomorrowIso = iso(tomorrow);
output.todayUs = us(today);
output.yesterdayUs = us(yesterday);
output.attempt = 0;
output.state = 'retry';
output.message = '';
