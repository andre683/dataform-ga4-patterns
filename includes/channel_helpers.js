const channelCategory = (source, medium, source_medium, campaign, url_campaign_id, url_fbclid, url_gclid, url_wbraid, landing_page) => `
  CASE
    --- exception --
    WHEN ${source} = 'recruitment_print'
      AND ${medium} = 'direct_mail_self_mailer'
    THEN 'RM Direct Mail'

    ----- 5 RM PAID SEARCH -----
    WHEN ${url_gclid} IS NOT NULL
      OR ${url_wbraid} IS NOT NULL
      OR (
        REGEXP_CONTAINS(${source_medium}, r'(\\b|_)(google|bing|yahoo)(\\b|_)')
        AND REGEXP_CONTAINS(${source_medium}, r'(\\b|_)(cpc|search.?engine|search|sem)(\\b|_)')
      )
      OR (
        REGEXP_CONTAINS(${source_medium}, r'(\\b|_)(cpc|search.?engine)(\\b|_)')
      )
    THEN 'Paid Search'

    ----- 6 RM PAID SOCIAL -----
    WHEN (
      ${url_fbclid} IS NOT NULL
      OR REGEXP_CONTAINS(${source_medium}, r'\\b(fb|facebook|ig|instagram|paidsocial|meta|paid[-_]?social)(\\b|_)')
      )
      AND NOT REGEXP_CONTAINS(${source_medium}, r'(referral|organic)')
    THEN 'Paid Social'

    ----- 1 CM EMAIL -----
    WHEN (
        ${source} IN ('bronto', 'adobe')
        AND ( ${medium} IN ('email', 'none') OR ${medium} IS NULL )
        AND ${campaign} NOT LIKE '%sitemana%'
        )
        OR ${source} = 'your-crm-platform'
    THEN 'CM Email'

    ----- 17 DIRECT -----
    WHEN (
      ${source} = 'none'
      AND ${medium} = 'none'
      AND ${url_campaign_id} IS NULL
      )
      OR (
      REGEXP_CONTAINS(${source_medium}, r'walk[_ ]?up[_ ]?web|^exit_intent|^brand-direct.example.com')
      )
    THEN 'Direct'

    ----- 2 CM DIRECT MAIL -----
    WHEN REGEXP_CONTAINS(${source}, r'^(cm_dm|qr)|advent')
        OR ${medium} LIKE 'direct_mail_%'
    THEN 'CM Direct Mail'

    ----- 3 CM SMS -----
    WHEN ${source} LIKE '%attentive%'
    THEN 'SMS'

    ----- 4 CM NARVAR -----
    WHEN REGEXP_CONTAINS(${source_medium}, r'narvar|staticrecommendations')
    THEN 'Narvar'

    ----- 7 RM EMAIL -----
    WHEN (
        REGEXP_CONTAINS(${source_medium}, r'\\b(email|yieldify|walk[-_ ]?up_retail|safe_?opt)\\b')
        AND NOT REGEXP_CONTAINS(${source_medium}, r'\\breferral$\\b')
        ) OR (
        ${source_medium} = 'adobe / email'
        AND ${campaign} LIKE '%sitemana%'
        )
    THEN 'RM Email'

    ----- 8 RM AFFILIATES -----
    WHEN (
      REGEXP_CONTAINS(${source_medium}, r'affiliate|rakuten')
      ) OR (
      ${landing_page} LIKE '%ranMID=%'
      )
    THEN 'Affiliate'

    ----- 9 RM INSERTS -----
    WHEN REGEXP_CONTAINS(${source_medium}, r'insert|styrene|hangtag')
    THEN 'Inserts'

    ----- 10 RM OTP -----
    WHEN ${source_medium} LIKE '%otp%'
      OR ${medium} = 'news_rop'
    THEN 'OTP'

    ----- 12 RM DIRECT MAIL -----
    WHEN (
      REGEXP_CONTAINS(${medium}, r'directmail|direct_mail$|dm')
      ) OR (
      ${landing_page} LIKE '%/splash_template.jsp%'
      )
    THEN 'RM Direct Mail'

    ----- 13 RM MGM -----
    WHEN REGEXP_CONTAINS(${source}, r'friendbuy|mention_me|mention-me.com')
    THEN 'MGM'

    ----- 11 RM DISPLAY -----
    WHEN REGEXP_CONTAINS(${source_medium}, r'^gonift|quancast|display| / website$')
      AND NOT ${source_medium} LIKE '%facebook%'
    THEN 'Display'

    ----- 14 RM OTHER
    WHEN REGEXP_CONTAINS(${source_medium}, r'^jets /|/ (tv|radio)$|^print_qr_code|web_cardlinking$|^amex /|web[_ ]?others|rc_online|social[_ ]?discount|organic.social|wuw_web|wuw$|/ podcast$|(fb|ig) / organic')
    THEN 'RM Other'

    ----- 15 ORGANIC -----
    WHEN ${medium} = 'organic'
    THEN 'Organic Search'

    ----- 16 REFERRAL -----
    WHEN REGEXP_CONTAINS(${source_medium}, r'referral$|^pr /|^oprahdaily.com|^thespruce.com|^californiawineryadvisor.com|^wine_searcher|^sur_la_table|trustpilot|chatgpt|perplexity|reddit')
    THEN 'Referral'

    ----- 18 UNMAPPED -----
    ELSE NULL

  END
`;

