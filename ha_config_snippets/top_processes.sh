#!/bin/bash
# Ermittelt die laufenden Prozesse mit CPU- und RAM-Auslastung in Prozent.
# Ausgabe: JSON-Objekt mit einer "processes"-Liste, sortiert nach CPU absteigend.
# {"processes": [{"pid": 1234, "name": "chromium", "cpu": 12.3, "mem": 5.6}, ...]}
#
# Sortierung/Filterung im Popup übernimmt die Card selbst; dieses Skript
# liefert bewusst alle Prozesse.

ps -eo pid,comm,%cpu,%mem --no-headers --sort=-%cpu | awk '
BEGIN { printf "{\"processes\": [" }
{
  pid = $1; name = $2; cpu = $3; mem = $4
  gsub(/"/, "\\\"", name)
  printf "%s{\"pid\": %s, \"name\": \"%s\", \"cpu\": %s, \"mem\": %s}", (NR > 1 ? ", " : ""), pid, name, cpu, mem
}
END { printf "]}\n" }
'
