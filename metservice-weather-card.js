/**
 * metservice-weather-card  v0.1.0
 * A compact weather card built around the MetService NZ integration.
 * Full documentation, with every option explained: README.md
 * Licence: MIT (see LICENSE).  Unofficial community project, not affiliated with MetService or Home Assistant.
 *
 * Third-party artwork contained in this file (full licence texts: THIRD_PARTY_NOTICES.md in the repository):
 *   - Sunrise / sunset marker artwork: Meteocons Line, (c) 2020-present Bas Milius, MIT licence
 *   - Outlined solar icon: derived from the Material Design Icons "solar-power" glyph, Apache licence 2.0
 *
 * INSTALL
 *   1. Copy this file to  /config/www/metservice-weather-card.js
 *   2. Settings > Dashboards > Resources > Add:
 *        URL:  /local/metservice-weather-card.js?v=1     (bump ?v= after each edit)
 *        Type: JavaScript module
 *   3. Hard-refresh the browser (Ctrl+F5).
 *
 * MINIMAL CONFIG
 *   type: custom:metservice-weather-card
 *   weather_entity: weather.my_town_forecast
 *
 * Sensors are found automatically from the weather entity name:
 *   weather.my_town_forecast  ->  sensor.my_town_*   (override with sensor_prefix)
 *
 * OPTIONS  (the default is shown first; a "default:" note means it is worked out)
 *
 *  General
 *   name: Home                       # default: weather entity name minus "Forecast"
 *   sensor_prefix: my_town       # default: derived from weather_entity
 *   color_scheme: auto               # auto | light | dark   (auto measures the card background)
 *   clock_24h: auto                  # auto (HA profile) | true | false
 *   temperature_unit: auto           # auto (HA unit system) | C | F
 *   wind_unit: auto                  # auto (HA unit system) | km/h | m/s | mph | kn
 *   locale: en-NZ                    # default: your HA language (plain English follows the HA date format)
 *   time_zone: Pacific/Auckland      # default: your HA profile (browser or server)
 *   tomorrow_label: day_name         # day_name | tomorrow | none | any text
 *   footer: auto                     # auto | false | "custom text"
 *   cloud_entity: sensor.x           # source for the `cloud` stat (MetService has none)
 *   description_today / description_tomorrow: sensor.x    # default: the MetService description sensors
 *   entities: { temperature: sensor.x }    # redirect any base sensor (keys are those of DEF below, plus solar_remaining, sun)
 *   strings: { today: Aujourd'hui }        # replace any built-in wording (keys: STR below)
 *   sections: [header, sun, hourly, daily, stats, uv, pollen, tomorrow]   # order, or leave sections out
 *
 *  Icons
 *   icon_pack: builtin               # builtin | meteocons-line | meteocons-fill | meteocons-flat | custom
 *   icon_animation: header           # header (big icon only) | all | none      (Meteocons only)
 *   icon_contrast: auto              # auto | off | 0.5-1   darkens Meteocons icons on light cards (pale clouds)
 *   icon_path: /local/meteocons/line/  # custom pack: folder of Meteocons-named SVGs (clear-day.svg ...)
 *   icon_version: 0.1.0              # @meteocons/svg version loaded from the jsDelivr CDN
 *
 *  Blocks
 *   header:  { show_icon, show_condition, show_clock, show_feels_like, show_forecast_issued,
 *              show_warnings,                            # all true
 *              warning_details: collapsed }              # collapsed ("More details" button) | expanded | off
 *   hourly:  { show: true, hours: 12, label: "Next hours", show_day: true,
 *              show_sunset_marker: true, show_rain_start: true }
 *   daily:   { show: true, days: 7, style: bars,                # bars | graph
 *              visible_days: 5,                                 # graph: columns on screen, scroll for the rest
 *              show_rain: true,                                 # graph: rainfall under each day when the forecast has it
 *              show_solar: true, solar_entities: [],            # one sensor per day, index 0 = today
 *              solar_icon: none,                                # none | outline | mdi:icon-name
 *              low_color: "#06b6d4", high_color: "#f59e0b" }    # low and high ends of the bars and graph
 *   sun:     { show: false, show_times: true, show_daylight: true, show_countdown: true, label }   # solar arc
 *   uv:      { show: true, number_entity: sensor.x, entity, window_entity, show_scale: true, show_advice: true, label }
 *   pollen:  { show: true, entity, collapse_after: 6, show_descriptions: false, label }
 *
 *  Stats  (order = display order, two columns; giving a list replaces the default list)
 *   stats:
 *     - { type: max }
 *     - { type: cloud, entity: sensor.tomorrow_io_home_cloud_cover }
 *   types: max min humidity rain wind uv pressure moon cloud fire pollen
 *          solar_remaining sunrise sunset drying_am drying_pm drying_next entity
 *   every stat accepts: entity, name, icon (mdi:...), show: false
 *   rain: period (8h | 24h | last_hour), start_entity     wind: gust_entity, direction_entity, show_gust
 *   uv: window_entity, use_alert_label, show_advice       pressure: trend_entity
 *   entity (generic): entity, name, icon, unit, decimals
 */
