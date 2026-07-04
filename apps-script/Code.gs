/**
 * Google Apps Script web app: receives calculator lead submissions and appends
 * each one as a row in a Google Sheet. Free, no third-party service.
 *
 * SETUP
 * 1. Create a Google Sheet (this will hold the leads).
 * 2. Extensions -> Apps Script. Delete the sample, paste this whole file in. Save.
 * 3. Deploy -> New deployment -> gear icon -> "Web app".
 *      - Description: anything
 *      - Execute as:  Me
 *      - Who has access: Anyone
 *    Click Deploy, authorise when prompted, and copy the "Web app URL" (ends /exec).
 * 4. In Vercel: Settings -> Environment Variables -> set VITE_LEAD_WEBHOOK_URL to
 *    that /exec URL. Redeploy (Vite bakes env vars in at build time).
 * 5. Submit a test lead on the site — a new row appears in the "Leads" tab.
 *
 * To change what's captured, edit COLUMNS below. Unknown payload keys are
 * ignored; missing ones are left blank. Redeploy after editing (Deploy -> Manage
 * deployments -> edit -> new version) so the live URL runs the new code.
 */

var SHEET_NAME = 'Leads';

// Columns written, in order. These match the calculator's payload field names.
var COLUMNS = [
  'submittedAt',
  'email',
  'hotelName',
  'name',
  'consent',
  'revenuePath',
  'adr',
  'monthlyRoomNights',
  'rooms',
  'occupancy',
  'otaSharePct',
  'commissionPct',
  'targetShiftPct',
  'directCostOfSalePct',
  'annualRoomRevenue',
  'otaRevenue',
  'currentCommissionCost',
  'netAnnualRecovery',
  'monthlyRecovery',
  'threeYearRecovery',
  'source'
];

function doPost(e) {
  // Lock so simultaneous submissions don't collide on the same row.
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    // The calculator sends form-encoded fields (e.parameter). A JSON body
    // (e.postData.contents) is also accepted as a fallback.
    var data =
      e.parameter && Object.keys(e.parameter).length
        ? e.parameter
        : JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    ensureHeader_(sheet);
    var row = COLUMNS.map(function (key) {
      var v = data[key];
      return v === undefined || v === null ? '' : v;
    });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Opening the /exec URL in a browser hits this — a quick "it's live" check.
function doGet() {
  return json_({ ok: true, message: 'Lead capture endpoint is live. POST JSON here.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