// marketingGroupId assigns a numeric ID used to join dim_channel_map,
// which resolves to marketing_category, funnel_category, channel_category,
// and campaign_category labels.
const marketingGroupId = (channel, campaign, gads_campaign, term, url_wbraid, source, medium, source_medium) => `
  CASE
    -----** CM EMAIL **-----
    WHEN ${channel} = 'CM Email'
        AND ${campaign} LIKE '%abandon%'
    THEN 1 --'Behavioral Triggers'

    WHEN ${channel} = 'CM Email'
        AND REGEXP_CONTAINS(${campaign}, r'\\[?20\\d{2}(/|%2f)(0[1-9]|1[0-2])|automate sms|advantage confirmation|advantage renew|browse recovery|club cancel|corona virus|email new|forgot.password|mini preview|order acknowledgement|order confirm|preferences|rate and review|registration confirm|shipment confirm|sundance|welcome to the brand|^transactional$')
    THEN 3 --'Transactional'

    WHEN ${channel} = 'CM Email'
        AND NOT REGEXP_CONTAINS(${campaign}, r'\\[?20\\d{2}(/|%2f)(0[1-9]|1[0-2])|automate sms|advantage confirmation|advantage renew|browse recovery|club cancel|corona virus|email new|forgot.password|mini preview|order acknowledgement|order confirm|preferences|rate and review|registration confirm|shipment confirm|sundance|welcome to the brand|^transactional$')
    THEN 2 --'Promotional'


    -----** CM DIRECT MAIL **-----
    WHEN ${channel} = 'CM Direct Mail'
        AND (
            ${campaign} LIKE '%_up%'
            OR ${source} = 'upgrade'
            )
    THEN 4 --'Upgrade'

    WHEN ${channel} = 'CM Direct Mail'
        AND (
            ${campaign} LIKE '%_react%'
            OR ${source} = 'reactivation'
            )
    THEN 5 --'Reactivation'

    WHEN ${channel} = 'CM Direct Mail'
        AND (
            ${campaign} LIKE '%_holidayship'
            OR ${source} = 'holiday'
            )
    THEN 6 --'Holiday'

    WHEN ${channel} = 'CM Direct Mail'
        AND (
            REGEXP_CONTAINS(${campaign}, r'_(wave_?\\d|wd|presale)')
            OR ${source} = 'main')
    THEN 7 --'Main Offer'


    -----** SMS **-----
    WHEN ${channel} = 'SMS'
      AND ${campaign} LIKE '%abandon%'
    THEN 8 --'Behavioral Triggers'

    WHEN ${channel} = 'SMS'
    THEN 9 --'Promotional'


    -----** NARVAR **-----
    WHEN ${channel} = 'Narvar'
    THEN 10 --'General'


    -----** PAID SEARCH **-----
    WHEN ${channel} = 'Paid Search'
      AND REGEXP_CONTAINS(LOWER(COALESCE(NULLIF(${gads_campaign}, ''), ${campaign})), r'_br|brand|-b-|- b -')
    THEN 11 -- Branded Search

    WHEN ${channel} = 'Paid Search'
      AND REGEXP_CONTAINS(LOWER(COALESCE(NULLIF(${gads_campaign}, ''), ${campaign})), r'_nb|generic|-g-|- g -')
    THEN 12 -- Generic Search

    WHEN ${channel} = 'Paid Search'
      AND REGEXP_CONTAINS(LOWER(COALESCE(NULLIF(${gads_campaign}, ''), ${campaign})), r'pmax|performance max')
    THEN 13 -- Performance Max

    WHEN ${channel} = 'Paid Search'
      AND LOWER(COALESCE(NULLIF(${gads_campaign}, ''), ${campaign})) LIKE '%shopping%'
    THEN 14 -- Shopping

    WHEN ${channel} = 'Paid Search'
      AND (
        REGEXP_CONTAINS(LOWER(COALESCE(NULLIF(${gads_campaign}, ''), ${campaign})), r'-yt-|- yt -|demand gen')
        OR ${url_wbraid} IS NOT NULL
      )
    THEN 15 -- Demand Gen

    WHEN ${channel} = 'Paid Search'
    THEN 16 --'Other'

    -----** PAID SOCIAL **-----
    WHEN ${channel} = 'Paid Social'
      AND REGEXP_CONTAINS(${term}, r'(retargeting|reengagement)')
    THEN 17 --'Retargeting'

    WHEN ${channel} = 'Paid Social'
      AND ${campaign} LIKE '%prospecting%'
      AND NOT REGEXP_CONTAINS(${campaign}, r'(event|sweepstakes)')
    THEN 18 --'Prospecting'

    WHEN ${channel} = 'Paid Social'
      AND ${campaign} LIKE '%traffic%'
      AND NOT REGEXP_CONTAINS(${campaign}, r'(event|sweepstakes)')
    THEN 19 --'Traffic'

    WHEN ${channel} = 'Paid Social'
      AND ${campaign} LIKE '%_std%'
      AND NOT REGEXP_CONTAINS(${campaign}, r'(event|sweepstakes)')
    THEN 20 --'Standard'

    WHEN ${channel} = 'Paid Social'
        AND ${campaign} LIKE '%_club%'
        AND NOT REGEXP_CONTAINS(${campaign}, r'(event|sweepstakes)')
    THEN 21 --'Club'

    WHEN ${channel} = 'Paid Social'
    THEN 22 --'Other'


    -----** RM EMAIL **-----
    WHEN ${channel} = 'RM Email'
      AND (
        REGEXP_CONTAINS(${source_medium}, r'safe_?opt|walk.?up_retail')
        OR ${campaign} LIKE '%sitemana%'
      )
    THEN 23 --'Behavioral Triggers'

    WHEN ${channel} = 'RM Email'
    THEN 24 --'Promotional'


    -----** RM AFFILIATE **-----
    WHEN ${channel} = 'Affiliate'
    THEN 25 --'Affiliate'

    -----** RM INSERTS **-----
    WHEN ${channel} = 'Inserts'
    THEN 26 --'Inserts'

    -----** RM OTP **-----
    WHEN ${channel} = 'OTP'
    THEN 27 --'OTP'

    -----** RM DISPLAY **-----
    WHEN ${channel} = 'Display'
    THEN 28 --'Display'

    -----** RM DIRECT MAIL **-----
    WHEN ${channel} = 'RM Direct Mail'
    THEN 29 --'Direct Mail'

    -----** RM MGM **-----
    WHEN ${channel} = 'MGM'
    THEN 30 --'MGM'

    -----** RM OTHER **-----
    WHEN ${channel} = 'RM Other'
    THEN 31 --'Other'

    -----** DIRECT **-----
    WHEN ${channel} = 'Direct'
    THEN 32 --'Direct'

    -----** ORGANIC SEARCH **-----
    WHEN ${channel} = 'Organic Search'
    THEN 33 --'Organic Search'

    -----** REFERRAL **-----
    WHEN ${channel} = 'Referral'
    THEN 34 --'Referral'

    -----** UNMAPPED **-----
    ELSE NULL
  END
`;

module.exports = {
    channelCategory,
    marketingGroupId
};
