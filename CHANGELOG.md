Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

1.1.0
Added
Card UI now follows the Home Assistant profile language: German when hass.language is de, English otherwise. Applies to the card itself and the visual editor.
New "Processes" popup: a button in the header opens a dialog listing every process, sortable by CPU or RAM usage, in a scrollable table.
New config options entities.processes, processes_attribute and show_processes to enable and configure the processes popup.
New helper script ha_config_snippets/top_processes.sh and matching command_line sensor example for the processes popup.
1.0.0
Added
Initial release.
Live line charts for CPU, RAM/Swap (combined) and network in/out, with axes and background grid.
Optional temperature badge, colored by threshold.
Optional per-core CPU usage chart via custom command_line/template sensors, with its own color legend.
Configurable warning/critical thresholds for CPU/RAM and temperature.
Per-chart visibility toggles (show_cpu, show_cores, show_memory, show_network, show_temperature).
Full visual editor (no YAML required), including automatic entity suggestions via getStubConfig.
Recorder history is loaded on card start so charts don't begin empty.
