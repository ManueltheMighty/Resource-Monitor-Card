# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## 1.2.0

### Added

- New `servers:` config option: monitor multiple servers/devices from a single
  card, each with its own `entities:` block. From two servers onward, a row of
  switch buttons appears in the header; only one server is shown at a time,
  but all configured servers keep collecting live and history data in the
  background so switching shows an already-filled chart instantly.
- Visual editor support for multiple servers: a "+ Add server" button migrates
  an existing single-server configuration into the first entry, each server
  gets its own name field, entity pickers, core list and a "Remove server"
  button.
- `thresholds`, `temperature_thresholds` and the `show_*` visibility flags
  remain global across all servers.

### Changed

- Without `servers:` configured, the card behaves exactly as before (fully
  backward compatible, no visible change for existing single-server setups).

## 1.1.0

### Added

- Card UI now follows the Home Assistant profile language: German when
  `hass.language` is `de`, English otherwise. Applies to the card itself and
  the visual editor.
- New "Processes" popup: a button in the header opens a dialog listing every
  process, sortable by CPU or RAM usage, in a scrollable table.
- New config options `entities.processes`, `processes_attribute` and
  `show_processes` to enable and configure the processes popup.
- New helper script `ha_config_snippets/top_processes.sh` and matching
  `command_line` sensor example for the processes popup.

## 1.0.0

### Added

- Initial release.
- Live line charts for CPU, RAM/Swap (combined) and network in/out, with axes
  and background grid.
- Optional temperature badge, colored by threshold.
- Optional per-core CPU usage chart via custom command_line/template sensors,
  with its own color legend.
- Configurable warning/critical thresholds for CPU/RAM and temperature.
- Per-chart visibility toggles (`show_cpu`, `show_cores`, `show_memory`,
  `show_network`, `show_temperature`).
- Full visual editor (no YAML required), including automatic entity
  suggestions via `getStubConfig`.
- Recorder history is loaded on card start so charts don't begin empty.
