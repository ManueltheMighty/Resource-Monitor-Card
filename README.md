# Resource Monitor Card

Eine Home Assistant Lovelace Custom Card im Stil eines Linux-Ressourcenmonitors.
Zeigt CPU-, RAM/Swap-Auslastung sowie Netzwerk-Ein-/Ausgang als Live-Liniendiagramme
mit Achsen und Gitternetz, plus optionaler Temperatur-Anzeige oben rechts.

## Installation

### Manuell
1. `resource-monitor-card.js` nach `config/www/resource-monitor-card/` kopieren.
2. In Einstellungen → Dashboards → Ressourcen die Datei
   `/local/resource-monitor-card/resource-monitor-card.js` als JavaScript-Modul hinzufügen.

### Über HACS (nach Veröffentlichung)
1. HACS → Frontend → „..." → Benutzerdefinierte Repositories.
2. Repository-URL eintragen, Kategorie „Lovelace".
3. „Resource Monitor Card" installieren, Home Assistant neu laden.

## Konfiguration

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
```

| Option | Pflicht | Beschreibung |
|---|---|---|
| `title` | nein | Kartentitel (Standard: „System Monitor") |
| `minutes_to_show` | nein | Zeitfenster der Graphen in Minuten (Standard: 10) |
| `thresholds.warning` / `.critical` | nein | Schwellenwerte in % für CPU- und RAM-Linienfarbe (Standard: 70 / 90) |
| `temperature_thresholds.warning` / `.critical` | nein | Schwellenwerte für die Temperatur-Badge-Farbe (Standard: 65 / 80) |
| `entities.cpu` | ja | Entity für CPU-Auslastung in % |
| `entities.memory` | ja | Entity für RAM-Auslastung in % |
| `entities.swap` | ja | Entity für Swap-Auslastung in % (wird mit RAM in einem Graphen kombiniert) |
| `entities.network_in` | nein | Entity für Netzwerk-Eingang |
| `entities.network_out` | nein | Entity für Netzwerk-Ausgang |
| `entities.temperature` | nein | Entity für eine Temperatur, erscheint als Badge oben rechts im Header |
| `entities.cpu_cores` | nein | Liste von Entities für die Auslastung pro CPU-Core (eigener Verlaufsgraph) |
| `show_cpu` | nein | CPU-Graph anzeigen (Standard: `true`) |
| `show_cores` | nein | CPU-Cores-Graph anzeigen, sofern `entities.cpu_cores` gesetzt ist (Standard: `true`) |
| `show_memory` | nein | RAM/Swap-Graph anzeigen (Standard: `true`) |
| `show_network` | nein | Netzwerk-Graph anzeigen, sofern Netzwerk-Entities gesetzt sind (Standard: `true`) |
| `show_temperature` | nein | Temperatur-Badge anzeigen, sofern `entities.temperature` gesetzt ist (Standard: `true`) |

Jeder Graph lässt sich also unabhängig ein-/ausblenden – entweder per `show_*`-Flag
in der YAML-Konfiguration oder im visuellen Editor unter „Sichtbarkeit". So kann
sich jeder seine eigene Auswahl zusammenstellen, ohne Entities entfernen zu müssen.

Netzwerk ist vollständig optional: Fehlen beide Entities, wird der Netzwerk-Graph
komplett ausgeblendet. Ist nur eine der beiden Richtungen konfiguriert, zeigt der
Graph nur diese Linie (die andere Legende wird ausgeblendet).

Die Basis-Entities stammen aus der **System Monitor** Integration
(Einstellungen → Geräte & Dienste → Integration hinzufügen → „System Monitor").
Für die Temperatur eignet sich z. B. ein CPU-Temperatursensor deines Systems
oder ein anderer `sensor.*` mit numerischem Zustand.

## Funktionsumfang

- Drei Graphen untereinander: CPU, RAM/Swap (kombiniert), Netzwerk (Ein-/Ausgang, optional)
- Optionaler Verlaufsgraph der Auslastung pro CPU-Kern (eigene Linie je Kern, Farblegende darunter) direkt unter dem CPU-Graphen
- Jeder Graph mit X-/Y-Achse, Beschriftung und Gitternetzlinien im Hintergrund
- Temperatur-Badge oben rechts im Header, farbig nach Schwellenwert
- Linienfarbe von CPU und RAM wechselt je nach Auslastung (grün/orange/rot)
- Beim Laden wird die Recorder-History der letzten `minutes_to_show` Minuten geladen,
  damit der Graph nicht leer startet; danach läuft die Aktualisierung live über die
  Zustandsänderungen der Entities weiter
- Automatische Skalierung der Netzwerk-Y-Achse auf einen „runden" Höchstwert
- Farben passen sich automatisch an Light/Dark-Theme an

## CPU-Auslastung pro Kern (optional, via eigenem Sensor-Setup)

System Monitor liefert nur die CPU-Gesamtauslastung, keine Werte pro Kern. Mit einem
kleinen Skript, das `/proc/stat` ausliest, lässt sich das trotzdem nachrüsten – die
Karte zeigt die Werte dann als Balken unter dem CPU-Graphen an.

**Voraussetzung:** Home Assistant muss auf das echte Host-`/proc` zugreifen können
(bei Home Assistant OS, Supervised und den meisten Container-Installationen der Fall).
Bei Docker-Installationen ohne Host-PID-Namespace zeigt das Skript ggf. nur
Container-eigene Werte.

**1. Skript anlegen** unter `/config/scripts/cpu_per_core.sh` (im Repo unter
`ha_config_snippets/cpu_per_core.sh` enthalten):

```bash
#!/bin/bash
# Ermittelt die Auslastung jedes CPU-Kerns in Prozent auf Basis von /proc/stat.
# Ausgabe: JSON-Objekt, z.B. {"cpu0": 12.3, "cpu1": 45.6}

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

