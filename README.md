# Resource Monitor Card

*[Deutsche Version](README.de.md)*

A Home Assistant Lovelace custom card in the style of a Linux resource monitor.
Shows CPU, RAM/Swap usage and network in/out as live line charts with axes and
a grid, plus an optional temperature badge and a process list popup.

The card's UI text automatically follows the Home Assistant profile language:
users with `de` see German, everyone else sees English.

## Installation

### Manual
1. Copy `resource-monitor-card.js` to `config/www/resource-monitor-card/`.
2. In Settings → Dashboards → Resources, add
   `/local/resource-monitor-card/resource-monitor-card.js` as a JavaScript module.

### Via HACS
1. HACS → Frontend → "..." → Custom repositories.
2. Add this repository URL, category "Lovelace".
3. Install "Resource Monitor Card", reload Home Assistant.

## Configuration

```yaml
type: custom:resource-monitor-card
title: System Monitor
minutes_to_show: 10
thresholds:
  warning: 70
  critical: 90
temperature_thresholds:
  warning: 65
  critical: 80
entities:
  cpu: sensor.processor_use
  memory: sensor.memory_use_percent
  swap: sensor.swap_use_percent
  network_in: sensor.network_in_eth0
  network_out: sensor.network_out_eth0
  temperature: sensor.processor_temperature   # optional
  processes: sensor.top_processes             # optional
processes_attribute: processes                # optional, default: "processes"
```

| Option | Required | Description |
|---|---|---|
| `title` | no | Card title (default: "System Monitor") |
| `minutes_to_show` | no | Chart time window in minutes (default: 10) |
| `thresholds.warning` / `.critical` | no | Percentage thresholds for the CPU/RAM line color (default: 70 / 90) |
| `temperature_thresholds.warning` / `.critical` | no | Thresholds for the temperature badge color (default: 65 / 80) |
| `entities.cpu` | yes | Entity for CPU usage in % |
| `entities.memory` | yes | Entity for RAM usage in % |
| `entities.swap` | yes | Entity for swap usage in % (combined with RAM into one chart) |
| `entities.network_in` | no | Entity for network in |
| `entities.network_out` | no | Entity for network out |
| `entities.temperature` | no | Entity for a temperature, shown as a badge top-right in the header |
| `entities.cpu_cores` | no | List of entities for per-core CPU usage (own history chart) |
| `entities.processes` | no | Entity whose attribute holds the process list (see below); enables the "Processes" button |
| `processes_attribute` | no | Name of the attribute holding the process list (default: `processes`) |
| `show_cpu` | no | Show the CPU chart (default: `true`) |
| `show_cores` | no | Show the CPU cores chart, if `entities.cpu_cores` is set (default: `true`) |
| `show_memory` | no | Show the RAM/Swap chart (default: `true`) |
| `show_network` | no | Show the network chart, if network entities are set (default: `true`) |
| `show_temperature` | no | Show the temperature badge, if `entities.temperature` is set (default: `true`) |
| `show_processes` | no | Show the processes button, if `entities.processes` is set (default: `true`) |

Every chart (and the processes button) can be toggled independently — either via
`show_*` flags in YAML or in the visual editor under "Visibility". This lets
everyone put together their own selection without removing entities.

Network is fully optional: if both entities are missing, the network chart is
hidden entirely. If only one direction is configured, the chart shows only that
line (the other legend entry is hidden).

The base entities come from the **System Monitor** integration
(Settings → Devices & Services → Add Integration → "System Monitor").
For temperature, a CPU temperature sensor of your system, or any other
numeric-state `sensor.*`, works well.

## Features

- Three stacked charts: CPU, RAM/Swap (combined), network (in/out, optional)
- Optional per-core CPU usage history (one line per core, color legend below) right under the CPU chart
- Every chart has an X/Y axis, labels and a background grid
- Temperature badge top-right in the header, colored by threshold
- CPU and RAM line color changes with usage (green/orange/red)
- A "Processes" button opens a popup listing every process, sortable by CPU or
  RAM usage, in a scrollable table (see below)