(() => {
  const CARD = 'metservice-weather-card';

  /* ---------- data tables ---------- */
  // base sensor suffixes: sensor.<prefix>_<suffix>
  const DEF = {
    temperature: 'temperature', feels_like: 'temperature_feel',
    description_today: 'weather_description', description_tomorrow: 'weather_description_tomorrow',
    forecast_issued: 'forecast_issued', high_today: 'high_temperature_today', low_today: 'low_temperature_today',
    humidity: 'relative_humidity', rain_next_8h: 'rain_next_8_hours', rain_next_24h: 'rain_next_24_hours',
    rain_last_hour: 'rain_last_hour', next_rain: 'next_rain_expected',
    wind_speed: 'wind_speed', wind_gust: 'wind_gust', wind_direction: 'wind_direction',
    uv: 'uv_index', pressure: 'pressure', pressure_tendency: 'pressure_tendency',
    moon_phase: 'moon_phase', fire_danger: 'fire_danger', pollen: 'pollen',
    sunrise: 'sunrise', sunset: 'sunset',
    drying_morning: 'clothes_drying_morning', drying_afternoon: 'clothes_drying_afternoon',
    drying_next: 'clothes_drying_next_good_day',
    warnings: 'warnings', warning_details: 'warning_details', condition_today: 'condition_today',
  };
  const FULL = { sun: 'sun.sun' };
  const DEFAULT_STATS = ['max', 'min', 'humidity', 'rain', 'wind', 'pressure', 'moon', 'cloud', 'fire',
    'sunrise', 'sunset', 'drying_am', 'drying_pm'].map(type => ({ type }));

  // every piece of built-in wording; override any with `strings:` in the card config
  const STR = {
    today: 'Today', tomorrow: 'Tomorrow', feels_like: 'Feels like', issued: 'Forecast issued', rain_from: 'Rain from',
    sunrise: 'Sunrise', sunset: 'Sunset', hourly_label: 'Next hours', solar_est: 'Solar est. kWh', days: '{n}-day',
    gust: 'gust', left: 'left', from: 'from', to: 'to', clear: 'Clear', uv_dangerous: 'Dangerous', until: 'until', now: 'now', protection: 'Protection', uv_not_dangerous: 'Not dangerous',
    pollen_none: 'None', pollen_high: 'High', pollen_moderate: 'Moderate', pollen_low: 'Low', pollen_imminent: 'Imminent',
    more: '+{n} more', less: 'Show less', warn_more: 'More details', warn_less: 'Show less',
    sunrise_in: 'Sunrise in {t}', sunset_in: 'Sunset in {t}', daylight: '{t} of daylight',
    pollen_desc_imminent: 'Pollen production for this plant type is expected to start within the next 2 weeks.',
    pollen_desc_high: 'High pollen production. These pollens are in the air and are very likely to cause stronger allergic reactions in sensitised people.',
    pollen_desc_moderate: 'These pollens are in the air and are likely to cause significant allergy symptoms in sensitised people.',
    pollen_desc_low: 'The plant is releasing pollen, but only a little, or the pollen does not spread widely.',
    max: 'Max', min: 'Min', uv: 'UV', cloud: 'Cloud',
    fire: 'Fire', pollen: 'Pollen', drying_am: 'Drying AM', drying_pm: 'Drying PM', drying_next: 'Dry next', hrs: 'hrs',
  };

  const SUNP = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>';
  const CLOUDP = '<path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.5A3.3 3.3 0 0117 18z"/>';
  const CLOUD_UP = '<path d="M7 15a4 4 0 010-8 5.5 5.5 0 0110.6 1.5A3.3 3.3 0 0117 15z"/>';
  const MOONP = '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>';
  const P = {
    sun: SUNP, moon: MOONP, cloud: CLOUDP,
    partly: '<circle cx="8" cy="8" r="2.5"/><path d="M8 2.5v1M2.5 8h1M4 4l.7.7M12 4l-.7.7"/><path d="M8 21a3.5 3.5 0 010-7 5 5 0 019.6 1.3A3 3 0 0117 21z"/>',
    partlyn: '<path d="M10.5 3.5a4 4 0 100 7 3.5 3.5 0 010-7z"/><path d="M8 21a3.5 3.5 0 010-7 5 5 0 019.6 1.3A3 3 0 0117 21z"/>',
    rain: CLOUD_UP + '<path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    storm: CLOUD_UP + '<path d="M12 15l-2 3h3l-1 3"/>',
    snow: CLOUD_UP + '<path d="M8 18v.01M12 18v.01M16 18v.01M10 21v.01M14 21v.01"/>',
    fog: '<path d="M4 8h16M3 12h18M5 16h14M8 20h8"/>',
    wind: '<path d="M3 9h11a3 3 0 10-3-3M3 15h15a3 3 0 11-3 3M3 12h7"/>',
    rise: '<path d="M3 18h18M7 18a5 5 0 0110 0M12 4v5M9.5 6.5L12 4l2.5 2.5"/>',
    set: '<path d="M3 18h18M7 18a5 5 0 0110 0M12 3v5M9.5 5.5L12 8l2.5-2.5"/>',
    therm: '<path d="M10 4a2 2 0 014 0v9.5a4 4 0 11-4 0z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
    arrow: '<path d="M12 4v16M6 14l6 6 6-6"/>',
    gauge: '<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
    flower: '<circle cx="12" cy="12" r="2"/><path d="M12 10c-2-4-1-7 0-7s2 3 0 7zM12 14c2 4 1 7 0 7s-2-3 0-7zM10 12c-4 2-7 1-7 0s3-2 7 0zM14 12c4-2 7-1 7 0s-3 2-7 0z"/>',
    solar: '<path stroke-width="1.2" d="M11.45,2V5.55L15,3.77L11.45,2M10.45,8L8,10.46L11.75,11.71L10.45,8M2,11.45L3.77,15L5.55,11.45H2M10,2H2V10C2.57,10.17 3.17,10.25 3.77,10.25C7.35,10.26 10.26,7.35 10.27,3.75C10.26,3.16 10.17,2.57 10,2M17,22V16H14L19,7V13H22L17,22Z"/>',
    shirt: '<path d="M8 3l-5 3 2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 01-8 0z"/>',
    dot: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  };
  const ICOL = { sun: 'var(--mw-sun)', moon: 'var(--mw-moon)', partlyn: 'var(--mw-moon)', rain: 'var(--mw-rain)', storm: 'var(--mw-rain)', snow: 'var(--mw-moon)' };

  // Sunrise / sunset markers, from the Meteocons Line set (MIT). Redrawn inline so the horizon line, which is
  // near-black in the original files and vanishes on dark cards, follows the theme instead.
  const MC_EV = { rise: "<svg class=\"mi\" viewBox=\"0 0 128 128\" fill=\"none\" aria-hidden=\"true\"><g><g><path d=\"M37 92H53.7456C55.1989 92 56.6029 91.4725 57.6966 90.5155L62.0245 86.7286C63.1556 85.7389 64.8444 85.7389 65.9755 86.7286L70.3034 90.5155C71.3971 91.4725 72.8011 92 74.2544 92H91\" style=\"stroke:var(--n-sec)\" stroke-width=\"4\" stroke-linecap=\"round\"/></g><g><mask id=\"mwm-rise\" style=\"mask-type:alpha\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"9\" width=\"128\" height=\"77\"><path d=\"M0 9H128V86H75.0523C74.3711 86 73.7102 85.7682 73.1783 85.3426L67.7482 80.9985C65.5569 79.2455 62.4431 79.2455 60.2518 80.9985L54.8217 85.3426C54.2898 85.7682 53.6289 86 52.9477 86H0V9Z\" fill=\"black\"/></mask><g mask=\"url(#mwm-rise)\"><g><circle cx=\"64\" cy=\"81.9999\" r=\"18\" style=\"stroke:var(--mw-sun)\" stroke-width=\"4\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M64 34C65.1046 34 66 34.8954 66 36V48C66 49.1046 65.1046 50 64 50C62.8954 50 62 49.1046 62 48V36C62 34.8954 62.8954 34 64 34ZM30.0589 48.0589C30.8399 47.2778 32.1062 47.2778 32.8873 48.0589L41.3726 56.5441C42.1536 57.3252 42.1536 58.5915 41.3726 59.3726C40.5915 60.1536 39.3252 60.1536 38.5441 59.3726L30.0589 50.8873C29.2778 50.1062 29.2778 48.8399 30.0589 48.0589ZM97.9411 48.0589C98.7222 48.8399 98.7222 50.1062 97.9411 50.8873L89.4558 59.3726C88.6748 60.1536 87.4085 60.1536 86.6274 59.3726C85.8464 58.5915 85.8464 57.3252 86.6274 56.5441L95.1127 48.0589C95.8937 47.2778 97.1601 47.2778 97.9411 48.0589ZM16 82C16 80.8954 16.8954 80 18 80H30C31.1046 80 32 80.8954 32 82C32 83.1046 31.1046 84 30 84H18C16.8954 84 16 83.1046 16 82ZM96 82C96 80.8954 96.8954 80 98 80H110C111.105 80 112 80.8954 112 82C112 83.1046 111.105 84 110 84H98C96.8954 84 96 83.1046 96 82ZM41.3726 104.627C42.1536 105.408 42.1536 106.675 41.3726 107.456L32.8873 115.941C32.1062 116.722 30.8399 116.722 30.0589 115.941C29.2778 115.16 29.2778 113.894 30.0589 113.113L38.5441 104.627C39.3252 103.846 40.5915 103.846 41.3726 104.627ZM86.6274 104.627C87.4085 103.846 88.6748 103.846 89.4558 104.627L97.9411 113.113C98.7222 113.894 98.7222 115.16 97.9411 115.941C97.1601 116.722 95.8937 116.722 95.1127 115.941L86.6274 107.456C85.8464 106.675 85.8464 105.408 86.6274 104.627ZM64 114C65.1046 114 66 114.895 66 116V128C66 129.105 65.1046 130 64 130C62.8954 130 62 129.105 62 128V116C62 114.895 62.8954 114 64 114Z\" style=\"fill:var(--mw-sun)\"/></g></g></g></g></svg>", set: "<svg class=\"mi\" viewBox=\"0 0 128 128\" fill=\"none\" aria-hidden=\"true\"><g><g><path d=\"M37 91.9863H53.7456C55.1989 91.9863 56.6029 92.5138 57.6966 93.4708L62.0245 97.2577C63.1556 98.2474 64.8444 98.2474 65.9755 97.2577L70.3034 93.4708C71.3971 92.5138 72.8011 91.9863 74.2544 91.9863H91\" style=\"stroke:var(--n-sec)\" stroke-width=\"4\" stroke-linecap=\"round\"/></g><g><mask id=\"mwm-set\" style=\"mask-type:alpha\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"9\" width=\"128\" height=\"83\"><path d=\"M0 9H128V86H73.2195C71.7873 86 70.4023 86.5124 69.3148 87.4445L64 92L58.6852 87.4445C57.5977 86.5124 56.2127 86 54.7805 86H0V9Z\" fill=\"black\"/></mask><g mask=\"url(#mwm-set)\"><g><circle cx=\"64\" cy=\"81.9999\" r=\"18\" style=\"stroke:var(--mw-sun)\" stroke-width=\"4\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M64 34C65.1046 34 66 34.8954 66 36V48C66 49.1046 65.1046 50 64 50C62.8954 50 62 49.1046 62 48V36C62 34.8954 62.8954 34 64 34ZM30.0589 48.0589C30.8399 47.2778 32.1062 47.2778 32.8873 48.0589L41.3726 56.5441C42.1536 57.3252 42.1536 58.5915 41.3726 59.3726C40.5915 60.1536 39.3252 60.1536 38.5441 59.3726L30.0589 50.8873C29.2778 50.1062 29.2778 48.8399 30.0589 48.0589ZM97.9411 48.0589C98.7222 48.8399 98.7222 50.1062 97.9411 50.8873L89.4558 59.3726C88.6748 60.1536 87.4085 60.1536 86.6274 59.3726C85.8464 58.5915 85.8464 57.3252 86.6274 56.5441L95.1127 48.0589C95.8937 47.2778 97.1601 47.2778 97.9411 48.0589ZM16 82C16 80.8954 16.8954 80 18 80H30C31.1046 80 32 80.8954 32 82C32 83.1046 31.1046 84 30 84H18C16.8954 84 16 83.1046 16 82ZM96 82C96 80.8954 96.8954 80 98 80H110C111.105 80 112 80.8954 112 82C112 83.1046 111.105 84 110 84H98C96.8954 84 96 83.1046 96 82ZM41.3726 104.627C42.1536 105.408 42.1536 106.675 41.3726 107.456L32.8873 115.941C32.1062 116.722 30.8399 116.722 30.0589 115.941C29.2778 115.16 29.2778 113.894 30.0589 113.113L38.5441 104.627C39.3252 103.846 40.5915 103.846 41.3726 104.627ZM86.6274 104.627C87.4085 103.846 88.6748 103.846 89.4558 104.627L97.9411 113.113C98.7222 113.894 98.7222 115.16 97.9411 115.941C97.1601 116.722 95.8937 116.722 95.1127 115.941L86.6274 107.456C85.8464 106.675 85.8464 105.408 86.6274 104.627ZM64 114C65.1046 114 66 114.895 66 116V128C66 129.105 65.1046 130 64 130C62.8954 130 62 129.105 62 128V116C62 114.895 62.8954 114 64 114Z\" style=\"fill:var(--mw-sun)\"/></g></g></g></g></svg>" };
  const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const CONDTXT = { partlycloudy: 'Partly cloudy', 'clear-night': 'Clear night', 'lightning-rainy': 'Thunderstorms',
    'snowy-rainy': 'Sleet', 'windy-variant': 'Windy', rainy: 'Rainy', sunny: 'Sunny', cloudy: 'Cloudy',
    pouring: 'Pouring', snowy: 'Snowy', windy: 'Windy', lightning: 'Lightning', fog: 'Fog', hail: 'Hail' };
  // MetService's ladder is watch < orange < red; the integration adds `warning` (a warning with no colour in its name, e.g. road snowfall,
  // frost, marine) ranked above a watch. Each gets its own colour.
  const WARN_COL = { watch: 'var(--mw-yellow)', warning: 'var(--mw-amber)', orange: 'var(--mw-orange)', red: 'var(--mw-red)' };
  const KMH = { 'km/h': 1, kph: 1, 'm/s': 3.6, mph: 1.609344, kn: 1.852, kt: 1.852, kts: 1.852 };

  /* ---------- tiny helpers ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pretty = s => String(s).replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const u = t => (t ? `<small>${esc(t)}</small>` : '');
  const L = (cfg, def) => { const n = cfg.name !== undefined ? cfg.name : def; return n ? `${esc(n)} ` : ''; };
  const bearing = v => {
    const f = parseFloat(v);
    if (!isNaN(f)) return ((f % 360) + 360) % 360;
    const i = COMPASS.indexOf(String(v).trim().toUpperCase());
    return i < 0 ? null : i * 22.5;
  };
  // Sunrise equation (n = days since J2000). lon is east-positive. Returns Dates or null (polar day/night).
  const sunTimes = (n, lat, lon) => {
    const rad = Math.PI / 180, js = n - lon / 360;
    const M = (357.5291 + 0.98560028 * js) % 360;
    const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    const lam = (M + C + 180 + 102.9372) % 360;
    const jt = 2451545.0 + js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad);
    const sd = Math.sin(lam * rad) * Math.sin(23.4397 * rad), cd = Math.cos(Math.asin(sd));
    const cw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sd) / (Math.cos(lat * rad) * cd);
    if (cw < -1 || cw > 1) return null;
    const w = Math.acos(cw) / rad / 360, toDate = j => new Date((j - 2440587.5) * 86400000);
    return { rise: toDate(jt - w), set: toDate(jt + w) };
  };
  const c_isBuiltin = c => !c.icon_pack || c.icon_pack === 'builtin';
  const svg = (k, style = '', cls = 'i') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"${style ? ` style="${style}"` : ''}>${P[k] || P.dot}</svg>`;

  /* ---------- styles ---------- */
  const CSS = `
:host{display:block}
ha-card{display:block;container-type:inline-size;overflow:hidden;box-shadow:none;
 --n-sec:var(--secondary-text-color,#727272);--n-ico:var(--secondary-text-color,#727272);--n-amber:var(--mw-amber);--n-blue:var(--mw-blue);
 --mw-gold:#ffc300;--mw-sun:#ffc300;--mw-yellow:#facc15;--mw-amber:var(--warning-color,#f59e0b);--mw-orange:#fb923c;--mw-red:#f87171;--mw-low:#06b6d4;--mw-high:#f59e0b;--mw-green:#84cc16;--mw-blue:var(--primary-color,#4f9cf0);--mw-info:#5aa3f0;--mw-moon:#7fb4f0;--mw-rain:#4f9cf0;
 --n-bg:var(--metservice-card-background,var(--ha-card-background,var(--card-background-color,#fff)));
 background:var(--n-bg);
 border:var(--metservice-card-border-width,var(--ha-card-border-width,1px)) solid var(--metservice-card-border-color,var(--ha-card-border-color,var(--divider-color,#e0e0e0)));
 --mw-radius:var(--metservice-card-radius,var(--ha-card-border-radius,12px));
 border-radius:var(--mw-radius);
 color:var(--primary-text-color,#212121)}
ha-card.lm{--mw-gold:#8f6d00;--mw-sun:#b88c00;--mw-yellow:#8a6f03;--mw-amber:#a06707;--mw-orange:#b95504;--mw-red:#e60b0b;--mw-low:#059ab4;--mw-high:#c57f08;--mw-green:#669e11;--mw-blue:#006fe5;--mw-info:#1372d6;--mw-moon:#4190e9;--mw-rain:#3a90ee}
.lm .uvb{filter:saturate(1.2) brightness(.9)}
.in{display:flex;flex-direction:column;gap:16px;padding:20px}
.hl{height:1px;background:var(--metservice-divider-color,var(--divider-color,#e0e0e0));flex:none}
.hint{padding:10px 12px;border:1px dashed var(--n-amber);border-radius:var(--mw-radius);color:var(--n-amber);font-size:13px;line-height:1.4}
.i{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.ban{margin:16px 20px 0;padding:8px 12px;border:1px solid;border-radius:var(--mw-radius);background:rgba(127,127,127,.08);font-size:14px;line-height:1.4}
.ban b{font-weight:500}.ban small{display:block;color:var(--n-sec);font-size:12px}
.bw{margin-top:10px;padding-top:10px;border-top:1px solid color-mix(in srgb,currentColor 35%,transparent)}
.bwn{font-weight:500}.bwt{font-size:12px;color:var(--n-sec);margin-top:2px}
.bwx{font-size:13px;line-height:1.45;color:var(--primary-text-color);margin-top:6px}.bwx p{margin:0 0 6px}.bwx p:last-child{margin:0}
.pm.wb{display:block;padding:0;margin-top:8px}
.hd{display:flex;flex-direction:column;gap:14px;cursor:pointer}
.r1{display:flex;justify-content:space-between;align-items:baseline}
.loc{font-size:20px;font-weight:500}.iss{font-size:12px;color:var(--n-sec)}
.r2{display:flex;align-items:flex-start;gap:14px}
.big-i{width:84px;height:84px;stroke-width:1.1;align-self:center}
.tmp{flex:1;min-width:0}
.big,.clock{font-size:48px;font-weight:300;line-height:1}.big span{font-size:22px}
.sub{margin-top:6px;font-size:13px;line-height:1.35;color:var(--n-sec)}.sub div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ck{text-align:right;flex:none}.date{font-size:12px;line-height:1.35;color:var(--n-sec);margin-top:6px}
.desc{text-align:center;font-size:16px;line-height:1.45;color:var(--primary-text-color)}
.st{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--n-sec)}
.st .rt{color:var(--n-blue);text-transform:none;letter-spacing:0;font-size:13px}
.strip{position:relative;display:flex;margin-top:10px;overflow-x:auto;scrollbar-width:none;user-select:none;-webkit-user-select:none;overscroll-behavior-x:contain;cursor:grab}
.strip::-webkit-scrollbar{display:none}
.dg{flex:none;display:flex;flex-direction:column}
.dh{position:sticky;left:0;align-self:flex-start;font-size:13px;font-weight:500;line-height:1;padding:0 0 8px;white-space:nowrap}
.dc{display:flex}.strip.drag{cursor:grabbing}
.hr{flex:none;width:64px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px;color:var(--n-sec)}
.hr b{font-weight:500;color:var(--primary-text-color);font-size:14px}
.hr.ev{color:var(--n-amber)}.hr.ev span{font-size:12px}
.mc{width:34px;height:34px;flex:none;object-fit:contain;pointer-events:none}
.lm .mc{filter:brightness(var(--n-ib,.7)) saturate(1.2)}
.mc.big-i{width:96px;height:96px;margin:-6px}
.hr .mc,.hr .mi{width:38px;height:38px;margin:-7px 0;flex:none}
.row .mc{width:36px;height:36px;margin:-4px 0}
.row{display:flex;align-items:center;gap:8px;height:36px}
.dn{width:46px;font-weight:500;font-size:14px}
.lo{width:32px;text-align:right;font-size:14px;color:var(--n-sec)}.hi{width:32px;font-size:14px}
.bar{position:relative;flex:1;height:8px;border-radius:4px;background:color-mix(in srgb,var(--primary-color,#5aa3f0) 20%,transparent)}
.fill{position:absolute;top:0;bottom:0;border-radius:4px}
.ic0 .mc{filter:none}
.dot{position:absolute;top:-4px;width:12px;height:12px;border-radius:50%;background:var(--n-bg);border:2px solid var(--primary-text-color,#212121);transform:translateX(-50%)}
.sol.ni{width:36px}
.sol{width:64px;display:flex;gap:3px;align-items:center;justify-content:flex-end;font-size:12px;color:var(--mw-gold)}
.sol ha-icon,.gx ha-icon{--mdc-icon-size:16px;width:16px;height:16px;color:inherit}
.sol .i,.gx .i{width:16px;height:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:16px}
.s{display:flex;align-items:center;gap:10px;min-height:32px;padding:2px 0;box-sizing:border-box;font-size:15px;line-height:1.25;min-width:0}
.s>span{min-width:0}
.si{width:20px;height:20px;color:var(--n-ico);fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
ha-icon{--mdc-icon-size:20px;width:20px;height:20px;color:var(--n-ico);flex:none}
.s small{font-size:11px;color:var(--n-sec);margin-left:2px}
.s small.tr{color:var(--mw-info);font-size:14px;margin-left:4px}
.s em{font-style:normal;color:var(--n-amber)}
.s em.hot{color:var(--mw-orange)}
.s small.adv{display:block;margin:2px 0 0;line-height:1.3}
.tmw{display:flex;flex-direction:column;gap:6px}
.tt{font-size:18px;font-weight:500}.tx{font-size:15px;line-height:1.45;color:var(--primary-text-color)}
.plv.am{color:var(--n-amber)}.plv.hot{color:var(--mw-orange)}
.uvt{margin-top:10px;font-size:15px}
.gs{overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain;cursor:grab;user-select:none;-webkit-user-select:none}
.gs::-webkit-scrollbar{display:none}.gs.drag{cursor:grabbing}
.gi{position:relative;width:calc(var(--n) * 100% / var(--vd))}
.gh,.gf{display:flex}
.gc{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px;font-weight:500}
.gg{position:relative;margin:4px 0}
.gl{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}
.gl path{fill:none;stroke-width:2;stroke-linecap:round;vector-effect:non-scaling-stroke}
.gd{position:absolute;width:8px;height:8px;border-radius:50%;border:2px solid;background:var(--n-bg);transform:translate(-50%,-50%);box-sizing:content-box}
.gv{position:absolute;transform:translateX(-50%);font-size:13px;line-height:1;font-weight:400;white-space:nowrap}.gv.h{font-weight:500}
.gx{flex:1 1 0;min-width:0;display:flex;justify-content:center;font-size:12px;line-height:1.6}
.gx span{display:inline-flex;align-items:center;gap:2px}
.sua{width:100%;height:auto;display:block;color:var(--n-sec)}
.sur{display:flex;justify-content:space-between;align-items:flex-start;margin-top:0}
.sul{display:flex;flex-direction:column;gap:2px;font-size:15px;min-width:56px}.sul b{font-weight:500}.sul span{font-size:12px;color:var(--n-sec)}.sul.r{align-items:flex-end;text-align:right}
.suc{flex:1;text-align:center;font-size:12px;line-height:1.5;color:var(--n-sec);padding:4px 6px 0}
.uvb{position:relative;height:8px;border-radius:4px;margin-top:12px;background:linear-gradient(90deg,#4ade80 0 25%,#facc15 25% 50%,#fb923c 50% 66.7%,#ef4444 66.7% 91.7%,#a855f7 91.7% 100%)}
.uva{margin-top:10px;font-size:12px;line-height:1.4;color:var(--n-sec)}
.pl{display:grid;grid-template-columns:max-content 1fr;column-gap:12px;row-gap:8px;margin-top:10px;align-items:baseline}
.pk{display:flex;align-items:center;gap:6px;border:0;background:none;padding:0;margin:0;color:inherit;font:inherit;font-weight:500;font-size:14px;cursor:pointer;text-align:left}
.pk .i{width:13px;height:13px;color:var(--n-sec)}
.pdot{width:10px;height:10px;border-radius:50%;flex:none}
.pv{font-size:14px;line-height:1.4;min-width:0}
.pd{grid-column:2;margin-top:-4px;font-size:12px;line-height:1.4;color:var(--n-sec)}
.pm{border:0;background:none;padding:0 0 0 4px;font:inherit;font-size:12px;color:var(--n-blue);cursor:pointer}
.plv{text-transform:none;letter-spacing:0;font-size:14px;font-weight:500}
.ft{font-size:11px;color:var(--n-sec);text-align:center}
.err{padding:16px;color:var(--error-color,#f87171);font-size:13px}
@container (max-width:420px){.in{padding:16px;gap:14px}.grid{column-gap:12px}.s{font-size:14px;gap:8px}.big,.clock{font-size:38px}.big span{font-size:18px}.big-i{width:60px;height:60px}.mc.big-i{width:72px;height:72px;margin:-4px}.r2{gap:10px}.desc{font-size:15px}}
`;

  /* ---------- the card ---------- */
  class MetserviceWeatherCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${CSS}</style><div id="root"></div>`;
      this._root = this.shadowRoot.getElementById('root');
      this._fc = {}; this._unsubs = {}; this._gen = 0; this._sig = ''; this._exp = {}; this._desc = {};
      const sr = this.shadowRoot;
      sr.addEventListener('click', e => {
        const q = e.target.closest && e.target.closest('[data-more],[data-desc]');
        if (q) {
          const m = q.dataset.more !== undefined, k = m ? q.dataset.more : q.dataset.desc, o = m ? this._exp : this._desc;
          o[k] = !o[k];
          this._render();
          return;
        }
        const t = e.target.closest && e.target.closest('[data-more-info]');
        if (t && this._c) this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: this._c.weather_entity } }));
      });
      sr.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const s = e.target.closest && e.target.closest('.strip,.gs');
        if (!s) return;
        this._drag = { s, x: e.clientX, l: s.scrollLeft };
        s.classList.add('drag');
        if (s.setPointerCapture) s.setPointerCapture(e.pointerId);
      });
      sr.addEventListener('pointermove', e => {
        if (this._drag) this._drag.s.scrollLeft = this._drag.l - (e.clientX - this._drag.x);
      });
      const end = () => { if (this._drag) { this._drag.s.classList.remove('drag'); this._drag = null; } };
      sr.addEventListener('pointerup', end);
      sr.addEventListener('pointercancel', end);
    }

    static getStubConfig(hass) {
      const w = Object.keys((hass && hass.states) || {}).find(k => k.startsWith('weather.'));
      return { weather_entity: w || 'weather.home' };
    }
    getCardSize() { return 14; }
    getGridOptions() { return { columns: 12, min_columns: 6 }; }

    setConfig(config) {
      if (!config || !config.weather_entity) throw new Error('weather_entity is required');
      const d = { clock_24h: 'auto', wind_unit: 'auto', temperature_unit: 'auto', tomorrow_label: 'day_name', footer: 'auto', icon_pack: 'builtin', icon_animation: 'header', icon_contrast: 'auto', icon_version: '0.1.0' };
      this._c = {
        ...d, ...config,
        stats: (config.stats || DEFAULT_STATS).map(s => (typeof s === 'string' ? { type: s } : s)),
        header: { show_icon: true, show_condition: true, show_clock: true, show_feels_like: true, show_forecast_issued: true, show_warnings: true, warning_details: 'collapsed', ...config.header },
        hourly: { show: true, hours: 12, show_day: true, show_sunset_marker: true, show_rain_start: true, ...config.hourly },
        daily: { show: true, days: 7, show_solar: true, style: 'bars', visible_days: 5, show_rain: true, solar_icon: 'none', ...config.daily },
        sun: { show: false, show_times: true, show_daylight: true, show_countdown: true, ...config.sun },
        uv: { show: true, show_scale: true, show_advice: true, ...config.uv },
        pollen: { show: true, collapse_after: 6, show_descriptions: false, ...config.pollen },
        sections: Array.isArray(config.sections) ? config.sections : ['header', 'sun', 'hourly', 'daily', 'stats', 'uv', 'pollen', 'tomorrow'],
      };
      this._prefix = config.sensor_prefix || config.weather_entity.split('.')[1].replace(/_forecast$/, '');
      this._watch = this._collectIds();
      this._unsubAll();
      this._sig = '';
      if (this._h) this.hass = this._h;
    }

    set hass(h) {
      this._h = h;
      if (!this._c) return;
      this._ensureSubs();
      const hk = this._hourKey();
      const sig = this._watch.map(id => (h.states[id] ? h.states[id].last_updated : '-')).join('|') + hk + String(h.themes && h.themes.darkMode) + String(h.themes && h.themes.theme);
      if (sig !== this._sig) { this._sig = sig; this._render(); }
    }

    connectedCallback() {
      this._ensureSubs();
      this._timer = setInterval(() => this._tick(), 15000);
    }
    disconnectedCallback() {
      this._unsubAll();
      clearInterval(this._timer);
    }

    /* ----- forecast subscriptions ----- */
    _ensureSubs() {
      const h = this._h;
      if (!h || !this._c || !this.isConnected || !h.connection) return;
      const st = h.states[this._c.weather_entity];
      if (!st) return;
      const feat = st.attributes.supported_features || 0;
      const want = [];
      if (this._c.daily.show && (feat & 1)) want.push('daily');
      if (this._c.hourly.show && (feat & 2)) want.push('hourly');
      for (const t of want) {
        if (this._unsubs[t]) continue;
        this._unsubs[t] = 'pending';
        const gen = this._gen;
        h.connection.subscribeMessage(ev => {
          if (gen !== this._gen) return;
          this._fc[t] = ev.forecast || [];
          this._render();
        }, { type: 'weather/subscribe_forecast', forecast_type: t, entity_id: this._c.weather_entity })
          .then(unsub => { if (gen !== this._gen) unsub(); else this._unsubs[t] = unsub; })
          .catch(err => { console.warn(`${CARD}: ${t} forecast subscription failed`, err); if (gen === this._gen) this._unsubs[t] = 'failed'; });
      }
    }
    _unsubAll() {
      this._gen++;
      for (const u of Object.values(this._unsubs)) if (typeof u === 'function') { try { u(); } catch (e) { /* ignore */ } }
      this._unsubs = {};
    }

    /* ----- entity + state helpers ----- */
    _ent(key) {
      const c = this._c;
      return (c.entities && c.entities[key]) || (typeof c[key] === 'string' && c[key]) || (DEF[key] ? `sensor.${this._prefix}_${DEF[key]}` : FULL[key]);
    }
    _collectIds() {
      const ids = new Set([this._c.weather_entity, FULL.sun, this._c.cloud_entity, this._ent('solar_remaining'), this._c.uv.number_entity, this._c.uv.entity, this._c.uv.window_entity, this._c.pollen.entity]);
      for (const k of Object.keys(DEF)) ids.add(this._ent(k));
      (this._c.daily.solar_entities || []).forEach(i => ids.add(i));
      for (const s of this._c.stats) for (const [k, v] of Object.entries(s)) if (/entity$/.test(k) && typeof v === 'string') ids.add(v);
      return [...ids].filter(Boolean);
    }
    _st(id) {
      const s = id && this._h.states[id];
      return s && s.state !== 'unavailable' && s.state !== 'unknown' ? s : null;
    }
    _n(id) { const s = this._st(id); if (!s) return null; const v = parseFloat(s.state); return isNaN(v) ? null : v; }
    _unit(id) { const s = this._h.states[id]; return s && s.attributes.unit_of_measurement; }
    _date(v) { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; }

    /* ----- time helpers (all in the HA server time zone) ----- */
    _t(k) { const o = this._c.strings; return o && o[k] !== undefined ? o[k] : STR[k]; }
    _tz() {
      if (this._c.time_zone) return this._c.time_zone;
      const l = this._h.locale;
      return l && l.time_zone === 'local' ? undefined : this._h.config.time_zone;
    }
    _loc() {
      if (this._c.locale) return this._c.locale;
      const l = this._h.locale || {}, lang = l.language || this._h.language || 'en';
      if (lang === 'en') { if (l.date_format === 'DMY') return 'en-GB'; if (l.date_format === 'MDY') return 'en-US'; }
      return lang;
    }
    _calcUnit() {
      const u = String(this._c.temperature_unit || 'auto').toUpperCase();
      this._dispF = u === 'F' || (u === 'AUTO' && /F/i.test((this._h.config.unit_system && this._h.config.unit_system.temperature) || ''));
    }
    _tsym() { return this._dispF ? '°F' : '°C'; }
    _tv(v, from) {
      const isF = /F/i.test(from || this._tsym());
      if (this._dispF && !isF) return v * 9 / 5 + 32;
      if (!this._dispF && isF) return (v - 32) * 5 / 9;
      return v;
    }
    _parts(d) {
      const o = {};
      for (const p of new Intl.DateTimeFormat('en-US', { timeZone: this._tz(), hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d)) o[p.type] = p.value;
      return o;
    }
    _ymd(d) { const p = this._parts(d); return `${p.year}-${p.month}-${p.day}`; }
    _mins(d) { const p = this._parts(d); return (+p.hour % 24) * 60 + +p.minute; }
    _hourKey() { const n = new Date(); return this._ymd(n) + this._parts(n).hour; }
    _time(d) {
      const c = this._c.clock_24h, tf = this._h.locale && this._h.locale.time_format;
      const o = { timeZone: this._tz(), hour: 'numeric', minute: '2-digit' };
      if (c === true || (c === 'auto' && tf === '24')) { o.hour = '2-digit'; o.hourCycle = 'h23'; }
      else if (c === false || (c === 'auto' && tf === '12')) o.hour12 = true;
      return new Intl.DateTimeFormat(this._loc(), o).format(d);
    }
    _dayLabel(d) { return this._ymd(d) === this._ymd(this._now) ? this._t('today') : this._wd(d, 'long'); }
    _wd(d, style) { return new Intl.DateTimeFormat(this._loc(), { timeZone: this._tz(), weekday: style }).format(d); }
    _when(d, todayWord) {
      const t = this._time(d);
      if (this._ymd(d) === this._ymd(this._now)) return todayWord ? `${todayWord} ${t}` : t;
      return `${this._wd(d, 'short')} ${t}`;
    }
    _whenPrec(t, prec) {
      if (prec !== 'day') return this._when(t);
      return this._ymd(t) === this._ymd(this._now) ? this._t('today') : this._wd(t, 'short');
    }
    _calcSun() {
      const sr = this._date(this._st(this._ent('sunrise')) && this._st(this._ent('sunrise')).state);
      const ss = this._date(this._st(this._ent('sunset')) && this._st(this._ent('sunset')).state);
      const sun = this._st(FULL.sun);
      const r = sr || this._date(sun && sun.attributes.next_rising);
      const s = ss || this._date(sun && sun.attributes.next_setting);
      this._riseM = r ? this._mins(r) : 360;
      this._setM = s ? this._mins(s) : 1200;
    }
    _night(d) { const m = this._mins(d); return m < this._riseM || m >= this._setM; }
    // Sunrise/sunset events between now and `until`. Calculated from the HA location for every day in the
    // window, then nudged to match HA's own next_rising / next_setting so the times agree with sun.sun.
    _sunEvents(until) {
      const sun = this._st(FULL.sun), cfg = this._h.config, ev = [];
      const nr = this._date(sun && sun.attributes.next_rising), ns = this._date(sun && sun.attributes.next_setting);
      const days = Math.ceil((until - this._now) / 86400000);
      if (typeof cfg.latitude === 'number' && typeof cfg.longitude === 'number') {
        const n0 = Math.ceil(this._now / 86400000 + 2440587.5 - 2451545.0 + 0.0008);
        const comp = { rise: [], set: [] };
        for (let n = n0 - 1; n <= n0 + days + 1; n++) {
          const r = sunTimes(n, cfg.latitude, cfg.longitude);
          if (r) { comp.rise.push(r.rise); comp.set.push(r.set); }
        }
        for (const [type, anchor] of [['rise', nr], ['set', ns]]) {
          let delta = 0;
          if (anchor && comp[type].length) {
            const near = comp[type].reduce((a, b) => (Math.abs(b - anchor) < Math.abs(a - anchor) ? b : a));
            if (Math.abs(anchor - near) < 30 * 60000) delta = anchor - near;
          }
          for (const t of comp[type]) {
            const d = new Date(t.getTime() + delta);
            if (d > this._now && d <= until) ev.push({ t: d, type });
          }
        }
        return ev;
      }
      // no location in hass.config: repeat the next events every 24h
      for (const [type, a] of [['rise', nr], ['set', ns]]) {
        for (let k = 0; a && k <= days; k++) { const d = new Date(a.getTime() + k * 86400000); if (d > this._now && d <= until) ev.push({ t: d, type }); }
      }
      return ev;
    }

    /* ----- condition -> icon ----- */
    _iconKey(cond, night) {
      const c = String(cond || '').toLowerCase().replace(/[^a-z]/g, '');
      if (/thunder|storm|lightning/.test(c)) return 'storm';
      if (/snow|hail|sleet/.test(c)) return 'snow';
      if (/rain|shower|drizzle|pour/.test(c)) return 'rain';
      if (/fog|mist|haze/.test(c)) return 'fog';
      if (/wind/.test(c)) return 'wind';
      if (/partly|fewclouds|mostlyfine|mostlyclear|variable|intermittent/.test(c)) return night ? 'partlyn' : 'partly';
      if (/cloud|overcast/.test(c)) return 'cloud';
      if (/clearnight/.test(c)) return 'moon';
      if (/sunny|fine|clear/.test(c)) return night ? 'moon' : 'sun';
      return 'cloud';
    }
    _mcName(cond, night) {
      const c = String(cond || '').toLowerCase().replace(/[^a-z]/g, '');
      if (/thunder|storm|lightning/.test(c)) return night ? 'thunderstorms-rain' : 'thunderstorms-day-rain';
      if (/pour|heavyrain|extremerain/.test(c)) return 'extreme-rain';
      if (/drizzle/.test(c)) return 'drizzle';
      if (/shower/.test(c)) return night ? 'partly-cloudy-night-rain' : 'partly-cloudy-day-rain';
      if (/rain/.test(c)) return 'rain';
      if (/sleet/.test(c)) return 'sleet';
      if (/hail/.test(c)) return 'hail';
      if (/snow/.test(c)) return 'snow';
      if (/fog/.test(c)) return 'fog';
      if (/mist/.test(c)) return 'mist';
      if (/haze/.test(c)) return 'haze';
      if (/wind/.test(c)) return 'wind';
      if (/partly|fewclouds|mostlyfine|mostlyclear|variable|intermittent/.test(c)) return night ? 'partly-cloudy-night' : 'partly-cloudy-day';
      if (/overcast/.test(c)) return 'overcast';
      if (/cloud/.test(c)) return 'cloudy';
      if (/clearnight/.test(c)) return 'clear-night';
      if (/sunny|fine|clear/.test(c)) return night ? 'clear-night' : 'clear-day';
      return 'cloudy';
    }
    _img(name, cls, anim, fb) {
      const c = this._c, m = /^meteocons-(line|fill|flat)$/.exec(c.icon_pack);
      const animated = c.icon_animation === 'all' || (c.icon_animation === 'header' && anim);
      let url;
      if (m) url = `https://cdn.jsdelivr.net/npm/@meteocons/${animated ? 'svg' : 'svg-static'}@${c.icon_version}/${m[1]}/${name}.svg`;
      else if (c.icon_pack === 'custom' && c.icon_path) url = c.icon_path.replace(/\/*$/, '/') + name + '.svg';
      else return fb;
      // if the image can't load (offline, wrong path) fall back to the built-in icon
      return `<img class="${cls.replace(/^i\b/, 'mc')}" src="${esc(url)}" alt="" draggable="false" data-fb="${esc(fb)}" onerror="this.outerHTML=this.dataset.fb">`;
    }
    _cicon(cond, night, cls = 'i', extra = '', anim = false) {
      const k = this._iconKey(cond, night);
      const fb = svg(k, `color:${ICOL[k] || 'var(--primary-text-color)'}${extra}`, cls);
      return c_isBuiltin(this._c) ? fb : this._img(this._mcName(cond, night), cls, anim, fb);
    }
    _evIcon(type) {
      const fb = svg(type);
      if (c_isBuiltin(this._c)) return fb;
      if (/^meteocons-/.test(this._c.icon_pack)) return MC_EV[type] ? MC_EV[type].replace(/mwm-(rise|set)/g, `mwm-$1-${this._evn = (this._evn || 0) + 1}`) : fb;
      return this._img(type === 'set' ? 'sunset' : 'sunrise', 'i', false, fb);
    }

    /* ----- rendering ----- */
    _render() {
      if (!this._h || !this._c) return;
      const keep = ['.strip', '.gs'].map(sel => { const e = this._root.querySelector(sel); return e ? e.scrollLeft : 0; });
      let html;
      try { html = this._html(); } catch (e) { console.error(CARD, e); html = `<ha-card><div class="err">${esc(CARD)}: ${esc(e.message)}</div></ha-card>`; }
      this._root.innerHTML = html;
      ['.strip', '.gs'].forEach((sel, i) => { const e = this._root.querySelector(sel); if (e && keep[i]) e.scrollLeft = keep[i]; });
      this._applyContrast();
    }
    // Is the card on a light background? color_scheme forces it; otherwise measure the card's own background
    // (falling back to HA's dark-mode flag when the background is transparent or a gradient).
    _isLight() {
      const cs = this._c.color_scheme;
      if (cs === 'light') return true;
      if (cs === 'dark') return false;
      const card = this._root.querySelector('ha-card');
      const m = card && /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/.exec(getComputedStyle(card).backgroundColor || '');
      if (m && (m[4] === undefined || +m[4] > 0.5)) return 0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3] > 140;
      const dm = this._h.themes && this._h.themes.darkMode;
      return dm === undefined ? false : !dm;
    }
    // Light cards get the deeper accent palette (class "lm"); Meteocons icons, whose clouds are very pale, are darkened too.
    _applyContrast() {
      const card = this._root.querySelector('ha-card');
      if (!card) return;
      card.classList.toggle('lm', this._isLight());
      const ic = this._c.icon_contrast;
      card.classList.toggle('ic0', ic === 'off' || ic === false);
      const f = parseFloat(ic);
      if (!isNaN(f) && f > 0 && f <= 1) card.style.setProperty('--n-ib', String(f));
    }
    _tick() {
      if (!this._h || !this._c) return;
      const now = new Date();
      const c = this._root.querySelector('.clock');
      if (c) c.textContent = this._time(now);
      if (this._hourKey() !== this._lastHourKey) this._render();
    }
    _html() {
      this._now = new Date();
      this._lastHourKey = this._hourKey();
      this._calcSun();
      this._calcUnit();
      this._evn = 0;
      const build = { header: () => this._header(), hourly: () => this._hourly(), daily: () => this._daily(), stats: () => this._stats(), sun: () => this._sun(), uv: () => this._uv(), pollen: () => this._pollen(), tomorrow: () => this._tomorrow() };
      const secs = this._c.sections.map(n => (build[n] ? build[n]() : '')).filter(Boolean);
      return `<ha-card>${this._warnings()}<div class="in">${this._hint()}${secs.join('<div class="hl"></div>')}${this._footer()}</div></ha-card>`;
    }

    _hint() {
      const h = this._h, c = this._c;
      if (!h.states[c.weather_entity]) return `<div class="hint">Weather entity <b>${esc(c.weather_entity)}</b> was not found.</div>`;
      if (!Object.keys(DEF).some(k => h.states[this._ent(k)])) {
        return `<div class="hint">No MetService sensors found (looked for <b>sensor.${esc(this._prefix)}_*</b>). Set <b>sensor_prefix</b> or point sensors at your own with <b>entities</b>. See the README.</div>`;
      }
      return '';
    }

    _warnings() {
      const h = this._c.header;
      if (!h.show_warnings) return '';
      const st = this._st(this._ent('warnings'));
      if (!st || st.state === 'none' || st.attributes.count === 0) return '';
      const col = WARN_COL[st.state] || 'var(--mw-amber)';
      const dt = this._st(this._ent('warning_details'));
      const aw = dt && dt.attributes.active_warnings;
      const items = (Array.isArray(aw) ? aw : []).map(w => (typeof w === 'string' ? { name: w } : { name: w.name || w.title || w.headline || '', text: w.text || w.description || '', period: w.threat_period || w.period || '' }));
      const names = items.map(w => w.name).filter(Boolean).join(' · ') || (typeof aw === 'string' ? aw : '');
      const mode = h.warning_details || 'collapsed';
      const more = mode !== 'off' && items.some(w => w.text || w.period);
      const open = more && (mode === 'expanded' || !!this._exp.warn);
      const wcol = n => (/\bred\b/i.test(n) ? WARN_COL.red : /\borange\b/i.test(n) ? WARN_COL.orange : /\bwatch\b/i.test(n) ? WARN_COL.watch : WARN_COL.warning);
      const paras = t => String(t || '').split(/\n\s*\n/).map(x => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('');
      const body = open ? items.map(w => `<div class="bw"><div class="bwn" style="color:${wcol(w.name)}">${esc(w.name)}</div>${w.period ? `<div class="bwt">${esc(w.period)}</div>` : ''}${w.text ? `<div class="bwx">${paras(w.text)}</div>` : ''}</div>`).join('') : '';
      const btn = more && mode !== 'expanded' ? `<button class="pm wb" data-more="warn">${esc(this._t(open ? 'warn_less' : 'warn_more'))}</button>` : '';
      return `<div class="ban" style="border-color:${col};color:${col}"><b>${esc(st.attributes.headline || pretty(st.state))}</b>${names && !open ? `<small>${esc(names)}</small>` : ''}${body}${btn}</div>`;
    }

    _header() {
      const c = this._c, h = c.header, w = this._st(c.weather_entity);
      const night = this._night(this._now);
      const tid = this._ent('temperature');
      let t = this._n(tid);
      if (t == null && w) { const v = parseFloat(w.attributes.temperature); if (!isNaN(v)) t = v; }
      const wu = w && w.attributes.temperature_unit;
      if (t != null) t = this._tv(t, this._unit(tid) || wu);
      let feels = this._n(this._ent('feels_like'));
      if (feels != null) feels = this._tv(feels, this._unit(this._ent('feels_like')) || wu);
      const name = c.name !== undefined ? c.name : ((w && w.attributes.friendly_name) || '').replace(/\s*forecast$/i, '');
      let cond = '';
      if (w) {
        cond = (this._h.formatEntityState ? this._h.formatEntityState(w) : '') || CONDTXT[w.state] || pretty(w.state);
        if (night && w.state === 'sunny') cond = this._t('clear');
      }
      const sub = [];
      if (h.show_feels_like && feels != null) sub.push(`${esc(this._t('feels_like'))} ${feels.toFixed(1)}°`);
      if (h.show_condition && cond) sub.push(esc(cond));
      const iss = this._date(this._st(this._ent('forecast_issued')) && this._st(this._ent('forecast_issued')).state);
      const dfmt = new Intl.DateTimeFormat(this._loc(), { timeZone: this._tz(), weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const desc = this._st(this._ent('description_today'));
      return `<div class="hdr-wrap" style="display:flex;flex-direction:column;gap:14px">
<div class="hd" data-more-info>
<div class="r1"><div class="loc">${esc(name)}</div>${h.show_forecast_issued && iss ? `<div class="iss">${esc(this._t('issued'))} ${esc(this._when(iss))}</div>` : ''}</div>
<div class="r2">${h.show_icon && w ? this._cicon(w.state, night, 'i big-i', '', true) : ''}
<div class="tmp">${t != null ? `<div class="big">${t.toFixed(1)}<span>${esc(this._tsym())}</span></div>` : ''}${sub.length ? `<div class="sub">${sub.map(x => `<div>${x}</div>`).join('')}</div>` : ''}</div>
${h.show_clock ? `<div class="ck"><div class="clock">${esc(this._time(this._now))}</div><div class="date">${esc(dfmt.format(this._now).replace(/,/g, ''))}</div></div>` : ''}</div>
</div>${desc && desc.state ? `<div class="desc">${esc(desc.state)}</div>` : ''}</div>`;
    }

    _hourly() {
      const h = this._c.hourly;
      const wst = this._st(this._c.weather_entity), wu = wst && wst.attributes.temperature_unit;
      const fc = this._fc.hourly;
      if (!h.show || !fc || !fc.length) return '';
      const items = fc.filter(f => new Date(f.datetime) > this._now).slice(0, h.hours);
      if (!items.length) return '';
      const cells = items.map(f => {
        const d = new Date(f.datetime);
        return { t: d, html: `<div class="hr">${esc(this._time(d))}${this._cicon(f.condition, this._night(d))}<b>${f.temperature != null ? Math.round(this._tv(f.temperature, wu)) + '°' : '–'}</b></div>` };
      });
      if (h.show_sunset_marker) {
        const last = cells[cells.length - 1].t;
        for (const ev of this._sunEvents(last)) {
          if (ev.t <= last) cells.push({ t: ev.t, html: `<div class="hr ev">${esc(this._time(ev.t))}${this._evIcon(ev.type)}<span>${esc(this._t(ev.type === 'set' ? 'sunset' : 'sunrise'))}</span></div>` });
        }
        cells.sort((a, b) => a.t - b.t);
      }
      let tag = '';
      if (h.show_rain_start) {
        const nr = this._st(this._ent('next_rain'));
        const t = nr && this._date(nr.state);
        if (t && t > this._now && nr.attributes.outlook !== 'no_rain_expected') {
          const mm = this._n(this._ent('rain_next_8h'));
          const within8 = t - this._now < 8 * 3600000;
          tag = `${this._t('rain_from')} ${this._whenPrec(t, nr.attributes.precision)}${within8 && mm ? ` · ${mm.toFixed(1)} mm` : ''}`;
        }
      }
      const label = h.label !== undefined ? h.label : this._t('hourly_label');
      // one group per calendar day; each group's name sticks to the left edge while any of its hours are in view
      const groups = [];
      for (const c of cells) {
        const k = this._ymd(c.t), g = groups[groups.length - 1];
        if (g && g.k === k) g.cells.push(c); else groups.push({ k, t: c.t, cells: [c] });
      }
      const strip = groups.map(g => `<div class="dg">${h.show_day ? `<div class="dh">${esc(this._dayLabel(g.t))}</div>` : ''}<div class="dc">${g.cells.map(c => c.html).join('')}</div></div>`).join('');
      return `<div>${label || tag ? `<div class="st"><span>${esc(label)}</span>${tag ? `<span class="rt">${esc(tag)}</span>` : ''}</div>` : ''}<div class="strip">${strip}</div></div>`;
    }

    _daily() {
      const d = this._c.daily;
      const fc = this._fc.daily;
      if (!d.show || !fc || !fc.length) return '';
      const today = this._ymd(this._now);
      const wst = this._st(this._c.weather_entity), wu = wst && wst.attributes.temperature_unit;
      const dc = (this._st(this._ent('condition_today')) || { attributes: {} }).attributes.daily_conditions || [];
      const rows = fc.filter(f => this._ymd(new Date(f.datetime)) >= today).slice(0, d.days).map(f => {
        const dt = new Date(f.datetime), ymd = this._ymd(dt), isToday = ymd === today;
        let hi = f.temperature != null ? this._tv(f.temperature, wu) : null, lo = f.templow != null ? this._tv(f.templow, wu) : null;
        if (isToday) {
          const sh = this._n(this._ent('high_today')), sl = this._n(this._ent('low_today'));
          if (sh != null) hi = this._tv(sh, this._unit(this._ent('high_today')) || wu);
          if (sl != null) lo = this._tv(sl, this._unit(this._ent('low_today')) || wu);
        }
        const cond = f.condition || ((dc.find(x => x.date === ymd) || {}).condition);
        return { label: isToday ? this._t('today') : this._wd(dt, 'short'), isToday, hi, lo, cond, rain: f.precipitation != null && !isNaN(+f.precipitation) ? +f.precipitation : null };
      });
      if (!rows.length) return '';
      const vals = rows.flatMap(r => [r.hi, r.lo]).filter(v => v != null);
      const min = Math.floor(Math.min(...vals)), max = Math.ceil(Math.max(...vals)), span = max - min || 1;
      const cur0 = this._n(this._ent('temperature'));
      const cur = cur0 != null ? this._tv(cur0, this._unit(this._ent('temperature')) || wu) : null;
      const solarIds = d.show_solar ? (d.solar_entities || []) : [];
      const solar = rows.map((_, i) => (solarIds[i] ? this._n(solarIds[i]) : null));
      const anySolar = solar.some(v => v != null);
      if (d.style === 'graph') return this._dailyGraph(rows, solar, anySolar, wst);
      const mix = v => `color-mix(in srgb,var(--mw-high) ${Math.max(0, Math.min(100, (v - min) / span * 100)).toFixed(0)}%,var(--mw-low))`;
      const ni = this._solarIcon() ? '' : ' ni';
      const cs = (d.low_color ? `--mw-low:${esc(d.low_color)};` : '') + (d.high_color ? `--mw-high:${esc(d.high_color)};` : '');
      const body = rows.map((r, i) => {
        const hasBar = r.hi != null && r.lo != null;
        const left = hasBar ? ((r.lo - min) / span) * 100 : 0, width = hasBar ? ((r.hi - r.lo) / span) * 100 : 0;
        const dot = r.isToday && cur != null ? Math.max(0, Math.min(100, ((cur - min) / span) * 100)) : null;
        return `<div class="row"><span class="dn">${esc(r.label)}</span>${this._cicon(r.cond, false)}<span class="lo">${r.lo != null ? Math.round(r.lo) + '°' : ''}</span>
<div class="bar">${hasBar ? `<div class="fill" style="left:${left.toFixed(1)}%;width:${Math.max(width, 2).toFixed(1)}%;background:var(--mw-low);background:linear-gradient(90deg,${mix(r.lo)},${mix(r.hi)})"></div>` : ''}${dot != null ? `<div class="dot" style="left:${dot.toFixed(1)}%"></div>` : ''}</div>
<span class="hi">${r.hi != null ? Math.round(r.hi) + '°' : ''}</span>${anySolar ? `<span class="sol${ni}">${solar[i] != null ? this._solarIcon() + solar[i].toFixed(1) : ''}</span>` : ''}</div>`;
      }).join('');
      return `<div${cs ? ` style="${cs}"` : ''}><div class="st" style="margin-bottom:6px"><span>${esc(this._t('days').replace('{n}', rows.length))}</span>${anySolar ? `<span style="color:var(--mw-gold)">${esc(this._t('solar_est'))}</span>` : ''}</div>${body}</div>`;
    }

    // Daily forecast as two smooth lines (highs and lows). Columns are sized so `visible_days` fit the card;
    // the rest scroll sideways like the hourly strip.
    _dailyGraph(rows, solar, anySolar, wst) {
      const d = this._c.daily, n = rows.length, vd = Math.max(1, Math.min(+d.visible_days || 5, n));
      const all = rows.flatMap(r => [r.hi, r.lo]).filter(v => v != null);
      if (!all.length) return '';
      const H = 96, top = 22, plot = 52, cH = 'var(--mw-high)', cL = 'var(--mw-low)';
      const mid = (Math.min(...all) + Math.max(...all)) / 2, span = Math.max(Math.max(...all) - Math.min(...all), 6);
      const y = v => top + (mid + span / 2 - v) / span * plot, x = i => (i + 0.5) * 100;
      const smooth = pts => {
        if (pts.length < 2) return '';
        let o = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
          o += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
        }
        return o;
      };
      const pts = key => rows.map((r, i) => (r[key] != null ? [x(i), y(r[key])] : null)).filter(Boolean);
      const dots = rows.map((r, i) => {
        const l = `${((i + 0.5) / n * 100).toFixed(2)}%`;
        const one = (v, col, dy, cls) => (v == null ? '' : `<i class="gd" style="left:${l};top:${y(v).toFixed(1)}px;border-color:${col}"></i><b class="gv${cls}" style="left:${l};top:${(y(v) + dy).toFixed(0)}px">${Math.round(v)}°</b>`);
        return one(r.hi, cH, -22, ' h') + one(r.lo, cL, 9, '');
      }).join('');
      const unit = (wst && wst.attributes.precipitation_unit) || 'mm';
      const anyRain = d.show_rain && rows.some(r => r.rain > 0);
      const foot = (cond, cell) => (cond ? `<div class="gf">${rows.map((r, i) => `<div class="gx">${cell(r, i)}</div>`).join('')}</div>` : '');
      const cs = (d.low_color ? `--mw-low:${esc(d.low_color)};` : '') + (d.high_color ? `--mw-high:${esc(d.high_color)};` : '');
      return `<div${cs ? ` style="${cs}"` : ''}><div class="st" style="margin-bottom:8px"><span>${esc(this._t('days').replace('{n}', n))}</span>${anySolar ? `<span style="color:var(--mw-gold)">${esc(this._t('solar_est'))}</span>` : ''}</div>
<div class="gs" style="--vd:${vd};--n:${n}"><div class="gi">
<div class="gh">${rows.map(r => `<div class="gc"><span>${esc(r.label)}</span>${this._cicon(r.cond, false)}</div>`).join('')}</div>
<div class="gg" style="height:${H}px"><svg class="gl" viewBox="0 0 ${n * 100} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${smooth(pts('hi'))}" style="stroke:${cH}"/><path d="${smooth(pts('lo'))}" style="stroke:${cL}"/></svg>${dots}</div>
${foot(anyRain, r => (r.rain > 0 ? `<span style="color:var(--n-blue)">${r.rain.toFixed(1)} ${esc(unit)}</span>` : ''))}${foot(anySolar, (r, i) => (solar[i] != null ? `<span style="color:var(--mw-gold)">${this._solarIcon()}${solar[i].toFixed(1)}</span>` : ''))}
</div></div></div>`;
    }

    // Today's sunrise and sunset: from the sensors when they are for today, otherwise calculated from the HA location.
    _sunDay() {
      const today = this._ymd(this._now);
      const get = key => { const st = this._st(this._ent(key)), d = st && this._date(st.state); return d && this._ymd(d) === today ? d : null; };
      let rise = get('sunrise'), set = get('sunset');
      const cfg = this._h.config;
      if ((!rise || !set) && typeof cfg.latitude === 'number' && typeof cfg.longitude === 'number') {
        const n0 = Math.ceil(this._now / 86400000 + 2440587.5 - 2451545.0 + 0.0008);
        for (let n = n0 - 1; n <= n0 + 1; n++) {
          const r = sunTimes(n, cfg.latitude, cfg.longitude);
          if (!r) continue;
          if (!rise && this._ymd(r.rise) === today) rise = r.rise;
          if (!set && this._ymd(r.set) === today) set = r.set;
        }
      }
      return { rise, set };
    }

    // Solar arc: a dashed half-circle with the sun at its place in the day.
    _sun() {
      const c = this._c.sun;
      if (!c.show) return '';
      const { rise, set } = this._sunDay();
      if (!rise || !set || set <= rise) return '';
      const now = this._now, total = set - rise, day = now >= rise && now <= set;
      const f = day ? (now - rise) / total : (now < rise ? 0 : 1);
      const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : `${m % 60}m`; };
      let count = '';
      if (c.show_countdown) {
        if (day) count = this._t('sunset_in').replace('{t}', dur(set - now));
        else {
          let nr = now < rise ? rise : null;
          if (!nr) { const ev = this._sunEvents(new Date(now.getTime() + 36 * 3600000)).filter(e => e.type === 'rise').sort((a, b) => a.t - b.t)[0]; nr = ev && ev.t; }
          if (nr) count = this._t('sunrise_in').replace('{t}', dur(nr - now));
        }
      }
      const dl = c.show_daylight ? this._t('daylight').replace('{t}', dur(total)) : '';
      // a low parabola (quadratic curve) so the ends meet the horizon at a gentle angle; the sun is a plain dot on it
      const x0 = 8, x1 = 292, cy = 38, ry = 30;
      const mx = (x0 + (x1 - x0) * f).toFixed(1), my = (cy - 4 * ry * f * (1 - f)).toFixed(1);
      const arc = `M${x0} ${cy}Q150 ${cy - 2 * ry} ${x1} ${cy}`;
      const sky = `<svg class="sua" viewBox="0 0 300 44" aria-hidden="true"><line x1="0" y1="${cy}" x2="300" y2="${cy}" stroke="currentColor" stroke-opacity=".3"/><path d="${arc}" fill="none" stroke="currentColor" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="3 5"/><circle cx="${mx}" cy="${my}" r="${day ? 6 : 5}" style="fill:var(${day ? '--mw-sun' : '--mw-moon'})"${day ? '' : ' opacity=".85"'}/></svg>`;
      const end = (d, k, cls) => `<div class="sul${cls}"><b>${esc(this._time(d))}</b><span>${esc(this._t(k))}</span></div>`;
      const mid = [count, dl].filter(Boolean).map(esc).join('<br>');
      const row = c.show_times || mid ? `<div class="sur">${c.show_times ? end(rise, 'sunrise', '') : '<div></div>'}<div class="suc">${mid}</div>${c.show_times ? end(set, 'sunset', ' r') : '<div></div>'}</div>` : '';
      return `<div>${c.label ? `<div class="st" style="margin-bottom:6px"><span>${esc(c.label)}</span></div>` : ''}${sky}${row}</div>`;
    }

    _stats() {
      const out = [];
      for (const cfg of this._c.stats) {
        if (cfg.show === false) continue;
        const fn = /^[a-z_]+$/.test(cfg.type || '') && this['_s_' + cfg.type];
        if (!fn) {
          this._warned = this._warned || {};
          if (!this._warned[cfg.type]) { this._warned[cfg.type] = 1; console.warn(`${CARD}: unknown stat type "${cfg.type}"`); }
          continue;
        }
        let r = null;
        try { r = fn.call(this, cfg); } catch (e) { console.warn(`${CARD}: stat "${cfg.type}" failed`, e); }
        if (r) out.push(`<div class="s">${this._sicon(cfg, r.icon, r.rot, r.mdi)}<span>${r.html}</span></div>`);
      }
      return out.length ? `<div class="grid">${out.join('')}</div>` : '';
    }
    _solarIcon() {
      const ic = this._c.daily.solar_icon;
      if (!ic || ic === 'none') return '';
      return ic === 'outline' ? svg('solar') : `<ha-icon icon="${esc(ic)}"></ha-icon>`;
    }
    _sicon(cfg, key, rot, mdi) {
      if (cfg.icon || mdi) return `<ha-icon icon="${esc(cfg.icon || mdi)}"></ha-icon>`;
      return svg(key, rot != null ? `transform:rotate(${rot}deg)` : '', 'si');
    }

    /* ----- individual stats: each returns {icon, html, rot?} or null ----- */
    _tstat(cfg, key, def) {
      const id = cfg.entity || this._ent(key), n0 = this._n(id);
      if (n0 == null) return null;
      return { icon: 'therm', html: `${L(cfg, def)}${this._tv(n0, this._unit(id)).toFixed(1)}${u(this._tsym())}` };
    }
    _s_max(cfg) { return this._tstat(cfg, 'high_today', this._t('max')); }
    _s_min(cfg) { return this._tstat(cfg, 'low_today', this._t('min')); }
    _s_humidity(cfg) {
      const n = this._n(cfg.entity || this._ent('humidity'));
      return n == null ? null : { icon: 'drop', html: `${L(cfg, '')}${Math.round(n)}${u('%')}` };
    }
    _s_rain(cfg) {
      const per = cfg.period || '8h';
      const key = per === '24h' ? 'rain_next_24h' : (per === 'last_hour' || per === '1h') ? 'rain_last_hour' : 'rain_next_8h';
      const id = cfg.entity || this._ent(key), n = this._n(id);
      if (n == null) return null;
      let extra = '';
      if (key !== 'rain_last_hour') {
        const nr = this._st(cfg.start_entity || this._ent('next_rain')), t = nr && this._date(nr.state);
        if (t && t > this._now && nr.attributes.outlook !== 'no_rain_expected') extra = ` ${u(this._t('from') + ' ' + this._whenPrec(t, nr.attributes.precision))}`;
      }
      return { icon: 'rain', html: `${L(cfg, '')}${n.toFixed(1)}${u(this._unit(id) || 'mm')}${extra}` };
    }
    _speed(id, to) {
      const n = this._n(id);
      if (n == null) return null;
      const from = KMH[String(this._unit(id) || 'km/h').toLowerCase()] || 1;
      return Math.round(n * from / (KMH[to] || 1));
    }
    _s_wind(cfg) {
      const wcfg = this._c.wind_unit;
      const to = wcfg === 'auto' ? ((this._h.config.unit_system && this._h.config.unit_system.wind_speed) || 'km/h') : wcfg;
      const spd = this._speed(cfg.entity || this._ent('wind_speed'), to);
      if (spd == null) return null;
      const gust = cfg.show_gust === false ? null : this._speed(cfg.gust_entity || this._ent('wind_gust'), to);
      const ds = this._st(cfg.direction_entity || this._ent('wind_direction'));
      const rot = ds ? bearing(ds.state) : null;
      let dir = '';
      if (ds) dir = isNaN(parseFloat(ds.state)) ? ds.state : COMPASS[Math.round(rot / 22.5) % 16];
      return { icon: rot != null ? 'arrow' : 'wind', rot, html: `${L(cfg, '')}${dir ? esc(dir) + ' ' : ''}${spd}${u(to)}${gust != null ? ` ${u(this._t('gust') + ' ' + gust)}` : ''}` };
    }
    _s_uv(cfg) {
      const st = this._st(cfg.entity || this._ent('uv'));
      if (!st) return null;
      const A = st.attributes || {}, now = this._now;
      const f = parseFloat(st.state);
      let level = st.state, num = '';
      if (!isNaN(f)) { level = f < 3 ? 'low' : f < 6 ? 'moderate' : f < 8 ? 'high' : f < 11 ? 'very_high' : 'extreme'; num = ` ${u('(' + f + ')')}`; }
      const ws = cfg.window_entity ? this._st(cfg.window_entity) : st, wa = (ws && ws.attributes) || {};
      const start = this._date(wa.protection_window_start);
      const end = this._date(wa.protection_window_end || (cfg.window_entity && ws ? ws.state : null));
      const future = d => d && d > now;
      const lab = L(cfg, this._t('uv'));
      let alert = ['dangerous', 'dangerous_later', 'high', 'very_high', 'extreme'].includes(level), hot = level === 'dangerous';
      let head, extra = '';
      if (cfg.use_alert_label && A.alert_label) {
        head = esc(A.alert_label); alert = A.has_alert !== false; hot = false;
      } else if (level === 'dangerous_later' && future(start)) {
        head = esc(this._t('uv_dangerous'));
        extra = `${this._t('from')} ${this._when(start)}${future(end) ? ` ${this._t('to')} ${this._time(end)}` : ''}`;
      } else if (level === 'dangerous') {
        head = esc(this._t('uv_dangerous'));
        if (future(end)) extra = `${this._t('until')} ${this._time(end)}`;
      } else {
        head = esc(pretty(level));
        if (future(end)) extra = `${this._t('to')} ${this._time(end)}`;
      }
      const adv = cfg.show_advice && A.advice ? `<small class="adv">${esc(A.advice)}</small>` : '';
      return { icon: 'sun', html: `${lab}${alert ? `<em${hot ? ' class="hot"' : ''}>${head}</em>` : head}${num}${extra ? ` ${u(extra)}` : ''}${adv}` };
    }
    _s_pressure(cfg) {
      const id = cfg.entity || this._ent('pressure'), n = this._n(id);
      if (n == null) return null;
      const unit = (this._unit(id) || 'hPa').replace(/^mbar$/i, 'hPa');
      const ts = this._st(cfg.trend_entity || this._ent('pressure_tendency'));
      const arrow = ts && { rising: '↑', falling: '↓', stable: '→' }[ts.state];
      return { icon: 'gauge', html: `${L(cfg, '')}${Math.round(n)}${u(unit)}${arrow ? `<small class="tr">${arrow}</small>` : ''}` };
    }
    _s_moon(cfg) {
      const st = this._st(cfg.entity || this._ent('moon_phase'));
      return st ? { icon: 'moon', html: `${L(cfg, '')}${esc(pretty(st.state))}` } : null;
    }
    _s_cloud(cfg) {
      const cid = cfg.entity || this._c.cloud_entity;
      let n = cid ? this._n(cid) : null;
      if (n == null && !cid) {
        const w = this._st(this._c.weather_entity), v = parseFloat(w && w.attributes.cloud_coverage);
        n = isNaN(v) ? null : v;
      }
      return n == null ? null : { icon: 'cloud', html: `${L(cfg, this._t('cloud'))}${Math.round(n)}${u('%')}` };
    }
    _enumStat(cfg, key, icon, def, alerts) {
      const st = this._st(cfg.entity || this._ent(key));
      if (!st) return null;
      const v = esc(pretty(st.state));
      return { icon, html: `${L(cfg, def)}${alerts.includes(st.state) ? `<em>${v}</em>` : v}` };
    }
    _s_fire(cfg) { return this._enumStat(cfg, 'fire_danger', 'flame', this._t('fire'), ['high', 'very_high', 'extreme']); }
    _s_pollen(cfg) { return this._enumStat(cfg, 'pollen', 'flower', this._t('pollen'), ['high']); }
    _s_solar_remaining(cfg) {
      const id = cfg.entity || this._ent('solar_remaining'), n = this._n(id);
      return n == null ? null : { icon: 'solar', html: `${L(cfg, '')}${n.toFixed(1)}${u((this._unit(id) || 'kWh') + ' ' + this._t('left'))}` };
    }
    _sunStat(cfg, kind) {
      let d = null;
      if (cfg.entity) { const s = this._st(cfg.entity); d = s && this._date(s.state); }
      else { const s = this._st(FULL.sun); d = s && this._date(s.attributes[kind === 'rise' ? 'next_rising' : 'next_setting']); }
      return d ? { icon: kind, html: `${L(cfg, '')}${esc(this._when(d, this._t('today')))}` } : null;
    }
    _s_sunrise(cfg) { return this._sunStat(cfg, 'rise'); }
    _s_sunset(cfg) { return this._sunStat(cfg, 'set'); }
    _dry(cfg, key, def) {
      const s = this._st(cfg.entity || this._ent(key));
      if (!s) return null;
      const m = /^(.*?)\s*(hrs?|hours?)$/i.exec(s.state.trim());
      const val = m ? m[1].replace(/\s*-\s*/, '–') : s.state;
      return { icon: 'shirt', html: `${L(cfg, def)}${esc(val)}${m ? u(this._t('hrs')) : ''}` };
    }
    _s_drying_am(cfg) { return this._dry(cfg, 'drying_morning', this._t('drying_am')); }
    _s_drying_pm(cfg) { return this._dry(cfg, 'drying_afternoon', this._t('drying_pm')); }
    _s_drying_next(cfg) {
      const s = this._st(cfg.entity || this._ent('drying_next'));
      return s ? { icon: 'shirt', html: `${L(cfg, this._t('drying_next'))}${esc(s.state)}` } : null;
    }
    _s_entity(cfg) {
      const st = this._st(cfg.entity);
      if (!st) return null;
      const name = cfg.name !== undefined ? cfg.name : st.attributes.friendly_name;
      const f = parseFloat(st.state);
      const val = !isNaN(f) && cfg.decimals != null ? f.toFixed(cfg.decimals) : st.state;
      return { icon: 'dot', html: `${name ? esc(name) + ' ' : ''}${esc(val)}${u(cfg.unit || st.attributes.unit_of_measurement)}` };
    }

    _uv() {
      const c = this._c.uv;
      if (!c.show) return '';
      const st = this._st(c.entity || this._ent('uv'));
      let num = c.number_entity ? this._n(c.number_entity) : null, level = st ? st.state : null;
      if (st && !isNaN(parseFloat(st.state))) { if (num == null) num = parseFloat(st.state); level = null; }
      if (num == null && !level) return '';
      const ws = c.window_entity ? this._st(c.window_entity) : st, A = (ws && ws.attributes) || {};
      const now = this._now, future = d => d && d > now;
      const start = this._date(A.protection_window_start), end = this._date(A.protection_window_end || (c.window_entity && ws ? ws.state : null));
      const lv = level || (num < 3 ? 'low' : num < 6 ? 'moderate' : num < 8 ? 'high' : num < 11 ? 'very_high' : 'extreme');
      const danger = lv === 'dangerous' || lv === 'dangerous_later';
      const word = danger ? this._t('uv_dangerous') : lv === 'not_dangerous' ? this._t('uv_not_dangerous') : pretty(lv);
      const cls = lv === 'dangerous' ? ' hot' : (danger || ['high', 'very_high', 'extreme'].includes(lv)) ? ' am' : '';
      const w = danger ? this._t('uv_dangerous') : this._t('protection');
      let line = '';
      if (future(start)) line = `${w} ${this._t('from')} ${this._when(start)}${future(end) ? ` ${this._t('to')} ${this._time(end)}` : ''}`;
      else if (future(end)) line = `${w} ${this._t('now')} ${this._t('to')} ${this._time(end)}`;
      const nstr = num != null ? String(Math.round(num * 10) / 10) : '';
      const label = c.label !== undefined ? c.label : this._t('uv');
      const scale = c.show_scale && num != null ? `<div class="uvb"><div class="dot" style="left:${Math.max(0, Math.min(100, num / 12 * 100)).toFixed(1)}%"></div></div>` : '';
      const adv = c.show_advice && st && st.attributes.advice ? `<div class="uva">${esc(st.attributes.advice)}</div>` : '';
      return `<div><div class="st"><span>${esc(label)}</span><span class="plv${cls}">${nstr ? esc(nstr) + ' - ' : ''}${esc(word)}</span></div>${line ? `<div class="uvt">${esc(line)}</div>` : ''}${scale}${adv}</div>`;
    }

    _pollen() {
      const c = this._c.pollen;
      if (!c.show) return '';
      const st = this._st(c.entity || this._ent('pollen'));
      if (!st) return '';
      const A = st.attributes || {}, lv = String(st.state).toLowerCase();
      const col = { high: 'var(--mw-orange)', moderate: 'var(--mw-amber)', low: 'var(--mw-green)', imminent: 'var(--mw-blue)' };
      const rows = ['high', 'moderate', 'low', 'imminent'].map(k => {
        const items = String(A[k + '_allergens'] || '').split(',').map(x => x.trim()).filter(Boolean);
        if (!items.length) return '';
        const lim = Math.max(1, +c.collapse_after || 6), over = items.length > lim, open = !!this._exp[k];
        let list = esc((over && !open ? items.slice(0, lim) : items).join(', '));
        if (over) list += ` <button class="pm" data-more="${k}">${esc(open ? this._t('less') : this._t('more').replace('{n}', items.length - lim))}</button>`;
        const desc = c.show_descriptions || this._desc[k] ? `<div class="pd">${esc(this._t('pollen_desc_' + k))}</div>` : '';
        return `<button class="pk" data-desc="${k}"><i class="pdot" style="background:${col[k]}"></i>${esc(this._t('pollen_' + k))}${svg('dot')}</button><div class="pv">${list}</div>${desc}`;
      }).join('');
      const label = c.label !== undefined ? c.label : this._t('pollen');
      const lvText = ['none', 'low', 'moderate', 'high'].includes(lv) ? this._t('pollen_' + lv) : pretty(st.state);
      const lvCol = col[lv] || 'var(--n-sec)';
      return `<div><div class="st"><span>${esc(label)}</span><span class="plv" style="color:${lvCol}">${esc(lvText)}</span></div>${rows ? `<div class="pl">${rows}</div>` : ''}</div>`;
    }

    _tomorrow() {
      const st = this._st(this._ent('description_tomorrow'));
      if (!st || !st.state) return '';
      const mode = this._c.tomorrow_label;
      const tmr = new Date(this._now.getTime() + 86400000);
      let label = '';
      if (mode === 'day_name') label = this._wd(tmr, 'long');
      else if (mode === 'tomorrow') label = this._t('tomorrow');
      else if (mode && mode !== 'none') label = String(mode);
      return `<div class="tmw">${label ? `<div class="tt">${esc(label)}</div>` : ''}<div class="tx">${esc(st.state)}</div></div>`;
    }

    _footer() {
      let f = this._c.footer;
      if (f === false) return '';
      if (f === 'auto' || f === true || f === undefined) {
        const s = this._h.states[this._ent('temperature')];
        f = s && s.attributes.attribution;
      }
      return f ? `<div class="ft">${esc(f)}</div>` : '';
    }
  }

  if (!customElements.get(CARD)) customElements.define(CARD, MetserviceWeatherCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: CARD, name: 'MetService Weather Card', description: 'Compact weather card for the MetService NZ integration', preview: false });
  console.info('%c METSERVICE-WEATHER-CARD %c v0.1.0 ', 'background:#0e9db5;color:#fff', 'background:#152238;color:#fff');
})();
