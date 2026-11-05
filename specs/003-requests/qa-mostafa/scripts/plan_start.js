// Plans the start date for this try. Needs output.initIso: the day the
// start wheel opened on (today or tomorrow). Try n asks for the same day n
// months later (a one-day leave: end = start), so a period that is "already
// applied" is skipped by moving on a month.
//
// The leave form's wheel (CupertinoDatePicker, date mode, en: month | day |
// year) turns each column on its own and doesn't carry over, so the plan is:
// year column up `ySwipes` rows, then month column up `mSwipes` rows. When a
// month is shorter than the day, the wheel pulls the day back to the month's
// last day, and that sticks; the simulation below does the same.
//   output.attempt      +1
//   output.ySwipes      rows to turn the year column
//   output.mSwipes      rows to turn the month column
//   output.leaveIso     "2026-12-05": the field text expected after Done
//   output.leaveUs      "12/05/2026": the same day for the filter's picker
function pad(n) { return (n < 10 ? '0' : '') + n; }
function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); } // m: 0-11

output.attempt = output.attempt + 1;

var p = output.initIso.split('-');
var y = +p[0], m = +p[1] - 1, d = +p[2];
var targetIndex = y * 12 + m + output.attempt;
var ty = Math.floor(targetIndex / 12), tm = targetIndex % 12;

var ySwipes = ty - y;
var mSwipes = (tm - m + 12) % 12;

// Same order as the swipes: years first, then month by month.
for (var i = 0; i < ySwipes; i++) { y = y + 1; d = Math.min(d, daysIn(y, m)); }
for (var j = 0; j < mSwipes; j++) { m = (m + 1) % 12; d = Math.min(d, daysIn(y, m)); }

output.ySwipes = ySwipes;
output.mSwipes = mSwipes;
output.leaveIso = y + '-' + pad(m + 1) + '-' + pad(d);
output.leaveUs = pad(m + 1) + '/' + pad(d) + '/' + y;
