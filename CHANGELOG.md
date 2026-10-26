# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## 1.3.0

### Added

* New split mode for the processes popup: `entities.processes_pid`, `entities.processes_name`, `entities.processes_cpu` and `entities.processes_mem` can now be set instead of `entities.processes`, each pointing to an entity whose attribute holds a single flat array (one per field). The card reassembles them into process objects itself at render time. This is for sources that can't put the full process list into one entity attribute — Home Assistant caps entity attributes at roughly 16 KB, which a verbose process list (e.g. from Glances) can exceed once a host runs more than a couple hundred processes.
* New `processes_split_attributes` config option to map the four fields above to the actual attribute names on their respective entities (defaults: `pid`, `name`, `cpu_percent`, `memory_percent` — matching Glances' own field names).
* Split mode is configured per server entry, independently of the simple `entities.processes` mode — a `servers:` setup can mix both.

### Fixed

* Sorting the processes popup by RAM never actually worked: the sort button set an internal `"ram"` key while the data used `"mem"`, so the list order never changed. Now fixed for both the simple and split modes.

## 1.2.1

### Security

* Fixed a stored XSS: the card `title` and per-server `name` (both from `servers:`, introduced in 1.2.0) were inserted into the DOM unescaped, in the card header and in the visual editor's input fields. A dashboard imported from an untrusted source could have used a crafted `title`/`name` to run arbitrary JavaScript in the viewer's authenticated Home Assistant session. Both values are now HTML-escaped before rendering.
* Defense in depth: process PIDs in the processes popup are now escaped like the process name already was; entity IDs are now URL-encoded when building the Recorder history request.

## 1.2.0

### Added

* New `servers:` config option: monitor multiple servers/devices from a single card, each with its own `entities:` block. From two servers onward, a row of switch buttons appears in the header; only one server is shown at a time, but all configured servers keep collecting live and history data in the background so switching shows an already-filled chart instantly.
* Visual editor support for multiple servers: a "+ Add server" button migrates an existing single-server configuration into the first entry, each server gets its own name field, entity pickers, core list and a "Remove server" button.
* `thresholds`, `temperature_thresholds` and the `show_*` visibility flags remain global across all servers.

### Changed

* Without `servers:` configured, the card behaves exactly as before (fully backward compatible, no visible change for existing single-server setups).

## 1.1.0

### Added

* Card UI now follows the Home Assistant profile language: German when `hass.language` is `de`, English otherwise. Applies to the card itself and the visual editor.
* New "Processes" popup: a button in the header opens a dialog listing every process, sortable by CPU or RAM usage, in a scrollable table.
* New config options `entities.processes`, `processes_attribute` and `show_processes` to enable and configure the processes popup.
* New helper script `ha_config_snippets/top_processes.sh` and matching `command_line` sensor example for the processes popup.

## 1.0.0

### Added

* Initial release.
* Live line charts for CPU, RAM/Swap (combined) and network in/out, with axes and background grid.
* Optional temperature badge, colored by threshold.
* Optional per-core CPU usage chart via custom command_line/template sensors, with its own color legend.
* Configurable warning/critical thresholds for CPU/RAM and temperature.
* Per-chart visibility toggles (`show_cpu`, `show_cores`, `show_memory`, `show_network`, `show_temperature`).
* Full visual editor (no YAML required), including automatic entity suggestions via `getStubConfig`.
* Recorder history is loaded on card start so charts don't begin empty.