- On load, the Recorder history for the last `minutes_to_show` minutes is
  fetched so the chart doesn't start empty; after that it keeps updating live
  from entity state changes
- Automatic scaling of the network Y axis to a "nice" round maximum
- Colors automatically adapt to the light/dark theme
- UI language follows the Home Assistant profile (German for `de`, English otherwise)

## Per-core CPU usage (optional, via your own sensor setup)

System Monitor only provides total CPU usage, not per-core values. A small
script that reads `/proc/stat` lets you add this anyway — the card then shows
per-core usage as its own history chart under the CPU chart.

**Requirement:** Home Assistant needs access to the real host `/proc`
(true for Home Assistant OS, Supervised, and most container installs). On
Docker installs without the host PID namespace, the script may only show
values for the container itself.

**1. Add the script** at `/config/scripts/cpu_per_core.sh` (included in this
repo under `ha_config_snippets/cpu_per_core.sh`):

```bash
#!/bin/bash
# Determines the usage of each CPU core in percent, based on /proc/stat.
# Output: a JSON object, e.g. {"cpu0": 12.3, "cpu1": 45.6}

snapshot() {
  awk '/^cpu[0-9]+/ {
    total = $2+$3+$4+$5+$6+$7+$8+$9
    idle  = $5+$6
    print $1, total, idle
  }' /proc/stat
}

s1="$(snapshot)"
sleep 1
s2="$(snapshot)"

awk -v s1="$s1" '
BEGIN {
  n = split(s1, lines, "\n")
  for (i = 1; i <= n; i++) {
    split(lines[i], f, " ")
    total1[f[1]] = f[2]
    idle1[f[1]] = f[3]
  }
}
{
  name = $1; total2 = $2; idle2 = $3
  dt = total2 - total1[name]
  di = idle2 - idle1[name]
  usage = (dt > 0) ? (1 - di/dt) * 100 : 0
  if (usage < 0) usage = 0
  if (usage > 100) usage = 100
  results[++count] = sprintf("\"%s\": %.1f", name, usage)
}
END {
  printf "{"
  for (i = 1; i <= count; i++) {
    printf "%s", results[i]
    if (i < count) printf ", "
  }
  printf "}\n"
}
' <<< "$s2"
```

The script waits 1 second internally to compute per-core usage from two
`/proc/stat` snapshots — each call therefore takes about 1s, which is fine
with `scan_interval: 10` or higher.

