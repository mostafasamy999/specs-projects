// Test data for CRT-FLT-01. Runs on the machine running Maestro, so that
// machine and the device must share a time zone.
//   output.title         QA-M-<ms>, unique per run
//   (output.startOnCard is set by start_slot.js, when the form opens the wheel)
//   output.fromToday     "Thu, 5 Nov 2026 · 00:00": filter start field text
//   output.fromTomorrow  same for tomorrow
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dmy(d) { return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
function field(d) { return DAY[d.getDay()] + ', ' + dmy(d) + ' · 00:00'; }

var now = new Date();
var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

output.title = 'QA-M-' + now.getTime();
output.fromToday = field(now);
output.fromTomorrow = field(tomorrow);
