/**
 * Resource Monitor Card
 * Home Assistant Lovelace Custom Card im Stil eines Linux-Ressourcenmonitors.
 *
 * Konfiguration (Beispiel):
 * type: custom:resource-monitor-card
 * title: System Monitor
 * minutes_to_show: 10       # Zeitfenster der Graphen in Minuten
 * thresholds:                # gilt für CPU- und RAM-Graph (Linienfarbe/Wert)
 *   warning: 70
 *   critical: 90
 * temperature_thresholds:
 *   warning: 65
 *   critical: 80
 * entities:
 *   cpu: sensor.processor_use
 *   memory: sensor.memory_use_percent
 *   swap: sensor.swap_use_percent
 *   network_in: sensor.network_in_eth0
 *   network_out: sensor.network_out_eth0
 *   temperature: sensor.processor_temperature   # optional
 *   processes: sensor.top_processes              # optional, siehe unten
 * processes_attribute: processes   # optional, Name des Attributs mit der Prozessliste (Default: "processes")
 * show_processes: true             # optional, Prozess-Button ein-/ausblenden
 *
 * Lokalisierung: Die Karte zeigt Texte auf Deutsch, wenn hass.language "de"
 * ist, sonst auf Englisch (siehe STRINGS weiter unten).
 *
 * Prozess-Popup (entities.processes):
 * Erwartet einen Sensor, dessen Attribut (processes_attribute, Default
 * "processes") eine Liste von Objekten { pid, name, cpu, mem } enthält.
 * Erzeugbar z. B. mit dem beiliegenden Skript top_processes.sh über einen
 * command_line-Sensor:
 *
 * command_line:
 *   - sensor:
 *       name: Top Processes
 *       command: "bash /config/scripts/top_processes.sh"
 *       scan_interval: 10
 *       json_attributes:
 *         - processes
 *       value_template: "{{ value_json.processes | length }}"
 */

const DEFAULT_MINUTES = 10;
const DEFAULT_THRESHOLDS = { warning: 70, critical: 90 };
const DEFAULT_TEMP_THRESHOLDS = { warning: 65, critical: 80 };
const MAX_BUFFER_POINTS = 1000; // harte Obergrenze pro Puffer, unabhängig vom Zeitfenster

const COLOR_GOOD = "#4caf50";
const COLOR_WARN = "#ff9800";
const COLOR_CRIT = "#f44336";
const COLOR_SWAP = "#ab47bc";
const COLOR_NET_IN = "#9c27b0";
const COLOR_NET_OUT = "#e91e63";
const COLOR_GRID = "rgba(128,128,128,0.25)";
const COLOR_AXIS_TEXT = "var(--secondary-text-color, #888)";
const CORE_COLORS = [
  "#03a9f4",
  "#4caf50",
  "#ff9800",
  "#e91e63",
  "#9c27b0",
  "#00bcd4",
  "#8bc34a",
  "#ff5722",
  "#3f51b5",
  "#cddc39",
  "#795548",
  "#607d8b",
];

// Übersetzungen: Deutsch für hass.language === "de", Englisch als Fallback
// für alle anderen Sprachen.
const STRINGS = {
  de: {
    now: "jetzt",
    cpu: "CPU",
    cpu_cores: "CPU Cores",
    ram_swap: "RAM / Swap",
    ram: "RAM",
    swap: "Swap",
    network: "Netzwerk",
    network_in: "Eingang",
    network_out: "Ausgang",
    core: "Core",
    processes: "Prozesse",
    process_name: "Prozess",
    process_pid: "PID",
    process_cpu: "CPU %",
    process_ram: "RAM %",
    sort_by_cpu: "Nach CPU sortieren",
    sort_by_ram: "Nach RAM sortieren",
    close: "Schließen",
    no_data: "Keine Daten",
    editor_title: "Titel",
    editor_minutes: "Zeitfenster der Graphen (Minuten)",
    editor_visibility: "Sichtbarkeit",
    editor_visibility_hint:
      "Bestimmt, welche Graphen auf dieser Karte angezeigt werden – unabhängig davon, ob die zugehörigen Entities konfiguriert sind.",
    editor_entities: "Entities",
    editor_entities_hint:
      "Netzwerk, Temperatur und Prozesse sind optional – leer lassen, um den jeweiligen Graphen/Button auszublenden.",
    editor_cores: "CPU Cores (optional)",
    editor_cores_hint:
      "Zeigt einen Verlauf pro Core unter dem CPU-Graphen, z. B. aus eigenen command_line-/Template-Sensoren.",
    editor_add_core: "+ Core hinzufügen",
    editor_remove_core: "Core entfernen",
    editor_thresholds_cpu_ram: "Schwellenwerte CPU / RAM (%)",
    editor_warning: "Warnung",
    editor_critical: "Kritisch",
    editor_thresholds_temp: "Schwellenwerte Temperatur",
    field_cpu: "CPU-Auslastung",
    field_memory: "RAM-Auslastung",
    field_swap: "Swap-Auslastung",
    field_network_in: "Netzwerk Eingang (optional)",
    field_network_out: "Netzwerk Ausgang (optional)",
    field_temperature: "Temperatur (optional)",
    field_processes: "Prozesse (optional)",
    vis_cpu: "CPU-Graph anzeigen",
    vis_cores: "CPU-Cores-Graph anzeigen",
    vis_memory: "RAM/Swap-Graph anzeigen",
    vis_network: "Netzwerk-Graph anzeigen",
    vis_temperature: "Temperatur-Badge anzeigen",
    vis_processes: "Prozess-Button anzeigen",
  },
  en: {
    now: "now",
    cpu: "CPU",
    cpu_cores: "CPU Cores",
    ram_swap: "RAM / Swap",
    ram: "RAM",
    swap: "Swap",
    network: "Network",
    network_in: "In",
    network_out: "Out",
    core: "Core",
    processes: "Processes",
    process_name: "Process",
    process_pid: "PID",
    process_cpu: "CPU %",
    process_ram: "RAM %",
    sort_by_cpu: "Sort by CPU",
    sort_by_ram: "Sort by RAM",
    close: "Close",
    no_data: "No data",
    editor_title: "Title",
    editor_minutes: "Chart time window (minutes)",
    editor_visibility: "Visibility",
    editor_visibility_hint:
      "Controls which charts are shown on this card, regardless of whether the matching entities are configured.",
    editor_entities: "Entities",
    editor_entities_hint:
      "Network, temperature and processes are optional — leave blank to hide the matching chart/button.",
    editor_cores: "CPU Cores (optional)",
    editor_cores_hint:
      "Shows a history per core below the CPU chart, e.g. from your own command_line/template sensors.",
    editor_add_core: "+ Add core",
    editor_remove_core: "Remove core",
    editor_thresholds_cpu_ram: "CPU / RAM thresholds (%)",
    editor_warning: "Warning",
    editor_critical: "Critical",
    editor_thresholds_temp: "Temperature thresholds",
    field_cpu: "CPU usage",
    field_memory: "RAM usage",
    field_swap: "Swap usage",
    field_network_in: "Network in (optional)",
    field_network_out: "Network out (optional)",
    field_temperature: "Temperature (optional)",
    field_processes: "Processes (optional)",
    vis_cpu: "Show CPU chart",
    vis_cores: "Show CPU cores chart",
    vis_memory: "Show RAM/Swap chart",
    vis_network: "Show network chart",
    vis_temperature: "Show temperature badge",
    vis_processes: "Show processes button",
  },
};