**2. Sensor in `configuration.yaml`** (current syntax: a dedicated
`command_line:` top-level key, **not** `platform: command_line` under
`sensor:` — that's no longer supported by recent Home Assistant versions).
Adjust the number of `cpuN` entries to your core count, e.g. via `nproc`:

```yaml
command_line:
  - sensor:
      name: CPU Cores Raw
      unique_id: cpu_cores_raw
      scan_interval: 10
      command: "bash /config/scripts/cpu_per_core.sh"
      value_template: "OK"
      json_attributes:
        - cpu0
        - cpu1
        - cpu2
        - cpu3

template:
  - sensor:
      - name: "CPU Core 0"
        unique_id: cpu_core_0
        unit_of_measurement: "%"
        state: "{{ state_attr('sensor.cpu_cores_raw', 'cpu0') }}"
      - name: "CPU Core 1"
        unique_id: cpu_core_1
        unit_of_measurement: "%"
        state: "{{ state_attr('sensor.cpu_cores_raw', 'cpu1') }}"
      - name: "CPU Core 2"
        unique_id: cpu_core_2
        unit_of_measurement: "%"
        state: "{{ state_attr('sensor.cpu_cores_raw', 'cpu2') }}"
      - name: "CPU Core 3"
        unique_id: cpu_core_3
        unit_of_measurement: "%"
        state: "{{ state_attr('sensor.cpu_cores_raw', 'cpu3') }}"
```

If your `configuration.yaml` already has a `template:` block, append the new
entries under its existing `- sensor:` list instead of adding a second
`template:` key (YAML only allows one top-level key of the same name per
file). You most likely don't have a `command_line:` key yet, so you can just
add it.

**3. Add it to the card**, either via YAML or the visual editor ("CPU Cores
(optional)" section → "+ Add core"):

```yaml
entities:
  cpu: sensor.processor_use
  memory: sensor.memory_use_percent
  swap: sensor.swap_use_percent
  cpu_cores:
    - sensor.cpu_core_0
    - sensor.cpu_core_1
    - sensor.cpu_core_2
    - sensor.cpu_core_3
```

Without `cpu_cores` configured, this section simply stays hidden.

## Process list popup (optional, via your own sensor setup)

System Monitor doesn't expose per-process data either, so this needs the same
kind of small helper script as the per-core chart above.

**1. Add the script** at `/config/scripts/top_processes.sh` (included in this
repo under `ha_config_snippets/top_processes.sh`). It lists every running
process with its PID, name, CPU % and RAM % as JSON:

```bash
#!/bin/bash
# Lists running processes with CPU and RAM usage in percent.
# Output: a JSON object with a "processes" list, sorted by CPU descending.
# {"processes": [{"pid": 1234, "name": "chromium", "cpu": 12.3, "mem": 5.6}, ...]}

ps -eo pid,comm,%cpu,%mem --no-headers --sort=-%cpu | awk '
BEGIN { printf "{\"processes\": [" }
{
  pid = $1; name = $2; cpu = $3; mem = $4
  gsub(/"/, "\\\"", name)
  printf "%s{\"pid\": %s, \"name\": \"%s\", \"cpu\": %s, \"mem\": %s}", (NR > 1 ? ", " : ""), pid, name, cpu, mem
}
END { printf "]}\n" }
'
```

Sorting by CPU or RAM in the popup is handled by the card itself — the script
deliberately returns every process, unfiltered.

**2. Sensor in `configuration.yaml`**:

```yaml
command_line:
  - sensor:
      name: Top Processes
      unique_id: top_processes
      command: "bash /config/scripts/top_processes.sh"
      scan_interval: 10
      json_attributes:
        - processes
      value_template: "{{ value_json.processes | length }}"
```

The sensor's state becomes the process count; the full list lives in the
`processes` attribute, which the card reads directly — no `template:` sensors
needed here, unlike the per-core setup.

**3. Add it to the card**, either via YAML or the visual editor (pick a
"Processes" entity under Entities):

```yaml
entities:
  processes: sensor.top_processes
```

This adds a "Processes" button next to the temperature badge in the header.
Clicking it opens a popup with every process in a scrollable table; the two
buttons at the top switch the sort order between CPU and RAM usage. The table
only refreshes while the popup is open, so it doesn't cost anything in the
background. Without `entities.processes` configured, the button simply stays
hidden.

## Visual editor

The card can be fully configured through the Lovelace UI (no YAML needed):
Edit dashboard → Add card → select "Resource Monitor Card". The editor offers
entity pickers for every sensor, a dynamic list to add/remove per-core CPU
sensors, fields for title and time window, and the CPU/RAM and temperature
thresholds. When first added, the card also tries to suggest matching System
Monitor entities automatically (`getStubConfig`).

YAML mode remains fully available and equivalent (see above).

## Known limitations

- History is fetched once via the REST API (`history/period`) when the card
  loads; if that fails (e.g. permissions, HA version), the card keeps working
  but starts with empty charts.
- The editor uses `ha-entity-picker` from the HA frontend; if that component
  isn't available for some reason, the editor falls back to plain text fields
  for entity IDs.

## Planned extensions

- Configurable colors per metric
