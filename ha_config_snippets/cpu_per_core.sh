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