Das Skript wartet intern 1 Sekunde, um aus zwei `/proc/stat`-Schnappschüssen die
Auslastung pro Kern zu berechnen – dadurch dauert jeder Abruf ~1s, was bei
`scan_interval: 10` oder mehr unproblematisch ist.

**2. Sensor in `configuration.yaml`** (aktuelle Syntax: eigener `command_line:`-
Schlüssel, **nicht** `platform: command_line` unter `sensor:` – das wird von neueren
Home-Assistant-Versionen nicht mehr unterstützt). Anzahl der `cpuN`-Einträge an die
eigene Kernzahl anpassen, z. B. per `nproc` ermitteln:

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

Falls in deiner `configuration.yaml` bereits ein `template:`-Block existiert, hänge
die neuen Einträge unter dessen `- sensor:`-Liste an, statt einen zweiten
`template:`-Schlüssel anzulegen (YAML erlaubt pro Datei nur einen Schlüssel
gleichen Namens auf oberster Ebene). Einen `command_line:`-Schlüssel hattest du
vermutlich noch nicht, den kannst du einfach neu hinzufügen.

**3. In der Karte einbinden**, entweder per YAML oder über den visuellen Editor
(Abschnitt „CPU Cores (optional)" → „+ Core hinzufügen"):

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

Ohne konfigurierte `cpu_cores` bleibt der Bereich einfach ausgeblendet.

## Visueller Editor

Die Karte lässt sich komplett über die Lovelace-UI konfigurieren (kein YAML nötig):
Dashboard bearbeiten → Karte hinzufügen → „Resource Monitor Card" auswählen. Der
Editor bietet Entity-Picker für alle Sensoren, eine dynamische Liste zum Hinzufügen/
Entfernen von CPU-Kern-Sensoren, Felder für Titel und Zeitfenster sowie die
Schwellenwerte für CPU/RAM und Temperatur. Beim erstmaligen Hinzufügen
versucht die Karte zusätzlich, passende System-Monitor-Entities automatisch
vorzuschlagen (`getStubConfig`).

Der YAML-Modus bleibt weiterhin verfügbar und identisch nutzbar (siehe oben).

## Bekannte Einschränkungen

- Die History wird per REST-API (`history/period`) einmalig beim Laden der Karte
  abgerufen; schlägt der Abruf fehl (z. B. Berechtigungen, HA-Version), läuft die
  Karte trotzdem weiter, startet dann aber mit leeren Graphen.
- Der Editor nutzt `ha-entity-picker` aus dem HA-Frontend; ist diese Komponente aus
  irgendeinem Grund nicht verfügbar, fällt der Editor automatisch auf einfache
  Textfelder für die Entity-IDs zurück.

## Geplante Erweiterungen

- Konfigurierbare Farben pro Metrik
