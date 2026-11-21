# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/).

## [0.1.2] - 2026-11-22

### Changed
- UV section: the label now describes the UV right now. "Dangerous" is shown only while the time is inside
  MetService's protection window; at any other time the label is the UN / WHO UV index level (Low,
  Moderate, High, Very high, Extreme), and a UV of 0 is shown as just `0`. Previously a UV of 0 early in
  the morning could read "0 - Dangerous" because MetService said it would be dangerous later.
- UV section: when there is no current or upcoming window, the line under the heading shows MetService's
  own alert text (for example "Not dangerous until tomorrow"), as the MetService website does.
- UV section: a doubled full stop in MetService's advice text is tidied.

## [0.1.1] - 2026-11-16

### Fixed
- A single weather warning no longer repeats its name under the banner headline.

## [0.1.0] - 2026-11-12

First release.

### Added
- Header with temperature, feels-like, condition, clock, date and today's written forecast.
- Weather warning banner with an expandable view of every active warning's full text and threat period,
  coloured by MetService's watch, orange and red levels.
- Hourly strip that scrolls freely, with day names pinned above their hours and sunrise and sunset markers.
- 7-day forecast as temperature bars or a scrollable line graph, with optional solar-forecast figures.
- Optional solar arc with countdown and daylight length.
- UV section (number from any source, MetService protection times and advice) and pollen section
  (plants by level, with what each level means).
- A stats list you choose and order, with a one-line option to point any stat at any sensor.
- Light and dark accent palettes with automatic detection and a `color_scheme` override.
- Built-in icons or the Meteocons icon pack, with automatic darkening of Meteocons on light cards.
- Temperature and wind unit conversion, `clock_24h`, `locale`, `time_zone`, and a `strings` option to
  replace any built-in wording.
- Section order and visibility options.
