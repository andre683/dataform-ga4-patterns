const brands = [
  {
    brand: "BRAND_A",
    property_id: "000000001",
    dataset: "ga4_brand_a_source",
    hostname: ["www.brand-a.example.com", "auth.brand-a.example.com"],
    gsc_dataset: "gsc_brand_a",
    gads_customer_id: 0000000001
  },
  {
    brand: "BRAND_B",
    gsc_tag: "brand_b",
    gsc_url: "https://www.brand-b.example.com/",
    property_id: "000000002",
    dataset: "ga4_brand_b_source",
    hostname: ["www.brand-b.example.com", "auth.brand-b.example.com"],
    gsc_dataset: "gsc_brand_b",
    gads_customer_id: 0000000002
  },
  {
    brand: "BRAND_C",
    property_id: "000000003",
    dataset: "ga4_brand_c_source",
    hostname: ["www.brand-c.example.com", "auth.brand-c.example.com"],
    gsc_dataset: "gsc_brand_c",
    gads_customer_id: 0000000003
  },
  {
    brand: "BRAND_D",
    property_id: "000000004",
    dataset: "ga4_brand_d_source",
    hostname: ["www.brand-d.example.com", "auth.brand-d.example.com"],
    gsc_dataset: "gsc_brand_d",
    gads_customer_id: 0000000004
  },
  {
    brand: "BRAND_E",
    property_id: "000000005",
    dataset: "ga4_brand_e_source",
    hostname: ["www.brand-e.example.com", "auth.brand-e.example.com"],
    gsc_dataset: "gsc_brand_e",
    gads_customer_id: 0000000005
  },
  {
    brand: "BRAND_F",
    property_id: "000000006",
    dataset: "ga4_brand_f_source",
    hostname: ["www.brand-f.example.com", "auth.brand-f.example.com"],
    gsc_dataset: "gsc_brand_f",
    gads_customer_id: 0000000006
  },
  {
    brand: "BRAND_G",
    property_id: "000000007",
    dataset: "ga4_brand_g_source",
    hostname: ["www.brand-g.example.com", "auth.brand-g.example.com"],
    gsc_dataset: "gsc_brand_g",
    gads_customer_id: 0000000007
  },
  {
    brand: "BRAND_H",
    property_id: "000000008",
    dataset: "ga4_brand_h_source",
    hostname: ["www.brand-h.example.com", "auth.brand-h.example.com"],
    gsc_dataset: "gsc_brand_h",
    gads_customer_id: 0000000008
  }
];

// Build brand/hostname predicate for filtering
function buildHostnameFilter() {
  return brands.map(b =>
    `(brand = '${b.brand}' AND COALESCE(device_hostname, page_hostname) IN (${b.hostname.map(h => `'${h}'`).join(", ")}))`
  ).join(" OR ");
}

// Build dynamic CASE for Google Ads mapping
const buildGadsCase = (customer_id) => `
  CASE
    ${brands
      .filter(b => (b.gads_customer_id))
      .map(b => `WHEN ${customer_id} = ${b.gads_customer_id} THEN '${b.brand}'`)
      .join("\n    ")}
    ELSE 'UNMAPPED'
  END
`;

module.exports = { brands, buildHostnameFilter, buildGadsCase };
