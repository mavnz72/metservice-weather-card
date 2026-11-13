# MetService Weather Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Release](https://img.shields.io/github/v/release/YOUR-GITHUB-USERNAME/metservice-weather-card)](https://github.com/YOUR-GITHUB-USERNAME/metservice-weather-card/releases)
[![Validate](https://github.com/YOUR-GITHUB-USERNAME/metservice-weather-card/actions/workflows/validate.yml/badge.svg)](https://github.com/YOUR-GITHUB-USERNAME/metservice-weather-card/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A compact, themeable weather card for [Home Assistant](https://www.home-assistant.io/), built for the
**[MetService NZ integration](https://github.com/nagelm/metservice-weather)**. It shows the weather
the way New Zealanders read it: MetService's own written forecast, UV protection times, pollen,
fire danger, clothes-drying advice and full warning details, with the usual hourly and daily forecasts.

> **Unofficial community project.** Not affiliated with or endorsed by MetService or Home Assistant.
> All weather data comes from the integration and MetService.

<!--
Screenshots: add images to an images/ folder in the repository and uncomment, for example:

![Dark theme](images/dark.png)
![Light theme](images/light.png)
-->

## Features

- **Header** with temperature, feels-like, condition, clock and date, today's written forecast, and an
  expandable **weather warning** banner with each warning's full text and threat period.
- **Hourly strip** that scrolls smoothly, with the day names pinned above their hours (like Home
  Assistant's own forecast dialog), sunrise and sunset markers, and when rain is expected.
- **7-day forecast** as temperature bars or as a smooth line graph, with a set number of days on
  screen and the rest a scroll away, plus optional solar-forecast figures per day.
- **Solar arc** showing where the sun is in its day, with countdown and daylight length.
- **UV section** that combines a UV number from any source with MetService's protection times, and a
  **pollen section** listing the plants by level, with what each level means.
- **A stats list you choose and order**: wind, pressure, humidity, moon, fire danger, clothes drying
  and anything else you point it at.
- **Light and dark themes**: the accent colours switch automatically (and can be forced).
- **Icons**: built-in line icons, or the Meteocons set.
- Temperature and wind **unit conversion**, clock and time zone options, and every built-in word can be
  replaced for other languages.
- One JavaScript file, no build step. Configured in YAML (there is no visual editor).

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [How sensors are found](#how-sensors-are-found)
- [Configuration reference](#configuration-reference)
- [Stats reference](#stats-reference)
- [UV section](#uv-section)
- [Pollen section](#pollen-section)
- [Light and dark themes](#light-and-dark-themes)
- [Solar arc section](#solar-arc-section)
- [Daily graph](#daily-graph)
- [Icons](#icons)
- [Behaviour notes](#behaviour-notes)
- [Theming](#theming)
- [Example configurations](#example-configurations)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [Acknowledgements](#acknowledgements)
- [Reporting problems](#reporting-problems)
- [License](#license)

---

## Requirements

- A recent Home Assistant. The card uses the weather forecast subscription (the
  `weather/subscribe_forecast` websocket call), not the old `forecast` attribute.
- A **weather entity that supports daily and/or hourly forecasts**. The card checks the entity's
  `supported_features` and quietly hides the daily or hourly section if the forecast type is
  missing.
- The **MetService NZ** integration, [nagelm/metservice-weather](https://github.com/nagelm/metservice-weather)
  on GitHub (the maintained successor to `ciejer/metservice-weather`, which needs Home Assistant
  2026.8 or later). The card was built and tested against its sensors and expects the sensor names
  that integration creates (see [How sensors are found](#how-sensors-are-found)). Other weather
  integrations can be used only by pointing every sensor at its own entities.
- Optional extras: a solar forecast integration (for the solar kWh figures), and any other
  sensor you want to show as a stat line.

---

## Installation

### HACS (recommended)

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=YOUR-GITHUB-USERNAME&repository=metservice-weather-card&category=plugin)

Until the card is in the default HACS store, add it as a custom repository:

1. In Home Assistant open **HACS**, then the **⋮** menu at the top right, then **Custom repositories**.
2. Enter `https://github.com/mavnz72/metservice-weather-card`, choose the type **Dashboard**, and click **Add**.
3. Find **MetService Weather Card** in HACS and click **Download**.
4. Reload your browser (Ctrl+F5). HACS adds the dashboard resource for you. If you manage resources
   yourself, add `/hacsfiles/metservice-weather-card/metservice-weather-card.js` as a **JavaScript module**.
5. Add the card to a dashboard: **Add card, Manual**, with `type: custom:metservice-weather-card`.

Menu names differ slightly between HACS versions. When a new version is released HACS offers it as an
update; reload the browser afterwards.

### Manual

1. Download `metservice-weather-card.js` from the [latest release](https://github.com/YOUR-GITHUB-USERNAME/metservice-weather-card/releases/latest)
   and copy it to `/config/www/metservice-weather-card.js`.
   Check the filename carefully. Repeated downloads are often renamed
   `metservice-weather-card (1).js` or end up with a double dot.
2. In Home Assistant go to **Settings → Dashboards → Resources** (turn on *Advanced mode* in
   your user profile if you can't see Resources) and add:
   - URL: `/local/metservice-weather-card.js?v=1`
   - Type: **JavaScript module**
3. Hard-refresh the browser (Ctrl+F5).
4. Add the card to a dashboard using **Manual card** (YAML) with `type: custom:metservice-weather-card`.

### Updating a manual install

The browser keeps a cached copy of the file, so after replacing it you must make the browser
fetch the new one:

1. Change the number in the Resources URL (`?v=1` → `?v=2`). Any change works.
2. Do a full refresh (Ctrl+F5). If the old card still shows, open the browser developer tools
   (F12), tick **Disable cache** on the Network tab, and reload.
3. On the phone app, clear the cache under *Settings → Companion app → Troubleshooting*.

When the file loads, the browser console shows a teal **METSERVICE-WEATHER-CARD v0.x.x** banner.

---

## Quick start

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
```

That is a complete config. It shows the full card with the default stat lines. Cloud cover and solar figures appear only when you give them a source (see [`cloud`](#cloud) and [`solar_remaining`](#solar_remaining)).

---

## How sensors are found

The card works out the MetService sensor names from the weather entity name:

```
weather.my_town_forecast   →   prefix  my_town   →   sensor.my_town_*
```

The rule: take the part after `weather.`, remove a trailing `_forecast`, and use that as the
prefix. If your entities are named differently, set `sensor_prefix`.

```yaml
weather_entity: weather.my_house_forecast
sensor_prefix: my_house            # only needed if the derived prefix is wrong
```

Any single sensor can also be redirected with [`entities:`](#entity-overrides). A stat or text
line whose sensor is missing, `unavailable` or `unknown` is simply not shown.

### Default sensors

| Used for | Default entity |
|---|---|
| Temperature, feels like | `sensor.<prefix>_temperature`, `sensor.<prefix>_temperature_feel` |
| Today's high / low | `sensor.<prefix>_high_temperature_today`, `sensor.<prefix>_low_temperature_today` |
| Today's description | `sensor.<prefix>_weather_description` |
| Tomorrow's description | `sensor.<prefix>_weather_description_tomorrow` |
| Forecast issued time | `sensor.<prefix>_forecast_issued` |
| Humidity | `sensor.<prefix>_relative_humidity` |
| Rain (8h / 24h / last hour) | `sensor.<prefix>_rain_next_8_hours`, `_rain_next_24_hours`, `_rain_last_hour` |
| Next rain time | `sensor.<prefix>_next_rain_expected` |
| Wind | `sensor.<prefix>_wind_speed`, `_wind_gust`, `_wind_direction` |
| UV | `sensor.<prefix>_uv_index` |
| Pressure and trend | `sensor.<prefix>_pressure`, `_pressure_tendency` |
| Moon | `sensor.<prefix>_moon_phase` |
| Fire danger | `sensor.<prefix>_fire_danger` |
| Pollen | `sensor.<prefix>_pollen` |
| Sunrise / sunset (day-night icons) | `sensor.<prefix>_sunrise`, `sensor.<prefix>_sunset` |
| Clothes drying | `sensor.<prefix>_clothes_drying_morning`, `_clothes_drying_afternoon`, `_clothes_drying_next_good_day` |
| Warnings banner | `sensor.<prefix>_warnings`, `sensor.<prefix>_warning_details` |
| Daily condition fallback | `sensor.<prefix>_condition_today` |
| Next sunrise / sunset stat, sun markers | `sun.sun` |
| Cloud cover | none, set `cloud_entity` |
| Solar remaining today, daily solar kWh | none, set the stat's `entity` and `daily.solar_entities` |

MetService has no cloud sensor, and solar forecasts come from other integrations, so neither
has a default. If none of the expected `sensor.<prefix>_*` sensors exist, or the weather entity
isn't found, the card shows a short notice saying so instead of an empty card.

---

## Configuration reference

Every option except `type` and `weather_entity` is optional. Values shown are the defaults, except
where a comment says otherwise (`locale`, `time_zone`, `cloud_entity`, `strings`).

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast      # required

# ---------- general ----------
name: Home                      # default: weather entity name minus "Forecast"
sensor_prefix: my_town      # default: derived from weather_entity
clock_24h: auto                 # auto (follows your HA profile) | true | false
temperature_unit: auto          # auto (HA unit system) | C | F
wind_unit: auto                 # auto (HA unit system) | km/h | m/s | mph | kn
locale: en-NZ                   # default: your HA language, see General options
time_zone: Pacific/Auckland     # default: your HA profile setting
color_scheme: auto              # auto | light | dark, see Light and dark themes
tomorrow_label: day_name        # day_name | tomorrow | none | any text
footer: auto                    # auto | false | "custom text"
cloud_entity: sensor.my_cloud   # source for the `cloud` stat (none by default)
strings: {}                     # override any built-in wording, see Strings

# ---------- icons ----------
icon_pack: builtin              # builtin | meteocons-line | meteocons-fill | meteocons-flat | custom
icon_animation: header          # header | all | none   (Meteocons only)
icon_contrast: auto             # auto | off | 0.5-1   (Meteocons on light cards)
icon_path: /local/meteocons/line/     # custom pack only
icon_version: 0.1.0             # Meteocons release loaded from the CDN

# ---------- text sources ----------
description_today: sensor.my_town_weather_description
description_tomorrow: sensor.my_town_weather_description_tomorrow

# ---------- header ----------
header:
  show_icon: true
  show_condition: true          # the "Partly cloudy" line
  show_clock: true
  show_feels_like: true
  show_forecast_issued: true
  show_warnings: true           # banner, appears only when a warning is active
  warning_details: collapsed    # collapsed ("More details" button) | expanded | off

# ---------- hourly strip ----------
hourly:
  show: true
  hours: 12                     # how many hours the strip holds
  label: Next hours             # "" hides the label
  show_day: true                # day names pinned above the hours
  show_sunset_marker: true      # sunrise and sunset markers inside the strip
  show_rain_start: true         # "Rain from ..." tag

# ---------- daily rows ----------
daily:
  show: true
  days: 7                       # limited by what the forecast provides
  show_solar: true
  solar_entities: []            # one sensor per day, index 0 = today (none by default)
  style: bars                   # bars | graph
  visible_days: 5               # graph only: columns on screen, scroll for the rest
  show_rain: true               # graph only: rainfall under each day, when the forecast has it
  solar_icon: none              # none | outline | any icon name, e.g. mdi:solar-power-variant-outline
  low_color: "#06b6d4"           # colour of the low end of the bars and the lows line of the graph
  high_color: "#f59e0b"          # colour of the high end of the bars and the highs line of the graph

# ---------- solar arc ----------
sun:
  show: false                   # off by default
  show_times: true              # sunrise and sunset times under the ends of the arc
  show_daylight: true           # "13h 51m of daylight"
  show_countdown: true          # "Sunset in 5h 52m" / "Sunrise in 8h 0m"
  # label: Sun

# ---------- section order ----------
sections: [header, sun, hourly, daily, stats, uv, pollen, tomorrow]   # reorder, or leave sections out

# ---------- UV section ----------
uv:
  show: true
  number_entity: sensor.my_uv_number   # numeric UV index from another integration (none by default)
  show_scale: true                     # coloured 0-12 scale with a marker, when a number is available
  show_advice: true                    # MetService's advice text
  # entity: sensor.my_town_uv_index    # default: the MetService UV sensor
  # window_entity: sensor.x                # sensor holding the protection window attributes
  # label: UV

# ---------- pollen section ----------
pollen:
  show: true
  collapse_after: 6                    # long plant lists show this many, then "+N more"
  show_descriptions: false             # show what each level means under every group
  # entity: sensor.my_town_pollen
  # label: Pollen

# ---------- stat lines ----------
# Giving a stats list REPLACES the default list, so list every line you want.
stats:
  - { type: max }
  - { type: min }
  - { type: humidity }
  - { type: rain }
  - { type: wind }
  - { type: pressure }
  - { type: moon }
  - { type: cloud }
  - { type: fire }
  - { type: sunrise }
  - { type: sunset }
  - { type: drying_am }
  - { type: drying_pm }
```

### General options

| Option | Default | Description |
|---|---|---|
| `weather_entity` | required | The weather entity. Must support daily and/or hourly forecasts. |
| `name` | derived | Location name in the header. Default is the entity's friendly name without a trailing "Forecast". |
| `sensor_prefix` | derived | Prefix used to find the `sensor.<prefix>_*` entities. |
| `clock_24h` | `auto` | `auto` follows the time format in your Home Assistant profile (and your language if that is set to "language"). `true` forces 24-hour, `false` forces 12-hour. Applies everywhere: header, hourly strip and times in stats. |
| `temperature_unit` | `auto` | `auto` uses the unit of your Home Assistant unit system. `C` or `F` forces one. Every temperature is converted from its own sensor or forecast unit, so mixed sources still agree. |
| `wind_unit` | `auto` | `auto` uses your Home Assistant unit system's wind speed unit. Or set `km/h`, `m/s`, `mph` or `kn`. Speed and gust are converted from each sensor's own unit. |
| `locale` | HA language | Language tag used for weekday and month names and date order, for example `en-NZ` or `en-GB`. By default the card uses your Home Assistant language; for plain English it also follows the date format in your profile (DMY gives `en-GB`, MDY gives `en-US`). |
| `time_zone` | HA profile | A time zone name such as `Pacific/Auckland`. By default the card follows your profile: the browser's time zone, or the server's if you chose that. |
| `color_scheme` | `auto` | Which accent palette to use: `auto` works it out from the card's background, `light` or `dark` forces one. See [Light and dark themes](#light-and-dark-themes). |
| `cloud_entity` | none | Sensor for the `cloud` stat. A per-stat `entity:` takes priority. |
| `strings` | built-in English | Overrides for the card's own wording. See [Strings](#strings). |
| `tomorrow_label` | `day_name` | Heading above tomorrow's description. `day_name` = the weekday ("Thursday"), `tomorrow` = "Tomorrow", `none` = no heading, any other text is shown as written. |
| `footer` | `auto` | Small line at the bottom. `auto` uses the attribution of the temperature sensor, `false` hides it, any other text is shown as written. |
| `description_today` | MetService sensor | Entity whose state is today's written forecast. |
| `description_tomorrow` | MetService sensor | Entity whose state is tomorrow's written forecast. |

### Header options (`header:`)

| Option | Default | Description |
|---|---|---|
| `show_icon` | `true` | Big weather icon. |
| `show_condition` | `true` | Condition text under the temperature ("Partly cloudy"). At night a "sunny" state shows as "Clear". |
| `show_clock` | `true` | Clock and date on the right. The clock updates every 15 seconds. |
| `show_feels_like` | `true` | "Feels like" line. |
| `show_forecast_issued` | `true` | "Forecast issued 13:52" in the top corner. |
| `show_warnings` | `true` | Warning banner above the card. Appears only when the warnings sensor is not `none` and its count is above 0. It shows the most severe warning in force, the same as the integration's Warnings sensor, with the headline and the names of the active warnings. The colour follows severity: **watch** is yellow, **warning** amber, **orange** orange and **red** red. MetService's own scale is watch, orange, red; `warning` is an extra level the integration adds for warnings with no colour in their name (road snowfall, frost and marine warnings) so that they rank above a watch. |
| `warning_details` | `collapsed` | The full detail of each active warning, read from the `warning_details` sensor's `active_warnings` list (each item's `name`, `threat_period` and `text`). `collapsed` adds a **More details** button under the banner, like the pollen lists: tap it to show every warning with its threat period and full text, and tap **Show less** to fold it away. `expanded` always shows the details with no button, and `off` shows only the names. The button only appears when the sensor has details to show. |

### Hourly options (`hourly:`)

| Option | Default | Description |
|---|---|---|
| `show` | `true` | Show the strip. |
| `hours` | `12` | Number of hours in the strip. Limited by how many the forecast provides. |
| `label` | `Next hours` | Heading text. `""` removes it. |
| `show_day` | `true` | Shows each day's name above its hours, the way Home Assistant's own forecast dialog does. A day's name sits above its first hour and stays pinned at the left edge while any of that day's hours are in view; the next day's name pushes it out as it arrives. Today shows as "Today", other days by full weekday name. |
| `show_sunset_marker` | `true` | Sunrise and sunset markers between the hours. Calculated for every day in the strip. |
| `show_rain_start` | `true` | Tag at the right of the heading, for example "Rain from Fri 15:00 · 1.0 mm". The mm figure appears only when rain is within 8 hours. When the next-rain sensor only knows the day (`precision: day`, which MetService uses beyond the next day or so) only the day is shown, for example "Rain from Sat", because the time attached to it is a placeholder. |

The strip scrolls sideways by swipe, trackpad, or click-and-drag with a mouse. There is no
visible scroll bar.

### Daily options (`daily:`)

| Option | Default | Description |
|---|---|---|
| `show` | `true` | Show the daily rows. |
| `days` | `7` | Number of days. The heading shows the real count ("7-day"). |
| `show_solar` | `true` | Solar kWh column. Hidden automatically if no solar entities are set or none exist. |
| `solar_entities` | none | List of sensors, one per day, index 0 = today, for example the daily estimate sensors of a solar forecast integration. Values are shown with one decimal. |
| `style` | `bars` | `bars` for the rows below, or `graph` for the [daily graph](#daily-graph). |
| `visible_days` | `5` | Graph only: how many day columns fit on screen. The rest scroll sideways. |
| `show_rain` | `true` | Graph only: rainfall under each day that has some. |
| `solar_icon` | `none` | Icon before each day's solar kWh, in both the bars and the graph. The default is no icon, which keeps the rows uncluttered and gives the bars more room (the number's column is narrower when there is no icon). `outline` is an outlined version of the `mdi:solar-power` icon drawn by the card, and any Home Assistant icon name also works, for example `mdi:solar-power`. |
| `low_color` | `#06b6d4` | Colour at the low end of the temperature bars, and the line of the lows in the graph. Any CSS colour. Setting it applies in light and dark themes alike. |
| `high_color` | `#f59e0b` | Colour at the high end of the bars, and the line of the highs in the graph. |

Each row shows the day, a condition icon, the low and high, and a temperature bar. The bar's
colour blends from `low_color` to `high_color` according to where each temperature sits in the
range of the days shown: the coolest low in the list is the pure low colour and the warmest high is
the pure high colour, and every bar shows the slice of that blend that matches its own
temperatures. On today's row a ring shows the current temperature.
Today's high and low come from the `high_temperature_today` and `low_temperature_today` sensors
when they exist, otherwise from the forecast.

### Entity overrides

Any base sensor can be redirected in one place with `entities:`, without touching the stat lines.

```yaml
entities:
  temperature: sensor.some_other_temperature
  feels_like: sensor.tomorrow_io_home_feels_like
```

Valid keys: `temperature`, `feels_like`, `description_today`, `description_tomorrow`,
`forecast_issued`, `high_today`, `low_today`, `humidity`, `rain_next_8h`, `rain_next_24h`,
`rain_last_hour`, `next_rain`, `wind_speed`, `wind_gust`, `wind_direction`, `uv`, `pressure`,
`pressure_tendency`, `moon_phase`, `fire_danger`, `pollen`, `sunrise`, `sunset`,
`drying_morning`, `drying_afternoon`, `drying_next`, `warnings`, `warning_details`,
`condition_today`, `solar_remaining`, `sun`.

A per-stat `entity:` (below) takes priority over `entities:`.

---

## Stats reference

The stats block is a list of single-line items shown in two columns, in the order you write them.
Long lines wrap inside their column. A stat whose data is missing is skipped and the grid reflows.
Each item can be written as a short word (`- humidity`) or with options (`- { type: wind }`).

```yaml
stats:
  - max
  - { type: wind, show_gust: false }
  - { type: cloud, entity: sensor.tomorrow_io_home_cloud_cover }
```

An unknown `type` is ignored, with one warning in the browser console.

### Options every stat accepts

| Option | Description |
|---|---|
| `entity` | Replace the source sensor. |
| `name` | Replace the label. `name: ""` removes it. |
| `icon` | Replace the icon with any Home Assistant icon, for example `mdi:thermometer`. |
| `show: false` | Hide the line without deleting it. |

### Stat types

| Type | Shows | Default source | Extra options |
|---|---|---|---|
| `max` | `Max 22.0 °C` | `high_temperature_today` | |
| `min` | `Min 11.0 °C` | `low_temperature_today` | |
| `humidity` | `50 %` | `relative_humidity` | |
| `rain` | `1.0 mm from 17:00` | `rain_next_8_hours` and `next_rain_expected` | `period`, `start_entity` |
| `wind` | `NE 26 km/h gust 35` with a direction arrow | wind speed, gust and direction sensors | `gust_entity`, `direction_entity`, `show_gust` |
| `uv` | `UV Dangerous from 09:55 to 16:05` (compact; the [UV section](#uv-section) shows more) | `uv_index` | `window_entity`, `use_alert_label`, `show_advice` |
| `pressure` | `1007 hPa →` | `pressure` and `pressure_tendency` | `trend_entity` |
| `moon` | `Waning Gibbous` | `moon_phase` | |
| `cloud` | `Cloud 90 %` | none, see below | |
| `fire` | `Fire Moderate` | `fire_danger` | |
| `pollen` | `Pollen High` (compact; the [Pollen section](#pollen-section) lists the plants) | `pollen` | |
| `solar_remaining` | `9.3 kWh left` | none, set `entity` | |
| `sunrise` | `Thu 06:06` | `sun.sun` next rising | |
| `sunset` | `Today 19:46` | `sun.sun` next setting | |
| `drying_am` | `Drying AM 1–3 hrs` | `clothes_drying_morning` | |
| `drying_pm` | `Drying PM 1–3 hrs` | `clothes_drying_afternoon` | |
| `drying_next` | `Dry next Today` | `clothes_drying_next_good_day` | |
| `entity` | any sensor you choose | `entity` is required | `unit`, `decimals` |

Default order when you give no `stats:` list: max, min, humidity, rain, wind, pressure, moon,
cloud, fire, sunrise, sunset, drying_am, drying_pm. UV and pollen have their own sections by default;
the `uv` and `pollen` stat types are still available if you want a one-line version as well. Add `cloud_entity` for cloud, and add
`solar_remaining` with an `entity` if you want a solar line.

### Details by stat

#### `rain`
- `period`: `8h` (default), `24h`, or `last_hour`.
- Adds "from <time>" when a future rain time exists (the next-rain sensor's `outlook` is not
  `no_rain_expected`). `start_entity` replaces the sensor holding that time. If that sensor's
  `precision` attribute is `day` the time is a placeholder, so only the day is shown ("from Sat").
- The unit comes from the sensor, `mm` if it has none.

#### `wind`
- Speed and gust are converted to `wind_unit` from the unit on each sensor.
- The arrow points the way the wind is blowing: a north-easterly shows an arrow pointing
  south-west. Direction can be a compass word (`NE`) or degrees.
- `show_gust: false` hides the gust.

#### `uv`
Uses everything the MetService UV sensor provides, so the line says *when* protection is needed,
not just a level word. With the sensor in different states:

| Sensor state | Shows |
|---|---|
| `dangerous_later` | `UV Dangerous from 09:55 to 16:05` (the start has the weekday if it is not today) |
| `dangerous` | `UV Dangerous until 16:05` (in a stronger orange) |
| `not_dangerous`, `low`, `moderate` … | `UV Not Dangerous`, `UV Low` and so on, with `to 16:05` while a protection window is still ahead |

- The times come from the sensor's `protection_window_start` and `protection_window_end`
  attributes, shown in your clock format and time zone. A time that has already passed is not shown.
- The level is shown in amber for dangerous, dangerous later, high, very high and extreme.
- Plain numbers (for example a UV index from another integration) are converted to a level (under 3
  low, under 6 moderate, under 8 high, under 11 very high, above that extreme) and the number is
  shown beside it.
- `window_entity` names a different sensor to read the window attributes from. The end time is also
  read from that sensor's state if it is a timestamp.
- `use_alert_label: true` shows MetService's own `alert_label` text instead ("Dangerous today from
  9:55 AM"). It is in MetService's wording and 12-hour format, and is not affected by `strings`.
- `show_advice: true` adds MetService's `advice` text in small type under the line ("Protection
  required. 9:55 AM - 4:05 PM. Even on cloudy days.").

```yaml
- { type: uv }
- { type: uv, show_advice: true }
- { type: uv, use_alert_label: true }
```

#### `pressure`
- `mbar` is shown as `hPa`.
- The arrow is `↑` rising, `↓` falling, `→` stable, from the pressure-tendency sensor.

#### `cloud`
There is no MetService cloud sensor, so this line needs a source. In order of priority:
the stat's `entity`, then the top-level `cloud_entity`, then the weather entity's
`cloud_coverage` attribute. With none of these, the line is hidden.

```yaml
cloud_entity: sensor.tomorrow_io_home_cloud_cover     # used by the default stat list
# or on the stat itself:
stats:
  - { type: cloud, entity: sensor.tomorrow_io_home_cloud_cover }
```

#### `fire` and `pollen`
The state is shown capitalised. Fire danger turns amber at high, very high and extreme.
Pollen turns amber at high.

#### `solar_remaining`
Has no default sensor. Set `entity` to a sensor holding the energy still to be produced today.
The line uses the outlined solar icon (the same one as the daily column); change it with the stat's `icon:` option.
It shows the value with one decimal, then the sensor's unit and "left".

```yaml
- { type: solar_remaining, entity: sensor.energy_production_today_remaining }
```

#### `sunrise` and `sunset`
The next event from `sun.sun`. An event later today is shown as "Today 19:46" (sunrise and sunset
alike); an event on another day is shown with its weekday, "Thu 06:06". With an `entity:` the sensor's state must be a timestamp.

#### `drying_am`, `drying_pm`, `drying_next`
The MetService drying sensors hold text such as `1 - 3 hrs`; it is tidied to `1–3 hrs`.

#### `entity` (generic)
```yaml
- { type: entity, entity: sensor.soil_temperature, name: Soil, unit: "°C", decimals: 1, icon: mdi:sprout }
```
`name` defaults to the entity's friendly name, `unit` to its unit of measurement, and
`decimals` formats numeric states.

---

## UV section

A dedicated UV block, by default below the stats. The number can come from one service and the
wording and times from MetService, which sends no UV number of its own:

```yaml
uv:
  number_entity: sensor.tomorrow_io_home_uv_index
```

```
UV                                             5 - Dangerous
Dangerous from 09:55 to 16:05
[coloured 0-12 scale with a marker at 5]
Protection required. 9:55 AM - 4:05 PM. Even on cloudy days.
```

- **Top right of the heading (like the pollen level):** the UV number and MetService's level word. With
  no number source the word is shown on its own. If the MetService sensor is missing but a number is available, the word is worked out
  from the number (under 3 low, under 6 moderate, under 8 high, under 11 very high, above that extreme).
- **Line under the heading (times):** taken from the sensor's `protection_window_start` and
  `protection_window_end`, in your clock format and time zone.
  - Window still ahead: `Dangerous from 09:55 to 16:05` (the start has the weekday if it is not today).
  - Window under way: `Dangerous now to 16:05`.
  - Window over, or no window: no second line.
  - For levels other than dangerous the word "Protection" is used instead of "Dangerous".
- **Colours:** dangerous (now) is orange; dangerous later, high, very high and extreme are amber.
- **Scale:** a 0 to 12 bar in the usual UV colours (green, yellow, orange, red, violet) with a marker
  at the number. It needs a number, so it appears only when one is available.
- **Advice:** MetService's `advice` text in small type. It uses MetService's own 12-hour wording.
- The section is hidden when there is no UV data. `show: false` hides it.

| Option | Default | Description |
|---|---|---|
| `show` | `true` | Show the section. |
| `number_entity` | none | Numeric UV sensor. If empty and the main UV sensor itself holds a number, that is used. |
| `entity` | `sensor.<prefix>_uv_index` | The sensor with the level word and window attributes. |
| `window_entity` | same as `entity` | A different sensor to read the `protection_window_*` attributes from. |
| `show_scale` | `true` | The colour scale (needs a number). |
| `show_advice` | `true` | The advice text. |
| `label` | `UV` | Heading. `""` removes it. |

---

## Pollen section

A dedicated block that lists the plants, grouped by how active they are, instead of only the
overall level.

```
POLLEN                                         High
● High        Early Grasses
● Moderate    Birch, Plantain
● Low         Wattle, Macrocarpa, Pinus Radiata, Other Pine, Alder, Elm  +10 more
● Imminent    Dock, Sorrel
```

- **Heading:** the overall level from the pollen sensor, coloured (high orange, moderate amber,
  low green).
- **Groups:** read from the sensor's `high_allergens`, `moderate_allergens`, `low_allergens` and
  `imminent_allergens` attributes, in that order. A group with no plants is left out.
- **Long lists:** a group with more than `collapse_after` plants shows that many followed by a
  **+N more** button; tap it to expand, and again to collapse (**Show less**).
- **What each level means:** tap a group name (it has a small info icon) to show or hide a one-line
  explanation under it. `show_descriptions: true` shows them all the time. The wording can be
  changed with `strings` (`pollen_desc_high`, `pollen_desc_moderate`, `pollen_desc_low`,
  `pollen_desc_imminent`). Imminent means pollen production is expected to start within about two weeks.
- The section is hidden when the pollen sensor is unavailable. `show: false` hides it.

| Option | Default | Description |
|---|---|---|
| `show` | `true` | Show the section. |
| `entity` | `sensor.<prefix>_pollen` | The pollen sensor. |
| `collapse_after` | `6` | Plants shown per group before "+N more". |
| `show_descriptions` | `false` | Show the meaning of each level under its group. |
| `label` | `Pollen` | Heading. `""` removes it. |

---

## Solar arc section

A dashed half-circle with the sun at its place in the day, and sunrise and sunset under its ends.
It is **off by default**; turn it on with:

```yaml
sun:
  show: true
```

```
              . - - - - - ● - .
         . '                      ' .
   ─ ' ─────────────────────────────── ' ─
   06:01        Sunset in 5h 52m         19:52
   Sunrise     13h 51m of daylight       Sunset
```

- **During the day** the sun, a plain gold dot, sits along the arc according to how much daylight
  has passed. The arc is a low, smooth curve that meets the horizon at a gentle angle, so the
  section stays short.
- **At night** the arc stays, with a dim marker at the end it is waiting at: the left end before
  dawn, the right end after dusk. The countdown then reads "Sunrise in 8h 0m".
- **Times** are today's sunrise and sunset, from the `sunrise` and `sunset` sensors when they are
  for today, otherwise calculated from your Home Assistant location. The next sunrise (after
  dusk) comes from `sun.sun`. Times use your clock format and time zone.
- Position: by default the section sits under the header. Move it with [`sections:`](#section-order).

| Option | Default | Description |
|---|---|---|
| `show` | `false` | Show the section. |
| `show_times` | `true` | Sunrise and sunset times under the ends of the arc. |
| `show_daylight` | `true` | The length of the day, for example "13h 51m of daylight". |
| `show_countdown` | `true` | Time until sunset (by day) or sunrise (at night). |
| `label` | none | Optional heading above the arc. |

---

## Daily graph

`daily.style: graph` replaces the daily rows with a graph: each day is a column with its name and
icon, and two smooth lines run across the columns, the `high_color` (amber) for the highs and the `low_color` (cyan) for the lows, with
the temperature written at every point.

```yaml
daily:
  style: graph
  visible_days: 5       # columns on screen; with days: 7 you scroll for the last two
  days: 7
```

- **Scrolling:** the columns are sized so that `visible_days` of them fit the card exactly, and the
  rest sit off to the side. Swipe, trackpad-scroll, or click and drag with a mouse. There is no
  visible scroll bar, and it scrolls freely and smoothly like the hourly strip. If there are fewer days than
  `visible_days`, all of them are shown at full width.
- **Rain:** under any day whose forecast includes rainfall, the amount is shown in blue (for
  example "2.8 mm"). It only appears when the forecast carries a `precipitation` value for that
  day, which depends on your weather integration; `show_rain: false` hides the row.
- **Solar:** if you have set `daily.solar_entities`, each day's kWh is shown under its column in gold.
- **Scale:** the vertical scale fits the highs and lows of the days you show, and never gets
  tighter than 6 degrees so that a flat week doesn't look dramatic.
- Today's high and low use the `high_temperature_today` and `low_temperature_today` sensors, as in
  the bars. The bars' ring for the current temperature is not part of the graph.

---

## Section order

By default the card shows its sections in this order: header, sun (if turned on), hourly, daily,
stats, uv, pollen, tomorrow. List `sections:` to reorder them or to leave some out:

```yaml
sections: [header, hourly, uv, daily, stats]    # no pollen, no tomorrow text, UV moved up
```

Unknown names are ignored. Each section's own `show:` option still applies.

---

## Strings

Every piece of built-in wording can be replaced, for translation or taste:

```yaml
strings:
  today: Aujourd'hui
  feels_like: Ressenti
  days: "{n} jours"
```

| Key | Default | Used for |
|---|---|---|
| `today` | Today | Today's daily row, the hourly day label, the sunset stat |
| `tomorrow` | Tomorrow | Heading when `tomorrow_label: tomorrow` |
| `feels_like` | Feels like | Header |
| `issued` | Forecast issued | Header corner text |
| `rain_from` | Rain from | Hourly rain tag |
| `sunrise`, `sunset` | Sunrise, Sunset | Hourly strip markers |
| `hourly_label` | Next hours | Hourly heading (when `hourly.label` isn't set) |
| `solar_est` | Solar est. kWh | Daily column heading |
| `days` | {n}-day | Daily heading, `{n}` is the number of days |
| `sunrise_in`, `sunset_in`, `daylight` | Sunrise in {t}, Sunset in {t}, {t} of daylight | Solar arc text, `{t}` is a duration such as `5h 52m` |
| `gust` | gust | Wind stat |
| `left` | left | Solar remaining stat |
| `from`, `to`, `until` | from, to, until | Rain start time, UV protection times |
| `uv_dangerous`, `uv_not_dangerous` | Dangerous, Not dangerous | UV level words |
| `now`, `protection` | now, Protection | UV time line ("Dangerous now to 16:05") |
| `pollen_high`, `pollen_moderate`, `pollen_low`, `pollen_imminent`, `pollen_none` | High, Moderate, Low, Imminent, None | Pollen group names and overall level |
| `pollen_desc_high`, `pollen_desc_moderate`, `pollen_desc_low`, `pollen_desc_imminent` | one-line explanations | Pollen level descriptions |
| `more`, `less` | +{n} more, Show less | Pollen list buttons |
| `warn_more`, `warn_less` | More details, Show less | Warning banner button |
| `clear` | Clear | Condition text for a clear night |
| `max`, `min` | Max, Min | Temperature stats |
| `uv`, `cloud`, `fire`, `pollen` | UV, Cloud, Fire, Pollen | Stat labels and section headings |
| `drying_am`, `drying_pm`, `drying_next` | Drying AM, Drying PM, Dry next | Clothes-drying stats |
| `hrs` | hrs | Drying duration unit |

What is not covered by `strings`: weekday and month names (these follow `locale`), the
condition text in the header (taken from Home Assistant's own translation of the weather state
when available), and enum values such as the moon phase, UV level, fire danger and pollen level,
which are shown as the sensor reports them, capitalised. A per-stat `name:` replaces any stat label.

---

## Icons

By default the card draws its own simple line icons. To use the **Meteocons** set for the
weather condition icons:

```yaml
icon_pack: meteocons-line
icon_animation: header
```

| `icon_pack` | Result |
|---|---|
| `builtin` | The card's own icons (default). |
| `meteocons-line` | Meteocons Line |
| `meteocons-fill` | Meteocons Fill |
| `meteocons-flat` | Meteocons Flat |
| `custom` | Your own folder of Meteocons-named SVG files, set with `icon_path`. |

| `icon_animation` | Result |
|---|---|
| `header` (default) | Only the big header icon is animated, the rest are static. |
| `all` | Every icon is animated. This can be heavy on phones, with around 20 icons. |
| `none` | All static. |

- Meteocons icons are loaded from the jsDelivr CDN (`@meteocons/svg` for animated,
  `@meteocons/svg-static` for static), pinned to `icon_version`. The browser needs internet
  access to the CDN. Meteocons is MIT licensed, by Bas Milius.
- If an icon fails to load, that one icon falls back to the built-in drawing.
- **Sunrise and sunset markers.** With a Meteocons pack the markers in the hourly strip are drawn by
  the card itself in the Meteocons Line style, not loaded from the CDN. In the original Meteocons files
  the horizon line under the sun is near-black, which disappears on a dark card, so the card draws it
  in your theme's secondary text colour (and the sun in the theme-aware sun colour). With a `custom`
  pack the markers are loaded from your folder as they are.
- **Light themes.** Meteocons were designed for dark or coloured backgrounds, so their clouds are
  a very pale blue (`#E6EFFC`) in every style (Line, Fill and Flat), which almost disappears on a
  white card. With `icon_contrast: auto` (the default) the card decides whether it is on a light
  background (see [Light and dark themes](#light-and-dark-themes)) and, if it is, darkens the Meteocons icons so the clouds show as grey while the sun, rain and
  lightning keep their colour. Use `icon_contrast: off` to switch it off, or a number between
  0.5 and 1 (lower is darker, the default is 0.7) to tune it. The built-in icons follow your
  theme's text colour and are readable on any theme.
- The icon pack affects the header icon, the hourly strip, the daily rows and the sunrise/sunset
  markers. The small stat-line icons are always the built-in style, or whatever you set with a
  per-stat `icon:`.
- **Self-hosting** (for use without internet): copy a Meteocons style folder to `/config/www/`
  and use `icon_pack: custom` with `icon_path: /local/meteocons/line/`. A custom pack uses the
  same folder for animated and static, and needs these file names: `clear-day`, `clear-night`,
  `partly-cloudy-day`, `partly-cloudy-night`, `partly-cloudy-day-rain`,
  `partly-cloudy-night-rain`, `cloudy`, `overcast`, `rain`, `drizzle`, `extreme-rain`,
  `thunderstorms-day-rain`, `thunderstorms-rain`, `sleet`, `hail`, `snow`, `fog`, `mist`,
  `haze`, `wind`, `sunrise`, `sunset` (each `.svg`).

### How conditions map to icons

Both the Home Assistant condition names (`sunny`, `partlycloudy`, `rainy`, `lightning-rainy` …)
and MetService words (`fine`, `partly-cloudy`, `few-showers` …) are understood. The match is
by keyword: thunder/storm, pour/heavy rain, drizzle, shower, rain, sleet, hail, snow, fog, mist,
haze, wind, partly/few clouds, overcast, cloud, clear/sunny/fine. Night versions are used after
sunset. Anything unrecognised gets a cloud.

---

## Behaviour notes

- **Forecast data.** The card subscribes to the weather entity's daily and hourly forecasts and
  updates live. It unsubscribes when the card is removed from the page.
- **Day and night.** The night icons switch at the time of the `sunrise` and `sunset` sensors
  (falling back to `sun.sun`, then 06:00 to 20:00).
- **Sunrise and sunset markers.** Calculated from Home Assistant's latitude and longitude
  (Settings → System → General) for every day in the strip, then lined up with `sun.sun`'s own
  next rising and setting. Without a location set, the card repeats the next events every 24
  hours, which drifts by a minute or two per day.
- **Time zone.** Times follow your Home Assistant profile: the browser's time zone by default, or the server's if you chose that. `time_zone:` overrides both.
- **Units.** Temperatures and wind speeds are converted to the display unit. Rain, pressure and other values are shown in the unit their sensor reports.
- **Tapping the header** opens the weather entity's more-info dialog.
- **Narrow screens.** Below about 420 px wide the padding, font sizes and header shrink. The
  stats stay in two columns and lines wrap rather than being cut off.
- **Errors.** If something goes wrong while drawing, the card shows the error message in place
  of the content, and logs it to the browser console.
- **Dashboard sizing.** In sections views the card defaults to 12 columns wide, minimum 6.

---

## Theming

The card draws its own `ha-card`, so styling is set inside the card. It follows your theme and
Home Assistant's standard card variables, and each can be overridden with a `metservice-` variable
in your theme:

| Part | Variables, first one found wins |
|---|---|
| Background | `--metservice-card-background`, `--ha-card-background`, `--card-background-color` |
| Border colour | `--metservice-card-border-color`, `--ha-card-border-color`, `--divider-color` |
| Border width | `--metservice-card-border-width`, `--ha-card-border-width`, otherwise 1 px |
| Corner radius | `--metservice-card-radius`, `--ha-card-border-radius`, otherwise 12 px (the warning banner and the notice boxes use the same radius, so their corners match the card's) |
| Divider lines | `--metservice-divider-color`, `--divider-color` |
| Text | `--primary-text-color`, `--secondary-text-color` |
| Highlights | `--primary-color` (rain tag, bar track, current-temperature ring), `--warning-color` (amber alerts), `--error-color` |

For example, in your theme file:

```yaml
metservice-card-border-width: "2px"
metservice-card-radius: "20px 7px 20px 20px"
```

Text, icon and divider colours follow the theme. The coloured accents (gold, amber, orange and so
on) come in a dark-card and a light-card version, described next.

### Light and dark themes

The text and background colours always come from your theme. The card's **accent colours** (the
gold of the solar figures, the amber of UV and warnings, the amber and cyan lines of the graph,
the blues, the pollen dots) were chosen for dark cards and are too pale to read on white, so each
has a second, deeper version for light cards. The deeper shades reach about 4.5:1 contrast on a
white card for text, and about 3:1 for graphics.

| Accent | Used for | Dark card | Light card |
|---|---|---|---|
| Gold | solar kWh and its heading | `#ffc300` | `#8f6d00` |
| Sun | sun in the weather icons and the solar arc | `#ffc300` | `#b88c00` |
| Yellow | watch warnings | `#facc15` | `#8a6f03` |
| Amber | UV, pollen moderate, plain warnings, notices | your theme's `--warning-color`, else `#f59e0b` | `#a06707` |
| Orange | UV now, pollen high, orange warnings | `#fb923c` | `#b95504` |
| Red | red warnings | `#f87171` | `#e60b0b` |
| Low colour (cyan) | low end of the bars, graph lows | `#06b6d4` | `#059ab4` |
| High colour (amber) | high end of the bars, graph highs | `#f59e0b` | `#c57f08` |
| Green | pollen low | `#84cc16` | `#669e11` |
| Blue | rain tag, pollen imminent | your theme's `--primary-color`, else `#4f9cf0` | `#006fe5` |
| Info blue | pressure trend arrow | `#5aa3f0` | `#1372d6` |
| Night / rain icons | moon, rain and snow icons, the sun marker at night | `#7fb4f0` / `#4f9cf0` | `#4190e9` / `#3a90ee` |

On a light card the UV scale is also given a little more depth, and
the Meteocons icons are darkened (see [Icons](#icons)).

**How the card decides** (`color_scheme: auto`, the default):

1. It measures the colour of its own background. A light background gives the light palette.
2. If the background can't be measured because it is transparent or a gradient (for example a
   card over a wallpaper), it follows Home Assistant's dark-mode setting instead.
3. It checks again whenever you switch between light and dark mode or change theme.

**Correcting it.** If the automatic choice is wrong, force it:

```yaml
color_scheme: light    # use the deeper accents (the card sits on a light background)
color_scheme: dark     # use the bright accents (the card sits on a dark background)
```

`color_scheme` only chooses the accent palette and whether Meteocons icons are darkened. It does
not change your theme's background or text colours, and `icon_contrast: off` still switches off the
icon darkening on its own.

---

## Example configurations

### Minimal

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
```

### Cloud cover and solar from other integrations

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
cloud_entity: sensor.tomorrow_io_home_cloud_cover
uv:
  number_entity: sensor.tomorrow_io_home_uv_index
daily:
  solar_entities:
    - sensor.energy_production_today
    - sensor.energy_production_tomorrow
    - sensor.energy_production_d2
    - sensor.energy_production_d3
    - sensor.energy_production_d4
    - sensor.energy_production_d5
    - sensor.energy_production_d6
stats:
  - max
  - min
  - humidity
  - rain
  - wind
  - pressure
  - moon
  - cloud
  - fire
  - { type: solar_remaining, entity: sensor.energy_production_today_remaining }
  - sunrise
  - sunset
  - drying_am
  - drying_pm
```

### Compact card: US units and 12-hour clock, no clock in the header, 24 hours, 5 days, fewer lines

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
clock_24h: false
temperature_unit: F
wind_unit: mph
locale: en-US
header:
  show_clock: false
  show_condition: false
hourly:
  hours: 24
  label: Hourly
daily:
  days: 5
  show_solar: false
tomorrow_label: tomorrow
footer: false
sections: [header, hourly, daily, stats, tomorrow]    # no UV or pollen sections
stats:
  - wind
  - rain
  - pressure
  - sunrise
  - sunset
```

### Daily graph with the solar arc

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
sun:
  show: true
daily:
  style: graph
  visible_days: 5
  days: 7
```

### Meteocons icons, all animated

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
icon_pack: meteocons-fill
icon_animation: all
```

### No hourly strip or daily rows, text and stats only

```yaml
type: custom:metservice-weather-card
weather_entity: weather.my_town_forecast
hourly: { show: false }
daily: { show: false }
```

### Using another weather integration

```yaml
type: custom:metservice-weather-card
weather_entity: weather.home
description_today: sensor.my_text_forecast
entities:
  temperature: sensor.outdoor_temperature
  feels_like: sensor.outdoor_feels_like
  humidity: sensor.outdoor_humidity
  wind_speed: sensor.wind_speed
  wind_gust: sensor.wind_gust
  wind_direction: sensor.wind_bearing
  pressure: sensor.outdoor_pressure
  high_today: sensor.todays_high
  low_today: sensor.todays_low
header:
  show_forecast_issued: false
  show_warnings: false
daily:
  show_solar: false
stats:
  - max
  - min
  - humidity
  - wind
  - pressure
  - sunrise
  - sunset
```

---

## Known limitations

1. **MetService-specific data.** The default sensor names (`sensor.<prefix>_*`), the attributes the
   card reads (`outlook`, `protection_window_end`, `daily_conditions`, `headline`, `count`), and
   the formats it parses (drying `1 - 3 hrs`, pressure `rising`/`falling`/`stable`, the UV and fire
   words) are those of the MetService integration. With another integration, point each sensor at
   your own with `entities:` and remove the stats that have no equivalent.
2. **No built-in cloud or solar source.** Both need entities from you (see above).
3. **Wording.** The card's own wording is English unless you override it with `strings:`.
   Enum values (moon phase, UV level, fire danger, pollen level) are shown as the sensor reports them.
4. **Only temperature and wind are unit-converted.** Rain, pressure and other values are shown in
   the unit their sensor uses.
5. **CDN dependency.** Meteocons icons load from jsDelivr (version pinned to `icon_version`).
   Offline, they fall back to the built-in icons unless you self-host them.
6. **Accent colours are built in.** The accent palette (gold, amber, orange, cyan and so on) has a
   dark-card and a light-card version and can't be changed from your theme; `color_scheme` only
   chooses between them.
7. **No visual editor.** The card appears in the card picker, but you configure it in YAML.

---

## Troubleshooting

| Problem | Things to check |
|---|---|
| **"Custom element doesn't exist: metservice-weather-card"** | The file did not load. Check the filename in `/config/www/` (no double dot, no `(1)`), that the Resources entry is exactly `/local/metservice-weather-card.js?v=N` with type *JavaScript module*, then bump `?v=N` and hard-refresh. Open `http://<your-ha>:8123/local/metservice-weather-card.js?v=N` in a browser tab; you should see the source starting with the version comment. In the console, look for the teal METSERVICE-WEATHER-CARD banner. |
| Old version still showing after an update | Browser cache. Bump `?v=`, hard-refresh, or tick *Disable cache* in the developer tools Network tab. On the phone app, clear its cache. |
| A notice says "No MetService sensors found" | The prefix rule didn't match your sensor names (see [How sensors are found](#how-sensors-are-found)). Set `sensor_prefix` or `entities:`. |
| A notice says the weather entity was not found | Check `weather_entity` against Developer Tools → States. |
| Card loads but most stats are missing | Same as above: the sensor names or prefix. |
| No hourly strip or daily rows | The weather entity doesn't support that forecast type, or `show: false` is set. Check the entity's `supported_features` in Developer Tools → States (1 = daily, 2 = hourly, 4 = twice daily; hourly + daily = 3). |
| Fewer hours than `hours:` | The forecast doesn't contain that many hours ahead. |
| Rain tag missing | There is no future rain time on the next-rain sensor, or `show_rain_start` is `false`. |
| UV section has no number | MetService sends no UV number. Set `uv.number_entity` to a numeric UV sensor (for example from Tomorrow.io). |
| UV or pollen section missing | The sensor is unavailable, or `show: false` is set, or the section isn't in your `sections:` list. |
| Cloud line missing | There is no cloud source; set `cloud_entity` or `entity:` on the `cloud` stat. |
| Solar line or column missing | Solar has no default; set `entity:` on the `solar_remaining` stat and `daily.solar_entities`. |
| Clock or dates in the wrong format | Set `clock_24h`, `locale` and `time_zone` explicitly. |
| Temperatures in the wrong unit | Set `temperature_unit` (and `wind_unit`) explicitly. |
| Sunrise/sunset markers missing | Check `show_sunset_marker`, and that your Home Assistant location is set. |
| Accent colours look too pale or too dark | The card has picked the wrong palette for your card background (common with transparent cards over a wallpaper). Set `color_scheme: light` or `dark`. |
| Meteocons clouds hard to see on a light card | Use the default `icon_contrast: auto`, or set a lower number such as `0.6` for darker icons. The built-in icon pack (`icon_pack: builtin`) always follows the theme. |
| Meteocons icons are blank or the old style | The device may not reach jsDelivr, or `icon_pack` is misspelled. A failed icon falls back to the built-in one. |
| Stat line shows nothing for one sensor | That sensor is `unavailable` or `unknown` and is skipped on purpose. |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## Acknowledgements

- **The data.** This card only displays what the
  [MetService NZ integration](https://github.com/nagelm/metservice-weather) provides. Thank you to its
  maintainer, [@nagelm](https://github.com/nagelm), and to the author of the original
  [ciejer/metservice-weather](https://github.com/ciejer/metservice-weather). Weather data is provided by
  [MetService](https://www.metservice.com/).
- **Design inspiration** came from these Home Assistant weather cards:
  - [clock-weather-card](https://github.com/pkissling/clock-weather-card) by pkissling, an iOS-inspired
    clock and weather card.
  - [sun-weather-card](https://github.com/korova-sq/sun-weather-card) by korova-sq, a weather card with a
    sunrise/sunset arc and bar or graph forecasts.
  - [platinum-weather-card](https://github.com/Makin-Things/platinum-weather-card) by Makin-Things, a fully
    customisable weather card.

  The card's code was written independently; these projects are credited for the ideas.
- **Icons.** The optional icon pack is [Meteocons](https://github.com/basmilius/meteocons) by Bas Milius (MIT),
  and the outlined solar icon is drawn from the [Material Design Icons](https://pictogrammers.com/library/mdi/)
  `solar-power` glyph by Pictogrammers (Apache 2.0). Full texts are in
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Reporting problems

Please [open an issue](https://github.com/YOUR-GITHUB-USERNAME/metservice-weather-card/issues/new/choose) and include your card
configuration, your Home Assistant version and a screenshot. If a value is **missing from the sensors**
themselves (for example the Area, Impact and Action text of a warning), that has to be added in the
[integration](https://github.com/nagelm/metservice-weather/issues) rather than here. See
[CONTRIBUTING.md](CONTRIBUTING.md) if you would like to help.

---

## License

[MIT](LICENSE). Third-party artwork is covered by its own licences, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
