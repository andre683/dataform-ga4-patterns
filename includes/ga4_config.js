const { brands } = require("includes/brands");

const ga4_config = {
  // start date for full refreshes
  START_DATE: "2023-07-01",

  // keep these lowercase, host-only
  REFERRALS_EXCLUDED: [
    "aax.amazon-adsystem.com",
    "adclick.g.doubleclick.net",
    "adsmanager.facebook.com",
    "app.asana.com",
    "audioeye.atlassian.net",
    "auditportal.audioeye.com",
    "business.facebook.com",
    "c.amazon-adsystem.com",
    "your-company.atlassian.net",
    "your-company.sharepoint.com",
    "your-company.experiencecloud.adobe.com",
    "your-company.adobe-campaign.com",
    "docs.google.com",
    "excel.officeapps.live.com",
    "gbc-excel.officeapps.live.com",
    "login.microsoftonline.com",
    "r.fkzf.com",
    "safeframe.googlesyndication.com",
    "storage.googleapis.com",
    "tagassistant.google.com",
    "teams.microsoft.com",
    "trello.com",
    "ukc-excel.officeapps.live.com",
    "ukc-word-edit.officeapps.live.com",
    "ukc-word-view.officeapps.live.com",
    "usc-excel.officeapps.live.com",
    "usc-word-edit.officeapps.live.com",
    "word-edit.officeapps.live.com",
    "word-view.officeapps.live.com",
    "com.slack",
    "euc-excel.officeapps.live.com",
    "analytics.google.com",
    "optimize.google.com",
    "app.fullstory.com",
    "admanager.google.com",
    "bazaarvoice1.lightning.force.com",
    "cdn.experience.adobe.net"
  ],

  // Countries excluded from all sessions:
  // some are known bot-proxy geographies; others (e.g. India) are where
  // the development team is based and produce internal traffic.
  COUNTRIES_EXCLUDED: [
    "India",
    "China",
    "Singapore",
    "Hong Kong",
    "Japan"
  ]
};

// Country filter
const countryFilter = (countryExpr, excluded = ga4_config.COUNTRIES_EXCLUDED) => `
(
  ${countryExpr} IS NULL
  OR ${countryExpr} NOT IN (${excluded.map(c => `'${c}'`).join(", ")})
)
`;

// Brand/hostname filter
const hostnameFilter = (brandExpr, deviceHostnameExpr, pageHostnameExpr) => {
  const clauses = brands.map(b => {
    const hostList = b.hostname.map(h => `'${String(h).toLowerCase()}'`).join(", ");
    return `(
      ${brandExpr} = '${b.brand}'
      AND LOWER(COALESCE(${deviceHostnameExpr}, ${pageHostnameExpr})) IN (${hostList})
    )`;
  });

  return `(${clauses.join(" OR ")})`;
};

module.exports = {
  ga4_config,
  countryFilter,
  hostnameFilter
};