function langFor(hass) {
  return hass && hass.language === "de" ? "de" : "en";
}

function t(lang, key) {
  const dict = STRINGS[lang] || STRINGS.en;
  return dict[key] !== undefined ? dict[key] : STRINGS.en[key] !== undefined ? STRINGS.en[key] : key;
}

function statusColor(value, thresholds) {
  if (value >= thresholds.critical) return COLOR_CRIT;
  if (value >= thresholds.warning) return COLOR_WARN;
  return COLOR_GOOD;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function niceMax(value) {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  let nice;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function formatTimeOffset(msAgo, lang) {
  const sec = Math.round(msAgo / 1000);
  if (sec <= 0) return t(lang, "now");
  if (sec < 60) return `-${sec}s`;
  const min = Math.round(sec / 60);
  return `-${min}min`;
}

class ResourceMonitorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._buffers = {
      cpu: [],
      memory: [],
      swap: [],
      network_in: [],
      network_out: [],
    };
    this._entityToKey = {};
    this._historyRequested = false;
    this._lastRender = 0;
    this._resizeObserver = null;
    this._lang = "en";
    this._domBuilt = false;
    this._procDialogOpen = false;
    this._procSort = "cpu";
  }

  _t(key) {
    return t(this._lang, key);
  }

  static getConfigElement() {
    return document.createElement("resource-monitor-card-editor");
  }

  static getStubConfig(hass) {
    // Versucht, passende System-Monitor-Entities automatisch vorzuschlagen.
    const findEntity = (patterns) => {
      if (!hass) return "";
      const ids = Object.keys(hass.states);
      for (const p of patterns) {
        const match = ids.find((id) => id.startsWith("sensor.") && id.includes(p));
        if (match) return match;
      }
      return "";
    };
    return {
      title: "System Monitor",
      minutes_to_show: DEFAULT_MINUTES,
      thresholds: { ...DEFAULT_THRESHOLDS },
      temperature_thresholds: { ...DEFAULT_TEMP_THRESHOLDS },
      entities: {
        cpu: findEntity(["processor_use", "cpu_percent"]),
        memory: findEntity(["memory_use_percent"]),
        swap: findEntity(["swap_use_percent"]),
        network_in: findEntity(["network_in"]),
        network_out: findEntity(["network_out"]),
        temperature: findEntity(["temperature"]),
        processes: findEntity(["top_processes", "processes"]),
      },
    };
  }

  setConfig(config) {
    if (!config || !config.entities) {
      throw new Error("resource-monitor-card: 'entities' muss konfiguriert sein.");
    }
    const req = ["cpu", "memory", "swap"];
    for (const key of req) {
      if (!config.entities[key]) {
        throw new Error(`resource-monitor-card: entities.${key} fehlt.`);
      }
    }

    this._config = {
      title: config.title || "System Monitor",
      minutes_to_show: config.minutes_to_show || DEFAULT_MINUTES,
      thresholds: { ...DEFAULT_THRESHOLDS, ...(config.thresholds || {}) },
      temperature_thresholds: {
        ...DEFAULT_TEMP_THRESHOLDS,
        ...(config.temperature_thresholds || {}),
      },
      entities: config.entities,
    };

    this._hasNetworkIn = !!config.entities.network_in;
    this._hasNetworkOut = !!config.entities.network_out;
    this._cpuCores = Array.isArray(config.entities.cpu_cores)
      ? config.entities.cpu_cores.filter(Boolean)
      : [];
    this._processesEntity = config.entities.processes || "";
    this._processesAttribute = config.processes_attribute || "processes";

    this._showCpu = config.show_cpu !== false;
    this._showMemory = config.show_memory !== false;
    this._showNetwork = config.show_network !== false && (this._hasNetworkIn || this._hasNetworkOut);
    this._showCores = config.show_cores !== false && this._cpuCores.length > 0;
    this._showTemperature = config.show_temperature !== false;
    this._showProcesses = config.show_processes !== false && !!this._processesEntity;

    this._entityToKey = {};
    Object.entries(config.entities).forEach(([key, id]) => {
      if (id && key !== "temperature" && key !== "cpu_cores" && key !== "processes") {
        this._entityToKey[id] = key;
      }
    });
    this._cpuCores.forEach((id, i) => {
      this._entityToKey[id] = `core_${i}`;
    });

    this._historyRequested = false;
    this._buffers = { cpu: [], memory: [], swap: [], network_in: [], network_out: [] };
    this._cpuCores.forEach((_, i) => {
      this._buffers[`core_${i}`] = [];
    });
    this._buildDom();
  }

  getCardSize() {
    let size = 2;
    if (this._showCpu) size += 2;
    if (this._showCores) size += 3;
    if (this._showMemory) size += 2;
    if (this._showNetwork) size += 3;
    return size;
  }

  connectedCallback() {
    if (!this._resizeObserver && this.shadowRoot.host) {
      this._resizeObserver = new ResizeObserver(() => this._resizeCanvases());
      this._resizeObserver.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  set hass(hass) {
    const prevLang = this._lang;
    this._lang = langFor(hass);
    this._hass = hass;
    if (!this._config) return;

    if (this._domBuilt && this._lang !== prevLang) {
      this._buildDom();
    }

    if (!this._historyRequested) {
      this._historyRequested = true;
      this._fetchHistory();
    }

    const ents = this._config.entities;
    const now = Date.now();

    const pushValue = (bufferKey, entityId) => {
      if (!entityId) return;
      const state = hass.states[entityId];
      if (!state) return;
      const value = parseFloat(state.state);
      if (Number.isNaN(value)) return;
      const buf = this._buffers[bufferKey];
      buf.push({ t: now, v: value });
      if (buf.length > MAX_BUFFER_POINTS) buf.shift();
    };

    pushValue("cpu", ents.cpu);
    pushValue("memory", ents.memory);
    pushValue("swap", ents.swap);
    pushValue("network_in", ents.network_in);
    pushValue("network_out", ents.network_out);
    this._cpuCores.forEach((entityId, i) => pushValue(`core_${i}`, entityId));
    this._trimBuffers();

    this._updateTempBadge();

    if (this._showProcesses && this._procDialogOpen) {
      this._renderProcessTable();
    }

    if (now - this._lastRender > 500) {
      this._lastRender = now;
      this._renderAll();
    }
  }

  _trimBuffers() {
    const cutoff = Date.now() - this._config.minutes_to_show * 60000;
    Object.values(this._buffers).forEach((buf) => {
      while (buf.length && buf[0].t < cutoff) buf.shift();
    });
  }

  async _fetchHistory() {
    const ids = Object.keys(this._entityToKey);
    if (!ids.length || !this._hass) return;
    const windowMs = this._config.minutes_to_show * 60000;
    const startIso = new Date(Date.now() - windowMs).toISOString();
    try {
      const url = `history/period/${encodeURIComponent(startIso)}?filter_entity_id=${ids.join(
        ","
      )}&minimal_response&no_attributes`;
      const result = await this._hass.callApi("GET", url);
      if (Array.isArray(result)) {
        result.forEach((entityStates) => {
          if (!entityStates || !entityStates.length) return;
          const first = entityStates[0];
          const entityId = first.entity_id;
          const key = entityId ? this._entityToKey[entityId] : null;
          if (!key) return;
          const buf = this._buffers[key];
          entityStates.forEach((s) => {
            const raw = s.state !== undefined ? s.state : s.s;
            const ts = s.last_changed || s.lc || s.last_updated || s.lu;
            const v = parseFloat(raw);
            const t = ts ? new Date(ts).getTime() : NaN;
            if (!Number.isNaN(v) && !Number.isNaN(t)) buf.push({ t, v });
          });
          buf.sort((a, b) => a.t - b.t);
        });
      }
    } catch (e) {
      // History-Abruf ist optional; bei Fehlschlag laufen die Live-Graphen trotzdem weiter.
      console.warn("resource-monitor-card: History-Abruf fehlgeschlagen", e);
    }
    this._trimBuffers();
    this._renderAll();
  }

  _unitFor(entityId, fallback) {
    if (!entityId || !this._hass) return fallback;
    const state = this._hass.states[entityId];
    return (state && state.attributes && state.attributes.unit_of_measurement) || fallback;
  }

  _buildDom() {
    const style = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .title {
          font-size: 1.1em;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .temp-badge {
          display: none;
          font-size: 0.85em;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 12px;
          color: #fff;
          background: var(--disabled-color, #9e9e9e);
        }
        .stack { display: flex; flex-direction: column; gap: 14px; }
        .metric {
          background: var(--card-background-color, #fff);
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 4px;
        }
        .metric-label { font-size: 0.85em; color: var(--secondary-text-color); }
        .metric-value {
          font-size: 0.9em;
          font-weight: 600;
          color: var(--primary-text-color);
          font-variant-numeric: tabular-nums;
        }
        canvas { width: 100%; height: 110px; display: block; }
        .legend {
          display: flex;
          gap: 12px;
          font-size: 0.7em;
          color: var(--secondary-text-color);
          margin-top: 2px;
        }
        .legend span::before {
          content: "";
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }
        .legend .ram::before { background: ${COLOR_GOOD}; }
        .legend .swap::before { background: ${COLOR_SWAP}; }
        .legend .in::before { background: ${COLOR_NET_IN}; }
        .legend .out::before { background: ${COLOR_NET_OUT}; }
        .core-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 4px 12px;
          margin-top: 6px;
        }
        .core-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68em;
          color: var(--secondary-text-color);
          font-variant-numeric: tabular-nums;
        }
        .core-legend-item .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex: none;
        }
        .processes-btn {
          border: 1px solid var(--divider-color, #ccc);
          background: transparent;
          color: var(--primary-text-color, #000);
          border-radius: 12px;
          padding: 3px 10px;
          font-size: 0.8em;
          cursor: pointer;
        }
        .processes-btn:hover { background: var(--secondary-background-color, rgba(128,128,128,0.1)); }
        .header-right { display: flex; align-items: center; gap: 8px; }
        .proc-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1000;
          display: none;
          align-items: center;
          justify-content: center;
        }
        .proc-dialog {
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #000);
          border-radius: 8px;
          width: min(560px, 92vw);
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }
        .proc-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          font-weight: 600;
        }
        .proc-dialog-header button {
          border: none;
          background: transparent;
          color: var(--secondary-text-color, #666);
          font-size: 0.9em;
          cursor: pointer;
          padding: 4px 8px;
        }
        .proc-sort-row {
          display: flex;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        .proc-sort-btn {
          border: 1px solid var(--divider-color, #ccc);
          background: transparent;
          color: var(--primary-text-color, #000);
          border-radius: 12px;
          padding: 4px 10px;
          font-size: 0.8em;
          cursor: pointer;
        }
        .proc-sort-btn.active {
          background: var(--primary-color, #03a9f4);
          color: #fff;
          border-color: transparent;
        }
        .proc-table-wrap { overflow-y: auto; padding: 0 16px 16px; }
        .proc-table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
        .proc-table th {
          position: sticky;
          top: 0;
          background: var(--card-background-color, #fff);
          text-align: left;
          padding: 6px 8px;
          color: var(--secondary-text-color, #666);
          font-weight: 600;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        .proc-table td {
          padding: 5px 8px;
          border-bottom: 1px solid var(--divider-color, #eee);
          font-variant-numeric: tabular-nums;
        }
        .proc-table th:not(:first-child), .proc-table td:not(:first-child) { text-align: right; }
        .proc-empty { text-align: center; color: var(--secondary-text-color, #666); padding: 16px; }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${style}
      <ha-card>
        <div class="header">
          <span class="title">${this._config.title}</span>
          <div class="header-right">
            <button class="processes-btn" id="processes-btn" style="${this._showProcesses ? "" : "display:none;"}">${this._t("processes")}</button>
            <span class="temp-badge" id="temp-badge"></span>
          </div>
        </div>
        <div class="stack">
          <div class="metric" id="metric-cpu" style="${this._showCpu ? "" : "display:none;"}">
            <div class="metric-header">
              <span class="metric-label">${this._t("cpu")}</span>
              <span class="metric-value" id="val-cpu"></span>
            </div>
            <canvas id="canvas-cpu"></canvas>
          </div>

          <div class="metric" id="metric-cores" style="${this._showCores ? "" : "display:none;"}">
            <div class="metric-header">
              <span class="metric-label">${this._t("cpu_cores")}</span>
              <span class="metric-value" id="val-cores"></span>
            </div>
            <canvas id="canvas-cores"></canvas>
            <div class="core-legend" id="cores-legend"></div>
          </div>

          <div class="metric" id="metric-memory" style="${this._showMemory ? "" : "display:none;"}">
            <div class="metric-header">
              <span class="metric-label">${this._t("ram_swap")}</span>
              <span class="metric-value" id="val-memory"></span>
            </div>
            <canvas id="canvas-memory"></canvas>
            <div class="legend">
              <span class="ram">${this._t("ram")}</span>
              <span class="swap">${this._t("swap")}</span>
            </div>
          </div>

          <div class="metric" id="metric-network" style="${this._showNetwork ? "" : "display:none;"}">
            <div class="metric-header">
              <span class="metric-label">${this._t("network")}</span>
              <span class="metric-value" id="val-network"></span>
            </div>
            <canvas id="canvas-network"></canvas>
            <div class="legend">
              <span class="in" style="${this._hasNetworkIn ? "" : "display:none;"}">${this._t("network_in")}</span>
              <span class="out" style="${this._hasNetworkOut ? "" : "display:none;"}">${this._t("network_out")}</span>
            </div>
          </div>
        </div>
      </ha-card>

      <div class="proc-dialog-overlay" id="proc-overlay">
        <div class="proc-dialog">
          <div class="proc-dialog-header">
            <span>${this._t("processes")}</span>
            <button id="proc-close">${this._t("close")}</button>
          </div>
          <div class="proc-sort-row">
            <button class="proc-sort-btn" id="proc-sort-cpu">${this._t("sort_by_cpu")}</button>
            <button class="proc-sort-btn" id="proc-sort-ram">${this._t("sort_by_ram")}</button>
          </div>
          <div class="proc-table-wrap">
            <table class="proc-table">
              <thead>
                <tr>
                  <th>${this._t("process_name")}</th>
                  <th>${this._t("process_pid")}</th>
                  <th>${this._t("process_cpu")}</th>
                  <th>${this._t("process_ram")}</th>
                </tr>
              </thead>
              <tbody id="proc-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Erste Größenanpassung nach dem Layout-Tick
    requestAnimationFrame(() => this._resizeCanvases());

    this._buildCoreLegend();
    this._wireProcessDialog();
    this._domBuilt = true;
  }

  _wireProcessDialog() {
    const openBtn = this.shadowRoot.getElementById("processes-btn");
    const closeBtn = this.shadowRoot.getElementById("proc-close");
    const overlay = this.shadowRoot.getElementById("proc-overlay");
    const sortCpuBtn = this.shadowRoot.getElementById("proc-sort-cpu");
    const sortRamBtn = this.shadowRoot.getElementById("proc-sort-ram");

    if (openBtn) openBtn.addEventListener("click", () => this._openProcessDialog());
    if (closeBtn) closeBtn.addEventListener("click", () => this._closeProcessDialog());
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this._closeProcessDialog();
      });
    }
    if (sortCpuBtn) sortCpuBtn.addEventListener("click", () => this._setProcessSort("cpu"));
    if (sortRamBtn) sortRamBtn.addEventListener("click", () => this._setProcessSort("ram"));
    this._updateProcessSortButtons();
  }

  _openProcessDialog() {
    const overlay = this.shadowRoot.getElementById("proc-overlay");
    if (!overlay) return;
    this._procDialogOpen = true;
    overlay.style.display = "flex";
    this._renderProcessTable();
  }

  _closeProcessDialog() {
    const overlay = this.shadowRoot.getElementById("proc-overlay");
    if (!overlay) return;
    this._procDialogOpen = false;
    overlay.style.display = "none";
  }

  _setProcessSort(mode) {
    this._procSort = mode;
    this._updateProcessSortButtons();
    this._renderProcessTable();
  }

  _updateProcessSortButtons() {
    const sortCpuBtn = this.shadowRoot.getElementById("proc-sort-cpu");
    const sortRamBtn = this.shadowRoot.getElementById("proc-sort-ram");
    if (sortCpuBtn) sortCpuBtn.classList.toggle("active", this._procSort === "cpu");
    if (sortRamBtn) sortRamBtn.classList.toggle("active", this._procSort === "ram");
  }

  _renderProcessTable() {
    const tbody = this.shadowRoot.getElementById("proc-tbody");
    if (!tbody || !this._hass) return;
    const state = this._hass.states[this._processesEntity];
    const list = (state && state.attributes && state.attributes[this._processesAttribute]) || [];
    const sorted = Array.isArray(list)
      ? [...list].sort((a, b) => (Number(b[this._procSort]) || 0) - (Number(a[this._procSort]) || 0))
      : [];

    if (!sorted.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="proc-empty">${this._t("no_data")}</td></tr>`;
      return;
    }

    tbody.innerHTML = sorted
      .map((p) => {
        const cpu = p.cpu !== undefined && p.cpu !== null ? `${Number(p.cpu).toFixed(1)}%` : "–";
        const mem = p.mem !== undefined && p.mem !== null ? `${Number(p.mem).toFixed(1)}%` : "–";
        return `
          <tr>
            <td>${this._escape(p.name ?? "–")}</td>
            <td>${p.pid ?? "–"}</td>
            <td>${cpu}</td>
            <td>${mem}</td>
          </tr>
        `;
      })
      .join("");
  }

  _escape(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  _buildCoreLegend() {
    const legend = this.shadowRoot.getElementById("cores-legend");
    if (!legend) return;
    legend.innerHTML = this._cpuCores
      .map(
        (_, i) => `
          <span class="core-legend-item">
            <span class="dot" style="background:${CORE_COLORS[i % CORE_COLORS.length]}"></span>
            <span class="core-legend-text" data-core-index="${i}">${this._t("core")} ${i}: –</span>
          </span>
        `
      )
      .join("");
  }

  _resizeCanvases() {
    ["cpu", "cores", "memory", "network"].forEach((id) => {
      const canvas = this.shadowRoot.getElementById(`canvas-${id}`);
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    });
    this._renderAll();
  }

  _updateTempBadge() {
    const badge = this.shadowRoot.getElementById("temp-badge");
    if (!badge) return;
    const entityId = this._config.entities.temperature;
    if (!this._showTemperature || !entityId || !this._hass || !this._hass.states[entityId]) {
      badge.style.display = "none";
      return;
    }
    const state = this._hass.states[entityId];
    const value = parseFloat(state.state);
    if (Number.isNaN(value)) {
      badge.style.display = "none";
      return;
    }
    const unit = this._unitFor(entityId, "°C");
    badge.style.display = "inline-block";
    badge.style.background = statusColor(value, this._config.temperature_thresholds);
    badge.textContent = `${value.toFixed(1)} ${unit}`;
  }

  _renderAll() {
    if (!this._config) return;
    if (this._showCpu) this._renderCpu();
    if (this._showCores) this._renderCores();
    if (this._showMemory) this._renderMemory();
    if (this._showNetwork) this._renderNetwork();
  }

  _renderCores() {
    if (!this._cpuCores || !this._cpuCores.length) return;
    const canvas = this.shadowRoot.getElementById("canvas-cores");
    if (!canvas) return;

    const values = this._cpuCores.map((_, i) => this._latest(`core_${i}`));
    const known = values.filter((v) => v !== null);
    const valEl = this.shadowRoot.getElementById("val-cores");
    if (valEl) {
      valEl.textContent = known.length
        ? `Ø ${(known.reduce((a, b) => a + b, 0) / known.length).toFixed(0)}%`
        : "–";
    }

    this._cpuCores.forEach((_, i) => {
      const el = this.shadowRoot.querySelector(`[data-core-index="${i}"]`);
      if (!el) return;
      const v = values[i];
      el.textContent = `${this._t("core")} ${i}: ${v !== null ? v.toFixed(0) + "%" : "–"}`;
    });

    const series = this._cpuCores.map((_, i) => ({
      buffer: this._buffers[`core_${i}`] || [],
      color: CORE_COLORS[i % CORE_COLORS.length],
    }));

    this._drawChart(canvas, {
      yMin: 0,
      yMax: 100,
      yTicks: [25, 50, 75],
      yFormat: (v) => `${v}%`,
      series,
    });
  }

  _latest(bufferKey) {
    const buf = this._buffers[bufferKey];
    return buf.length ? buf[buf.length - 1].v : null;
  }

  _renderCpu() {
    const canvas = this.shadowRoot.getElementById("canvas-cpu");
    if (!canvas) return;
    const value = this._latest("cpu");
    const color = statusColor(value ?? 0, this._config.thresholds);
    const valueEl = this.shadowRoot.getElementById("val-cpu");
    valueEl.textContent = value !== null ? `${value.toFixed(1)}%` : "–";
    valueEl.style.color = color;

    this._drawChart(canvas, {
      yMin: 0,
      yMax: 100,
      yTicks: [25, 50, 75],
      yFormat: (v) => `${v}%`,
      series: [{ buffer: this._buffers.cpu, color }],
    });
  }

  _renderMemory() {
    const canvas = this.shadowRoot.getElementById("canvas-memory");
    if (!canvas) return;
    const ram = this._latest("memory");
    const swap = this._latest("swap");
    const ramColor = statusColor(ram ?? 0, this._config.thresholds);
    const valueEl = this.shadowRoot.getElementById("val-memory");
    const ramTxt = ram !== null ? `${ram.toFixed(1)}%` : "–";
    const swapTxt = swap !== null ? `${swap.toFixed(1)}%` : "–";
    valueEl.textContent = `${this._t("ram")} ${ramTxt} · ${this._t("swap")} ${swapTxt}`;
    valueEl.style.color = ramColor;

    this._drawChart(canvas, {
      yMin: 0,
      yMax: 100,
      yTicks: [25, 50, 75],
      yFormat: (v) => `${v}%`,
      series: [
        { buffer: this._buffers.memory, color: ramColor },
        { buffer: this._buffers.swap, color: COLOR_SWAP },
      ],
    });
  }

  _renderNetwork() {
    if (!this._hasNetworkIn && !this._hasNetworkOut) return; // Block ist ausgeblendet
    const canvas = this.shadowRoot.getElementById("canvas-network");
    if (!canvas) return;

    const unit = this._unitFor(
      this._config.entities.network_in || this._config.entities.network_out,
      "KB/s"
    );
    const valueEl = this.shadowRoot.getElementById("val-network");
    const parts = [];
    let inV = 0;
    let outV = 0;
    if (this._hasNetworkIn) {
      inV = this._latest("network_in") ?? 0;
      parts.push(`↓ ${inV.toFixed(0)} ${unit}`);
    }
    if (this._hasNetworkOut) {
      outV = this._latest("network_out") ?? 0;
      parts.push(`↑ ${outV.toFixed(0)} ${unit}`);
    }
    valueEl.textContent = parts.join("  ");

    const allVals = [...this._buffers.network_in, ...this._buffers.network_out].map((p) => p.v);
    const yMax = niceMax(Math.max(1, ...allVals, inV, outV));

    const series = [];
    if (this._hasNetworkIn) series.push({ buffer: this._buffers.network_in, color: COLOR_NET_IN });
    if (this._hasNetworkOut) series.push({ buffer: this._buffers.network_out, color: COLOR_NET_OUT });

    this._drawChart(canvas, {
      yMin: 0,
      yMax,
      yTicks: [yMax * 0.25, yMax * 0.5, yMax * 0.75],
      yFormat: (v) => `${Math.round(v)}`,
      series,
    });
  }

  /**
   * Zeichnet ein Liniendiagramm mit Achsen und Gitternetzlinien.
   * options: { yMin, yMax, yTicks: number[], yFormat: fn, series: [{buffer, color}] }
   */
  _drawChart(canvas, options) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    if (width < 10 || height < 10) return;

    const { yMin, yMax, yTicks, yFormat, series } = options;
    const windowMs = this._config.minutes_to_show * 60000;
    const now = Date.now();

    const padLeft = 34 * dpr;
    const padBottom = 16 * dpr;
    const padTop = 6 * dpr;
    const padRight = 6 * dpr;
    const px0 = padLeft;
    const py0 = padTop;
    const pw = Math.max(1, width - padLeft - padRight);
    const ph = Math.max(1, height - padTop - padBottom);

    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.strokeStyle = COLOR_GRID;
    ctx.fillStyle = getComputedStyle(this).getPropertyValue("--secondary-text-color") || "#888";
    ctx.lineWidth = 1;

    // Horizontale Gitternetzlinien + Y-Achsenbeschriftung
    yTicks.forEach((tick) => {
      const frac = (tick - yMin) / (yMax - yMin || 1);
      const y = py0 + ph * (1 - frac);
      ctx.beginPath();
      ctx.moveTo(px0, y);
      ctx.lineTo(px0 + pw, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(yFormat(tick), px0 - 4 * dpr, y);
    });

    // Vertikale Gitternetzlinien + X-Achsenbeschriftung (Zeit)
    const xFracs = [0, 0.5, 1];
    xFracs.forEach((frac) => {
      const x = px0 + pw * frac;
      ctx.beginPath();
      ctx.moveTo(x, py0);
      ctx.lineTo(x, py0 + ph);
      ctx.stroke();
      ctx.textBaseline = "top";
      ctx.textAlign = frac === 0 ? "left" : frac === 1 ? "right" : "center";
      const label = formatTimeOffset(windowMs * (1 - frac), this._lang);
      ctx.fillText(label, x, py0 + ph + 3 * dpr);
    });

    // Achsenrahmen
    ctx.strokeStyle = COLOR_GRID;
    ctx.strokeRect(px0, py0, pw, ph);

    // Datenlinien
    const windowStart = now - windowMs;
    series.forEach(({ buffer, color }) => {
      if (buffer.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * dpr;
      let started = false;
      buffer.forEach((p) => {
        const xFrac = clamp((p.t - windowStart) / windowMs, 0, 1);
        const x = px0 + pw * xFrac;
        const yFrac = clamp((p.v - yMin) / (yMax - yMin || 1), 0, 1);
        const y = py0 + ph * (1 - yFrac);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });
  }
}

customElements.define("resource-monitor-card", ResourceMonitorCard);

/**
 * Visueller Editor für die Resource Monitor Card.
 * Wird von Home Assistant automatisch angezeigt, wenn die Karte über die
 * Lovelace-UI bearbeitet wird (kein YAML-Modus nötig).
 */
const ENTITY_FIELDS = [
  { key: "cpu", labelKey: "field_cpu", required: true },
  { key: "memory", labelKey: "field_memory", required: true },
  { key: "swap", labelKey: "field_swap", required: true },
  { key: "network_in", labelKey: "field_network_in", required: false },
  { key: "network_out", labelKey: "field_network_out", required: false },
  { key: "temperature", labelKey: "field_temperature", required: false },
  { key: "processes", labelKey: "field_processes", required: false },
];

const VISIBILITY_FIELDS = [
  { key: "show_cpu", labelKey: "vis_cpu" },
  { key: "show_cores", labelKey: "vis_cores" },
  { key: "show_memory", labelKey: "vis_memory" },
  { key: "show_network", labelKey: "vis_network" },
  { key: "show_temperature", labelKey: "vis_temperature" },
  { key: "show_processes", labelKey: "vis_processes" },
];

class ResourceMonitorCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._lang = "en";
  }

  _t(key) {
    return t(this._lang, key);
  }

  setConfig(config) {
    this._config = {
      ...config,
      title: config.title ?? "System Monitor",
      minutes_to_show: config.minutes_to_show ?? DEFAULT_MINUTES,
      thresholds: { ...DEFAULT_THRESHOLDS, ...(config.thresholds || {}) },
      temperature_thresholds: {
        ...DEFAULT_TEMP_THRESHOLDS,
        ...(config.temperature_thresholds || {}),
      },
      entities: { ...(config.entities || {}) },
    };
    this._config.entities.cpu_cores = Array.isArray(config.entities && config.entities.cpu_cores)
      ? [...config.entities.cpu_cores]
      : [];
    this._render();
  }

  set hass(hass) {
    const prevLang = this._lang;
    this._lang = langFor(hass);
    this._hass = hass;
    if (this._rendered && this._lang !== prevLang) {
      this._render();
      return;
    }
    // Bereits vorhandene Entity-Picker mit hass versorgen, ohne alles neu zu bauen
    if (!this.shadowRoot) return;
    ENTITY_FIELDS.forEach(({ key }) => {
      const picker = this.shadowRoot.querySelector(`[data-entity-field="${key}"] ha-entity-picker`);
      if (picker) picker.hass = hass;
    });
    this.shadowRoot.querySelectorAll("#core-rows ha-entity-picker").forEach((picker) => {
      picker.hass = hass;
    });
  }

  connectedCallback() {
    if (this._config && !this._rendered) this._render();
  }

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _update(key, value) {
    this._config = { ...this._config, [key]: value };
    this._fireChanged();
  }

  _updateNested(section, key, value) {
    this._config = {
      ...this._config,
      [section]: { ...this._config[section], [key]: value },
    };
    this._fireChanged();
  }

  _updateEntity(key, value) {
    const entities = { ...this._config.entities };
    if (value) entities[key] = value;
    else delete entities[key];
    this._config = { ...this._config, entities };
    this._fireChanged();
  }

  _render() {
    const cfg = this._config;
    const th = cfg.thresholds;
    const tth = cfg.temperature_thresholds;

    this.shadowRoot.innerHTML = `
      <style>
        .form { display: flex; flex-direction: column; gap: 14px; padding: 8px 2px 2px; }
        .row { display: flex; flex-direction: column; gap: 4px; }
        .row-inline { display: flex; gap: 12px; }
        .row-inline > .row { flex: 1; }
        label {
          font-size: 0.85em;
          color: var(--secondary-text-color, #666);
        }
        input[type="text"], input[type="number"] {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--divider-color, #ccc);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #000);
          font-size: 0.95em;
          box-sizing: border-box;
        }
        .section-title {
          font-weight: 600;
          margin-top: 4px;
          color: var(--primary-text-color, #000);
        }
        .hint {
          font-size: 0.75em;
          color: var(--secondary-text-color, #666);
          margin-top: -6px;
        }
        .core-row { display: flex; gap: 8px; align-items: center; }
        .core-row ha-entity-picker, .core-row input { flex: 1; min-width: 0; }
        .core-row button {
          flex: none;
          border: none;
          background: transparent;
          color: var(--secondary-text-color, #666);
          font-size: 1.1em;
          cursor: pointer;
          padding: 4px 8px;
        }
        #core-rows { display: flex; flex-direction: column; gap: 8px; }
        .add-core-btn {
          align-self: flex-start;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid var(--divider-color, #ccc);
          background: transparent;
          color: var(--primary-color, #03a9f4);
          cursor: pointer;
          font-size: 0.85em;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkbox-row label {
          font-size: 0.9em;
          color: var(--primary-text-color, #000);
        }
      </style>
      <div class="form">
        <div class="row">
          <label>${this._t("editor_title")}</label>
          <input type="text" id="title" value="${cfg.title}">
        </div>
        <div class="row">
          <label>${this._t("editor_minutes")}</label>
          <input type="number" id="minutes_to_show" min="1" value="${cfg.minutes_to_show}">
        </div>

        <div class="section-title">${this._t("editor_visibility")}</div>
        <div class="hint">${this._t("editor_visibility_hint")}</div>
        ${VISIBILITY_FIELDS.map(
          (f) => `
            <div class="checkbox-row">
              <input type="checkbox" id="${f.key}" ${cfg[f.key] !== false ? "checked" : ""}>
              <label for="${f.key}">${this._t(f.labelKey)}</label>
            </div>
          `
        ).join("")}

        <div class="section-title">${this._t("editor_entities")}</div>
        ${ENTITY_FIELDS.map(
          (f) => `<div class="row" data-entity-field="${f.key}"><label>${this._t(f.labelKey)}</label></div>`
        ).join("")}
        <div class="hint">${this._t("editor_entities_hint")}</div>

        <div class="section-title">${this._t("editor_cores")}</div>
        <div class="hint">${this._t("editor_cores_hint")}</div>
        <div id="core-rows"></div>
        <button type="button" class="add-core-btn" id="add-core-btn">${this._t("editor_add_core")}</button>

        <div class="section-title">${this._t("editor_thresholds_cpu_ram")}</div>
        <div class="row-inline">
          <div class="row"><label>${this._t("editor_warning")}</label><input type="number" id="th-warning" value="${th.warning}"></div>
          <div class="row"><label>${this._t("editor_critical")}</label><input type="number" id="th-critical" value="${th.critical}"></div>
        </div>

        <div class="section-title">${this._t("editor_thresholds_temp")}</div>
        <div class="row-inline">
          <div class="row"><label>${this._t("editor_warning")}</label><input type="number" id="tth-warning" value="${tth.warning}"></div>
          <div class="row"><label>${this._t("editor_critical")}</label><input type="number" id="tth-critical" value="${tth.critical}"></div>
        </div>
      </div>
    `;

    ENTITY_FIELDS.forEach((f) => this._buildEntityPicker(f));
    VISIBILITY_FIELDS.forEach((f) => {
      this.shadowRoot
        .getElementById(f.key)
        .addEventListener("change", (e) => this._update(f.key, e.target.checked));
    });
    this._buildCoreRows();
    this.shadowRoot
      .getElementById("add-core-btn")
      .addEventListener("click", () => {
        this._config = {
          ...this._config,
          entities: {
            ...this._config.entities,
            cpu_cores: [...this._config.entities.cpu_cores, ""],
          },
        };
        this._buildCoreRows();
        this._fireChanged();
      });

    this.shadowRoot
      .getElementById("title")
      .addEventListener("change", (e) => this._update("title", e.target.value));
    this.shadowRoot
      .getElementById("minutes_to_show")
      .addEventListener("change", (e) => this._update("minutes_to_show", Number(e.target.value) || DEFAULT_MINUTES));
    this.shadowRoot
      .getElementById("th-warning")
      .addEventListener("change", (e) => this._updateNested("thresholds", "warning", Number(e.target.value)));
    this.shadowRoot
      .getElementById("th-critical")
      .addEventListener("change", (e) => this._updateNested("thresholds", "critical", Number(e.target.value)));
    this.shadowRoot
      .getElementById("tth-warning")
      .addEventListener("change", (e) => this._updateNested("temperature_thresholds", "warning", Number(e.target.value)));
    this.shadowRoot
      .getElementById("tth-critical")
      .addEventListener("change", (e) => this._updateNested("temperature_thresholds", "critical", Number(e.target.value)));

    this._rendered = true;
  }

  _buildCoreRows() {
    const container = this.shadowRoot.getElementById("core-rows");
    if (!container) return;
    container.innerHTML = "";
    const cores = this._config.entities.cpu_cores || [];
    const PickerCtor = customElements.get("ha-entity-picker");

    cores.forEach((entityId, index) => {
      const row = document.createElement("div");
      row.className = "core-row";

      let input;
      if (PickerCtor) {
        input = document.createElement("ha-entity-picker");
        input.hass = this._hass;
        input.value = entityId || "";
        input.allowCustomEntity = true;
        input.includeDomains = ["sensor"];
        input.label = `${this._t("core")} ${index}`;
        input.addEventListener("value-changed", (e) => {
          e.stopPropagation();
          this._updateCore(index, e.detail.value);
        });
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = `sensor.cpu_core_${index}`;
        input.value = entityId || "";
        input.addEventListener("change", (e) => this._updateCore(index, e.target.value.trim()));
      }

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.title = this._t("editor_remove_core");
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => this._removeCore(index));

      row.appendChild(input);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
  }

  _updateCore(index, value) {
    const cores = [...this._config.entities.cpu_cores];
    cores[index] = value;
    this._config = { ...this._config, entities: { ...this._config.entities, cpu_cores: cores } };
    this._fireChanged();
  }

  _removeCore(index) {
    const cores = [...this._config.entities.cpu_cores];
    cores.splice(index, 1);
    this._config = { ...this._config, entities: { ...this._config.entities, cpu_cores: cores } };
    this._buildCoreRows();
    this._fireChanged();
  }

  _buildEntityPicker(field) {
    const container = this.shadowRoot.querySelector(`[data-entity-field="${field.key}"]`);
    if (!container) return;
    const currentValue = this._config.entities[field.key] || "";
    const PickerCtor = customElements.get("ha-entity-picker");

    let input;
    if (PickerCtor) {
      input = document.createElement("ha-entity-picker");
      input.hass = this._hass;
      input.value = currentValue;
      input.allowCustomEntity = true;
      input.includeDomains = ["sensor"];
      input.addEventListener("value-changed", (e) => {
        e.stopPropagation();
        this._updateEntity(field.key, e.detail.value);
      });
    } else {
      // Fallback ohne HA-Frontend-Komponenten: einfaches Textfeld für die Entity-ID
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = "sensor.xxx";
      input.value = currentValue;
      input.addEventListener("change", (e) => this._updateEntity(field.key, e.target.value.trim()));
    }
    container.appendChild(input);
  }
}

customElements.define("resource-monitor-card-editor", ResourceMonitorCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "resource-monitor-card",
  name: "Resource Monitor Card",
  description:
    "Live CPU-, RAM/Swap- und Netzwerk-Graphen mit Achsen und Gitternetz, plus Temperatur-Badge – im Stil eines Ressourcenmonitors.",
});
