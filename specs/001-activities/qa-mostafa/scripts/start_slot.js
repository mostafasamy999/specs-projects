// Run right before the create form's start wheel opens: the wheel starts at
// now rounded up to 5 minutes, and that is what the card will show.
//   output.startOnCard   "5 Nov 2026 · 14:35"
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function pad(n) { return (n < 10 ? '0' : '') + n; }
var slot = new Date(Math.ceil(new Date().getTime() / 300000) * 300000);
output.startOnCard = slot.getDate() + ' ' + MON[slot.getMonth()] + ' ' + slot.getFullYear() +
  ' · ' + pad(slot.getHours()) + ':' + pad(slot.getMinutes());
