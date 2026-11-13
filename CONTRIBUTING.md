# Contributing

Thanks for taking an interest. Bug reports, ideas and pull requests are all welcome.

## Reporting a problem

Please use the issue forms and include:

- your card configuration (the YAML),
- the card version (shown in the browser console as `METSERVICE-WEATHER-CARD v...`),
- your Home Assistant, browser or phone-app version,
- a screenshot, and whether the dashboard was in light or dark mode.

**Missing or wrong data** (for example a sensor that has no value, or details MetService shows on its
website that the sensors don't carry) belongs in the
[integration's issue tracker](https://github.com/nagelm/metservice-weather/issues). The card can only
display what the integration provides.

## Making a change

The card is a single file with no build step: `metservice-weather-card.js`.

1. Fork the repository and make your change.
2. Check that the file still parses, both as a script and as a browser module:
   ```
   node --check metservice-weather-card.js
   node --input-type=module --check < metservice-weather-card.js
   ```
3. Try it in Home Assistant (copy the file to `/config/www/`, bump `?v=` in the Resources URL, hard-refresh).
4. If you add or change an option, document it in `README.md` and add a line to `CHANGELOG.md`.
5. Open a pull request describing what changed and why. Screenshots help.

Please keep the card working in both light and dark themes, and keep text readable (the accent colours
are defined once as `--mw-*` variables, with a deeper set for light cards).
