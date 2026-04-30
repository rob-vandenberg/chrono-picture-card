import { LitElement, html, css } from 'https://unpkg.com/lit@2.0.0/index.js?module';
import { live }                  from 'https://unpkg.com/lit@2.0.0/directives/live.js?module';
import { styleMap }              from 'https://unpkg.com/lit@2.0.0/directives/style-map.js?module';
import { unsafeHTML }            from 'https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module';
import jsyaml                   from 'https://cdn.jsdelivr.net/npm/js-yaml@4/+esm';

// ─── Version ──────────────────────────────────────────────────────────────────
const CARD_VERSION = '0.0.8';

// ─── MDI icon paths ───────────────────────────────────────────────────────────
const mdiDragHorizontalVariant = 'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';

// ─── Version History ──────────────────────────────────────────────────────────
// v0.0.8: Fix missing cpButtonPicker function definition
// v0.0.7: Fix Terser parse errors — replace literal newlines in single-quoted
//         strings with \\n escape sequences
// v0.0.6: Add image_source_type button picker (Camera/Image URL/Image entity);
//         restore bar_background_color config + editor; new defaults (camera_view:
//         live, fit_mode: fill, aspect_ratio: ''); hide object_position when
//         fit_mode is fill; remove textarea placeholders
// v0.0.5: Add js-yaml import; YAML textarea per item and card-level; remove
//         Actions panel; rename zone headers to Left/Center/Right Items;
//         _addItem no longer writes empty DEFAULT_ITEM properties
// v0.0.4: Flatten config — remove bar: wrapper and items: sublayer; zones are
//         now top-level keys left_items, center_items, right_items
// v0.0.3: Add border_radius per item; expand item-typography grid to 5 columns
// v0.0.2: Fix aspect ratio for camera feeds — pass aspect_ratio directly to
//         hui-image; remove conflicting has-ratio container logic for camera path;
//         set ha-card height to auto to prevent vertical stretching
// v0.0.1: Initial release — image/camera feed with live template bar,
//         three fixed zones (left/center/right), entity items with default
//         domain actions, template items with server-side Jinja2 via
//         subscribeMessage, full UI editor with typography per item,
//         native fit_mode / object_position / aspect_ratio config

// ─── Console log ──────────────────────────────────────────────────────────────
console.info(
  `%c CHRONO-%cPICTURE%c-CARD %c v${CARD_VERSION} `,
  'background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 0 2px 4px; border-radius: 3px 0 0 3px;',
  'background-color: #101010; color: #4676d3; font-weight: bold; padding: 2px 0;',
  'background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 4px 2px 0;',
  'background-color: #1E1E1E; color: #FFFFFF; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0;'
);

// ─── Constants ────────────────────────────────────────────────────────────────
const DOMAINS_TOGGLE = new Set([
  'automation', 'cover', 'fan', 'group', 'humidifier', 'input_boolean',
  'light', 'media_player', 'remote', 'script', 'switch', 'timer', 'vacuum',
]);

const ZONE_KEYS = ['left', 'center', 'right'];

// ─── Default config ───────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  image_source_type: 'camera',
  entity:            '',
  camera_image:      '',
  camera_view:       'live',
  image:             '',
  image_entity:      '',
  aspect_ratio:      '',
  fit_mode:          'fill',
  object_position:   'center',
  bar_background_color: '',
  left_items:        [],
  center_items:      [],
  right_items:       [],
};

// ─── Numeric item keys ────────────────────────────────────────────────────────
const NUMERIC_ITEM_KEYS = new Set([
  'font_size', 'font_weight', 'line_height', 'border_radius',
  'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
]);

// ─── UI-controlled keys ───────────────────────────────────────────────────────
// Keys managed by dedicated UI fields. All other keys go into the YAML textarea.
const UI_ITEM_KEYS = new Set([
  'entity', 'template',
  'icon', 'show_state',
  'font_color', 'font_size', 'font_weight', 'line_height', 'border_radius',
  'background_color',
  'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
]);

const UI_CARD_KEYS = new Set([
  'type', 'image_source_type', 'entity', 'camera_image', 'camera_view',
  'image', 'image_entity', 'aspect_ratio', 'fit_mode', 'object_position',
  'bar_background_color',
  'left_items', 'center_items', 'right_items',
]);

// ─── YAML helpers ─────────────────────────────────────────────────────────────
function serializeExtrasToYaml(obj, uiKeys) {
  const extras = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!uiKeys.has(k)) extras[k] = v;
  }
  if (!Object.keys(extras).length) return '';
  try {
    return jsyaml.dump(extras, { indent: 2 }).trimEnd();
  } catch (e) {
    return '';
  }
}

function parseYamlExtras(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return {};
  try {
    const parsed = jsyaml.load(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return null;
  } catch (e) {
    return null;
  }
}

// ─── Domain helpers ───────────────────────────────────────────────────────────
function getDomain(entityId) {
  return entityId?.split('.')?.[0] ?? '';
}

function defaultTapAction(domain) {
  return DOMAINS_TOGGLE.has(domain) ? { action: 'toggle' } : { action: 'more-info' };
}

function isStateActive(stateObj) {
  if (!stateObj) return false;
  const s = stateObj.state;
  return ['on', 'open', 'opening', 'unlocked', 'active', 'home', 'playing'].includes(s);
}

function domainIcon(domain, stateObj) {
  const dc  = stateObj?.attributes?.device_class;
  const map = {
    light:         'mdi:lightbulb',
    switch:        'mdi:toggle-switch',
    binary_sensor: dc ? `mdi:${dc}` : 'mdi:radiobox-blank',
    sensor:        'mdi:eye',
    script:        'mdi:script-text',
    automation:    'mdi:robot',
    input_boolean: 'mdi:toggle-switch',
    cover:         'mdi:window-shutter',
    fan:           'mdi:fan',
    media_player:  'mdi:cast',
    camera:        'mdi:camera',
  };
  return stateObj?.attributes?.icon ?? map[domain] ?? 'mdi:circle';
}

// ─── Aspect ratio helper ──────────────────────────────────────────────────────
function parseAspectRatio(ratio) {
  if (!ratio) return null;
  const m = String(ratio).match(/^(\d+(?:\.\d+)?)\s*[x:\/]\s*(\d+(?:\.\d+)?)$/i);
  if (m) return (parseFloat(m[1]) / parseFloat(m[2]) * 100).toFixed(4) + '%';
  const n = parseFloat(ratio);
  if (!isNaN(n)) return (n * 100).toFixed(4) + '%';
  return null;
}

// ─── cpParseNumber ────────────────────────────────────────────────────────────
function cpParseNumber(raw) {
  const v = String(raw).replace(',', '.');
  if (v === '-' || v === '-0' || v.endsWith('.')) return null;
  if (v.includes('.') && v.endsWith('0'))         return null;
  if (v === '')                                    return '';
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// ─── Editor helper functions ──────────────────────────────────────────────────

function cpTextField(label, value, onChange, opts = {}) {
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <chrono-cp-textfield
        .value=${String(value ?? '')}
        type=${opts.type ?? 'text'}
        step=${opts.step ?? ''}
        min=${opts.min ?? ''}
        max=${opts.max ?? ''}
        @input=${onChange}
      ></chrono-cp-textfield>
    </div>
  `;
}

function cpToggleField(label, checked, onChange, extraClass = '') {
  return html`
    <div class="toggle-field ${extraClass}">
      <label>${unsafeHTML(label)}</label>
      <ha-switch .checked=${checked} @change=${onChange}></ha-switch>
    </div>
  `;
}

function cpColorPicker(label, value, onChange) {
  const swatchValue = value || '#000000';
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <div class="color-picker-row">
        <input type="color" .value=${swatchValue} @input=${onChange}
          @change=${(e) => { if (e.target.value !== '#000000') onChange(e); }}>
        <chrono-cp-textfield
          .value=${String(value ?? '')}
          @input=${onChange}
        ></chrono-cp-textfield>
      </div>
    </div>
  `;
}

function cpSelectField(label, value, options, onChange) {
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <chrono-cp-select
        .value=${value ?? ''}
        .options=${options}
        @change=${onChange}
      ></chrono-cp-select>
    </div>
  `;
}

// ─── cpButtonPicker ───────────────────────────────────────────────────────────────────────────
function cpButtonPicker(label, value, options, onChange, align = '', extraClass = '') {
  return html`
    <div class="button-picker-field ${extraClass}" style=${align === 'end' ? 'justify-self:end' : ''}>
      <label>${unsafeHTML(label)}</label>
      <chrono-cp-button-toggle-group
        .value=${value}
        .options=${options}
        @change=${onChange}
      ></chrono-cp-button-toggle-group>
    </div>
  `;
}

// ─── CpTextfield component ────────────────────────────────────────────────────
class CpTextfield extends LitElement {
  static properties = {
    value:       { type: String },
    type:        { type: String },
    step:        { type: String },
    min:         { type: String },
    max:         { type: String },
    placeholder: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      height: 56px;
      padding: 0 12px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      color: var(--primary-text-color);
      font-size: 16px;
      font-family: inherit;
      outline: none;
      transition: border-bottom-color 0.2s;
    }
    input:focus {
      border-bottom: 2px solid var(--primary-color);
    }
  `;

  render() {
    return html`
      <input
        .value=${live(this.value ?? '')}
        type=${this.type ?? 'text'}
        step=${this.step ?? ''}
        min=${this.min ?? ''}
        max=${this.max ?? ''}
        placeholder=${this.placeholder ?? ''}
        @input=${e => {
          this.value = e.target.value;
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }}
      >
    `;
  }
}
customElements.define('chrono-cp-textfield', CpTextfield);

// ─── CpTextarea component ─────────────────────────────────────────────────────
class CpTextarea extends LitElement {
  static properties = {
    value:       { type: String },
    placeholder: { type: String },
    error:       { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .editor {
      display: block;
      width: 100%;
      box-sizing: border-box;
      min-height: calc(3 * 1.5em + 24px);
      max-height: calc(20 * 1.5em + 24px);
      padding: 12px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      color: var(--primary-text-color);
      font-size: 13px;
      font-family: monospace;
      outline: none;
      overflow-y: auto;
      resize: vertical;
      white-space: pre-wrap;
      word-wrap: break-word;
      transition: border-bottom-color 0.2s;
    }
    .editor:focus {
      border-bottom: 2px solid var(--primary-color);
    }
    .editor.error {
      border-bottom: 2px solid var(--error-color, #f44336);
    }
    .editor:empty:before {
      content: attr(data-placeholder);
      color: var(--secondary-text-color);
      pointer-events: none;
    }
  `;

  updated(changedProps) {
    if (changedProps.has('value')) {
      const el = this.shadowRoot.querySelector('.editor');
      if (el && el !== document.activeElement && el.innerText !== this.value) {
        el.innerText = this.value ?? '';
      }
    }
  }

  render() {
    return html`
      <div
        class="editor${this.error ? ' error' : ''}"
        contenteditable="true"
        data-placeholder=${this.placeholder ?? ''}
        @input=${e => {
          this.value = e.target.innerText;
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }}
      ></div>
    `;
  }
}
customElements.define('chrono-cp-textarea', CpTextarea);

// ─── CpButtonToggleGroup component ───────────────────────────────────────────
class CpButtonToggleGroup extends LitElement {
  static properties = {
    value:   { type: String },
    options: { type: Array  },
  };

  static styles = css`
    :host {
      display: inline-flex;
    }
    button {
      min-width: 70px;
      height: 36px;
      padding: 0 12px;
      border: none;
      border-left: 1px solid var(--ha-color-border-neutral-quiet, #444);
      cursor: pointer;
      font-size: 14px;
      font-family: inherit;
      color: var(--primary-text-color);
      background: var(--ha-color-fill-primary-normal-resting, #002e3e);
      transition: background 0.15s;
    }
    button:first-child {
      border-left: none;
      border-radius: 9999px 0 0 9999px;
    }
    button:last-child {
      border-radius: 0 9999px 9999px 0;
    }
    button.only {
      border-radius: 9999px;
    }
    button.active {
      background: var(--ha-color-fill-primary-loud-resting, #009ac7);
    }
    button:not(.active):hover {
      background: var(--ha-color-fill-primary-quiet-hover, #004156);
    }
  `;

  render() {
    const opts = this.options ?? [];
    return html`${opts.map((opt, i) => {
      const isOnly   = opts.length === 1;
      const isFirst  = i === 0;
      const isLast   = i === opts.length - 1;
      const isActive = opt.value === this.value;
      const cls      = [
        isActive ? 'active' : '',
        isOnly ? 'only' : (isFirst ? 'first' : (isLast ? 'last' : '')),
      ].filter(Boolean).join(' ');
      return html`
        <button class="${cls}" @click=${() => this._select(opt.value)}>${opt.label}</button>
      `;
    })}`;
  }

  _select(value) {
    this.value = value;
    this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
  }
}
customElements.define('chrono-cp-button-toggle-group', CpButtonToggleGroup);

// ─── CpSelect component ───────────────────────────────────────────────────────
class CpSelect extends LitElement {
  static properties = {
    value:   { type: String },
    options: { type: Array  },
    _open:   { state: true  },
    _cursor: { state: true  },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      position: relative;
    }
    .combobox {
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      height: 56px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      transition: border-bottom-color 0.2s;
    }
    .combobox:focus-within,
    .combobox-open {
      border-bottom: 2px solid var(--primary-color);
    }
    .combobox-input {
      flex: 1;
      height: 100%;
      padding: 0 8px 0 12px;
      background: transparent;
      border: none;
      color: var(--primary-text-color);
      font-size: 16px;
      font-family: inherit;
      outline: none;
      min-width: 0;
      box-sizing: border-box;
    }
    .combobox-chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 100%;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 12px;
      flex-shrink: 0;
      user-select: none;
    }
    .combobox-chevron:hover {
      color: var(--primary-text-color);
    }
    .combobox-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 9999;
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--divider-color, #444);
      border-radius: 0 0 4px 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      max-height: 240px;
      overflow-y: auto;
      margin-top: 1px;
    }
    .combobox-option {
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      transition: background 0.1s;
    }
    .combobox-option:hover {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
    .combobox-option-selected {
      color: var(--primary-color);
    }
    .combobox-option-cursor {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
  `;

  constructor() {
    super();
    this.value            = '';
    this.options          = [];
    this._open            = false;
    this._cursor          = -1;
    this._onOutsideClick  = this._onOutsideClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onOutsideClick);
  }

  _onOutsideClick(e) {
    if (!this.shadowRoot.contains(e.composedPath()[0]) && e.composedPath()[0] !== this) {
      this._open   = false;
      this._cursor = -1;
    }
  }

  _select(value) {
    this.value   = value;
    this._open   = false;
    this._cursor = -1;
    this.dispatchEvent(new CustomEvent('change', {
      detail:   { value },
      bubbles:  true,
      composed: true,
    }));
  }

  _handleKeyDown(e) {
    const opts = this.options ?? [];
    if (!this._open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this._open   = true;
        this._cursor = 0;
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      this._cursor = Math.min(this._cursor + 1, opts.length - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this._cursor = Math.max(this._cursor - 1, 0);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (this._cursor >= 0 && this._cursor < opts.length) this._select(opts[this._cursor].value);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this._open   = false;
      this._cursor = -1;
      e.preventDefault();
    }
  }

  render() {
    const opts = this.options ?? [];
    return html`
      <div class="combobox ${this._open ? 'combobox-open' : ''}">
        <input
          class="combobox-input"
          .value=${live(this.value ?? '')}
          @input=${e => {
            this.dispatchEvent(new CustomEvent('change', {
              detail:   { value: e.target.value },
              bubbles:  true,
              composed: true,
            }));
          }}
          @blur=${() => { this._open = false; this._cursor = -1; }}
          @keydown=${this._handleKeyDown}
        >
        <div
          class="combobox-chevron"
          @click=${() => {
            this._open = !this._open;
            this._cursor = -1;
            this.shadowRoot.querySelector('.combobox-input').focus();
          }}
          aria-hidden="true"
        >${this._open ? '▴' : '▾'}</div>
      </div>
      ${this._open ? html`
        <div class="combobox-dropdown">
          ${opts.map((opt, i) => html`
            <div
              class="combobox-option
                     ${opt.value === this.value ? 'combobox-option-selected' : ''}
                     ${i === this._cursor       ? 'combobox-option-cursor'   : ''}"
              @mousedown=${(e) => { e.preventDefault(); this._select(opt.value); }}
            >${opt.label}</div>
          `)}
        </div>
      ` : ''}
    `;
  }
}
customElements.define('chrono-cp-select', CpSelect);

// ─── Editor ───────────────────────────────────────────────────────────────────
class ChronoPictureCardEditor extends LitElement {
  static properties = {
    hass:    { attribute: false },
    _config: { state: true },
  };

  setConfig(config) {
    this._config = config;
  }

  // ── Fire config-changed ───────────────────────────────────────────────────
  _fireConfig() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail:   { config: this._config },
      bubbles:  true,
      composed: true,
    }));
  }

  // ── Card-level value changed ──────────────────────────────────────────────
  _valueChanged(key, e) {
    if (!this._config) return;
    const value  = e.target.value ?? e.detail?.value;
    this._config = { ...this._config, [key]: value };
    this._fireConfig();
  }

  // ── Card-level YAML textarea changed ─────────────────────────────────────
  _cardYamlChanged(e) {
    if (!this._config) return;
    const text   = e.target.value ?? e.detail?.value ?? '';
    const parsed = parseYamlExtras(text);
    if (parsed === null) return; // invalid YAML — don't save
    // Remove all existing non-UI keys from config, then merge parsed extras
    const clean = {};
    for (const [k, v] of Object.entries(this._config)) {
      if (UI_CARD_KEYS.has(k)) clean[k] = v;
    }
    this._config = { ...clean, ...parsed };
    this._fireConfig();
  }

  // ── Item-level UI field changed ───────────────────────────────────────────
  _itemChanged(zone, index, key, e) {
    if (!this._config) return;
    const raw = e.target.value ?? e.detail?.value;
    let value;
    if (NUMERIC_ITEM_KEYS.has(key)) {
      const parsed = cpParseNumber(raw);
      if (parsed === null) return;
      value = parsed;
    } else {
      value = raw;
    }
    const items      = [...(this._config[`${zone}_items`] ?? [])];
    items[index]     = { ...items[index], [key]: value };
    this._config     = { ...this._config, [`${zone}_items`]: items };
    this._fireConfig();
  }

  // ── Item-level YAML textarea changed ─────────────────────────────────────
  _itemYamlChanged(zone, index, e) {
    if (!this._config) return;
    const text   = e.target.value ?? e.detail?.value ?? '';
    const parsed = parseYamlExtras(text);
    if (parsed === null) return; // invalid YAML — don't save
    const items  = [...(this._config[`${zone}_items`] ?? [])];
    const item   = items[index];
    // Keep only UI-controlled keys from the existing item, then merge extras
    const clean  = {};
    for (const [k, v] of Object.entries(item)) {
      if (UI_ITEM_KEYS.has(k)) clean[k] = v;
    }
    items[index]     = { ...clean, ...parsed };
    this._config     = { ...this._config, [`${zone}_items`]: items };
    this._fireConfig();
  }

  _itemToggled(zone, index, key, e) {
    if (!this._config) return;
    const value      = e.target.checked;
    const items      = [...(this._config[`${zone}_items`] ?? [])];
    items[index]     = { ...items[index], [key]: value };
    this._config     = { ...this._config, [`${zone}_items`]: items };
    this._fireConfig();
  }

  // ── Add / remove / reorder items ──────────────────────────────────────────
  _addItem(zone, type) {
    const base   = type === 'entity' ? { entity: '' } : { template: '' };
    const items  = [...(this._config[`${zone}_items`] ?? []), base];
    this._config = { ...this._config, [`${zone}_items`]: items };
    this._fireConfig();
  }

  _removeItem(zone, index) {
    const items  = (this._config[`${zone}_items`] ?? []).filter((_, i) => i !== index);
    this._config = { ...this._config, [`${zone}_items`]: items };
    this._fireConfig();
  }

  _itemMoved(zone, e) {
    e.stopPropagation();
    const { oldIndex, newIndex } = e.detail;
    const items  = [...(this._config[`${zone}_items`] ?? [])];
    items.splice(newIndex, 0, items.splice(oldIndex, 1)[0]);
    this._config = { ...this._config, [`${zone}_items`]: items };
    this._fireConfig();
  }

  // ── Option arrays ─────────────────────────────────────────────────────────
  _imageSourceTypeOptions = [
    { label: 'Camera',      value: 'camera'   },
    { label: 'Image URL',   value: 'url'      },
    { label: 'Image entity',value: 'entity'   },
  ];

  _cameraViewOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Live', value: 'live' },
  ];

  _fitModeOptions = [
    { label: 'Cover',   value: 'cover'   },
    { label: 'Contain', value: 'contain' },
    { label: 'Fill',    value: 'fill'    },
  ];

  _objectPositionOptions = [
    { label: 'Center', value: 'center' },
    { label: 'Top',    value: 'top'    },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left',   value: 'left'   },
    { label: 'Right',  value: 'right'  },
  ];

  // ─── Zone panel ────────────────────────────────────────────────────────────────────────────
  _renderZonePanel(zone) {
    const items      = this._config?.[`${zone}_items`] ?? [];
    const zoneLabels = { left: 'Left Items', center: 'Center Items', right: 'Right Items' };
    const zoneLabel  = zoneLabels[zone];

    return html`
      <ha-expansion-panel header="${zoneLabel}" outlined>

        <ha-sortable handle-selector=".handle" @item-moved=${(e) => this._itemMoved(zone, e)}>
          <div class="items-list">
            ${items.map((item, index) => {
              const isEntity   = 'entity'   in item;
              const typeLabel  = isEntity ? 'Entity' : 'Template';
              const typeClass  = isEntity ? 'entity' : 'template';
              const headerText = isEntity
                ? (item.entity || `Entity ${index + 1}`)
                : (item.template
                    ? (item.template.length > 35
                        ? item.template.slice(0, 35) + '…'
                        : item.template)
                    : `Template ${index + 1}`);

              const extrasYaml = serializeExtrasToYaml(item, UI_ITEM_KEYS);

              return html`
                <ha-expansion-panel outlined>

                  <div slot="header" style="display:flex;align-items:center;gap:6px;">
                    <span>${headerText}</span>
                    <span class="item-type-badge ${typeClass}">${typeLabel}</span>
                  </div>

                  <div class="handle" slot="leading-icon">
                    <ha-svg-icon .path=${mdiDragHorizontalVariant}></ha-svg-icon>
                  </div>

                  <!-- Entity ID or Template string -->
                  <div class="item-content-row">
                    ${isEntity
                      ? cpTextField('Entity ID', item.entity ?? '', e => this._itemChanged(zone, index, 'entity', e))
                      : cpTextField('Template\n<i>supports Jinja2 e.g. {{ states("sensor.temp") }} °C</i>', item.template ?? '', e => this._itemChanged(zone, index, 'template', e))
                    }
                  </div>

                  <!-- Entity-only: icon override -->
                  ${isEntity ? html`
                    <div class="item-content-row">
                      ${cpTextField('Icon\n<i>leave empty for default, e.g. mdi:lightbulb</i>', item.icon ?? '', e => this._itemChanged(zone, index, 'icon', e))}
                    </div>
                  ` : ''}

                  <!-- Entity-only: show state toggle -->
                  ${isEntity ? html`
                    <div class="item-toggles-row">
                      ${cpToggleField('Show state', item.show_state ?? false, e => this._itemToggled(zone, index, 'show_state', e))}
                    </div>
                  ` : ''}

                  <!-- Typography: font color, size, weight, line height, border radius -->
                  <div class="item-typography">
                    ${cpColorPicker('Font color', item.font_color ?? '', e => this._itemChanged(zone, index, 'font_color', e))}
                    ${cpTextField('Font size (em)', item.font_size   ?? '', e => this._itemChanged(zone, index, 'font_size',   e), { type: 'number', step: '0.1', min: '0' })}
                    ${cpTextField('Font weight',    item.font_weight ?? '', e => this._itemChanged(zone, index, 'font_weight', e), { type: 'number', step: '100', min: '100', max: '900' })}
                    ${cpTextField('Line height',    item.line_height ?? '', e => this._itemChanged(zone, index, 'line_height', e), { type: 'number', step: '0.1', min: '0' })}
                    ${cpTextField('Border\nradius (px)', item.border_radius ?? '', e => this._itemChanged(zone, index, 'border_radius', e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- Background color and padding -->
                  <div class="item-bg-color-padding">
                    ${cpColorPicker('Background color', item.background_color ?? '', e => this._itemChanged(zone, index, 'background_color', e))}
                    ${cpTextField('Padding\ntop (px)',    item.padding_top    ?? '', e => this._itemChanged(zone, index, 'padding_top',    e), { type: 'number', step: '1', min: '0' })}
                    ${cpTextField('Padding\nbottom (px)', item.padding_bottom ?? '', e => this._itemChanged(zone, index, 'padding_bottom', e), { type: 'number', step: '1', min: '0' })}
                    ${cpTextField('Padding\nleft (px)',   item.padding_left   ?? '', e => this._itemChanged(zone, index, 'padding_left',   e), { type: 'number', step: '1', min: '0' })}
                    ${cpTextField('Padding\nright (px)',  item.padding_right  ?? '', e => this._itemChanged(zone, index, 'padding_right',  e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- YAML extras textarea -->
                  <div class="item-content-row">
                    <div class="text-field">
                      <label>Additional YAML\n<i>tap_action, hold_action, attribute, prefix, suffix, etc.</i></label>
                      <chrono-cp-textarea
                        .value=${extrasYaml}
                        placeholder=""
                        @input=${e => this._itemYamlChanged(zone, index, e)}
                      ></chrono-cp-textarea>
                    </div>
                  </div>

                  <!-- Remove button -->
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${() => this._removeItem(zone, index)}>
                      Remove item
                    </button>
                  </div>

                </ha-expansion-panel>
              `;
            })}
          </div>
        </ha-sortable>

        <div class="add-item-row">
          <button class="add-item-btn" @click=${() => this._addItem(zone, 'entity')}>+ Add entity</button>
          <button class="add-item-btn" @click=${() => this._addItem(zone, 'template')}>+ Add template</button>
        </div>

      </ha-expansion-panel>
    `;
  }
  static styles = css`

    ha-expansion-panel {
      margin-top: 8px;
    }

    /* ── Grid rows ─────────────────────────────────────────────────────────── */

    .image-source {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .image-display {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .image-ratio {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .actions-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .nav-path-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-content-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-toggles-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 16px;
    }

    .item-typography {
      display: grid;
      grid-template-columns: 11fr 4fr 4fr 4fr 4fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-bg-color-padding {
      display: grid;
      grid-template-columns: 11fr 4fr 4fr 4fr 4fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    /* ── Text fields ───────────────────────────────────────────────────────── */

    .text-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .text-field label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      white-space: pre-line;
    }

    /* ── Color picker row ──────────────────────────────────────────────────── */

    .color-picker-row {
      display: flex;
      align-items: stretch;
      gap: 6px;
    }

    .color-picker-row input[type="color"] {
      width: 40px;
      min-width: 40px;
      height: 56px;
      padding: 4px;
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      cursor: pointer;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .color-picker-row chrono-cp-textfield {
      flex: 1;
    }

    /* ── Toggle fields ─────────────────────────────────────────────────────── */

    .toggle-field {
      display: flex;
      flex-direction: row;
      gap: 12px;
      align-items: center;
    }

    .toggle-field label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
    }

    /* ── Add / remove item buttons ─────────────────────────────────────────── */

    .add-item-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    .add-item-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.0892857em;
      text-transform: uppercase;
      height: 36px;
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .add-item-btn:hover {
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.08);
    }

    .remove-item-row {
      display: flex;
      justify-content: center;
      margin-top: 8px;
      margin-bottom: 4px;
    }

    .remove-item-btn {
      background: none;
      border: none;
      color: var(--error-color, #f44336);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.0892857em;
      text-transform: uppercase;
      height: 36px;
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .remove-item-btn:hover {
      background: rgba(244, 67, 54, 0.08);
    }

    /* ── Drag handle ───────────────────────────────────────────────────────── */

    .handle {
      cursor: move;
      cursor: grab;
      padding: 0 4px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
    }

    .handle > * {
      pointer-events: none;
    }

    /* ── Item type badge ───────────────────────────────────────────────────── */

    .item-type-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .item-type-badge.entity {
      background: var(--success-color, #4CAF50);
      color: white;
    }

    .item-type-badge.template {
      background: var(--info-color, #2196F3);
      color: white;
    }

  `;

  render() {
    if (!this._config) return html``;

    const c              = this._config;
    const cardYaml       = serializeExtrasToYaml(c, UI_CARD_KEYS);
    const sourceType     = c.image_source_type ?? 'camera';
    const showObjPos     = (c.fit_mode ?? 'fill') !== 'fill';

    return html`

      <!-- ── Image / Camera ──────────────────────────────────────────────────────────────────── -->

      <ha-expansion-panel header="Image / Camera" outlined .expanded=${true}>

        <!-- Source type selector -->
        <div class="image-ratio">
          ${cpButtonPicker('Source type', sourceType, this._imageSourceTypeOptions, e => this._valueChanged('image_source_type', e))}
        </div>

        <!-- Camera fields -->
        ${sourceType === 'camera' ? html`
          <div class="image-source">
            ${cpTextField('Camera entity', c.camera_image ?? '', e => this._valueChanged('camera_image', e))}
            ${cpSelectField('Camera view', c.camera_view ?? 'live', this._cameraViewOptions, e => this._valueChanged('camera_view', e))}
          </div>
        ` : ''}

        <!-- Static image URL -->
        ${sourceType === 'url' ? html`
          <div class="image-ratio">
            ${cpTextField('Image URL', c.image ?? '', e => this._valueChanged('image', e))}
          </div>
        ` : ''}

        <!-- Image entity -->
        ${sourceType === 'entity' ? html`
          <div class="image-ratio">
            ${cpTextField('Image entity\n<i>image. or person. entity</i>', c.image_entity ?? '', e => this._valueChanged('image_entity', e))}
          </div>
        ` : ''}

        <!-- Fit mode + optional object position -->
        <div class="${showObjPos ? 'image-display' : 'image-source'}">
          ${cpSelectField('Fit mode', c.fit_mode ?? 'fill', this._fitModeOptions, e => this._valueChanged('fit_mode', e))}
          ${showObjPos ? cpSelectField('Object position', c.object_position ?? 'center', this._objectPositionOptions, e => this._valueChanged('object_position', e)) : ''}
        </div>

        <!-- Aspect ratio -->
        <div class="image-ratio">
          ${cpTextField('Aspect ratio\n<i>e.g. 16x9 · 4x3 · 16x10 · leave empty for auto</i>', c.aspect_ratio ?? '', e => this._valueChanged('aspect_ratio', e))}
        </div>

        <!-- Bar background color -->
        <div class="image-ratio">
          ${cpColorPicker('Bar background color\n<i>leave empty for default rgba(0,0,0,0.3)</i>', c.bar_background_color ?? '', e => this._valueChanged('bar_background_color', e))}
        </div>

        <!-- Card-level YAML textarea -->
        <div class="image-ratio">
          <div class="text-field">
            <label>Additional YAML<br><i>tap_action, hold_action, double_tap_action, etc.</i></label>
            <chrono-cp-textarea
              .value=${cardYaml}
              placeholder=""
              @input=${e => this._cardYamlChanged(e)}
            ></chrono-cp-textarea>
          </div>
        </div>

      </ha-expansion-panel>

      <!-- ── Zone panels ───────────────────────────────────────────────────────────────────────────────── -->

      ${ZONE_KEYS.map(zone => this._renderZonePanel(zone))}

    `;
  }
}
customElements.define('chrono-picture-card-editor', ChronoPictureCardEditor);

// ─── Card ─────────────────────────────────────────────────────────────────────
class ChronoPictureCard extends LitElement {
  static properties = {
    _config:     { attribute: false },
    _itemValues: { state: true },
  };

  static getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('chrono-picture-card-editor');
  }

  static getStubConfig() {
    return {
      ...DEFAULT_CONFIG,
      image: 'https://demo.home-assistant.io/stub_config/kitchen.png',
      left_items:   [{ template: 'My Camera', font_color: 'white', font_size: 1.1, font_weight: 600 }],
      center_items: [],
      right_items:  [],
    };
  }

  constructor() {
    super();
    this._config          = null;
    this._hass            = null;
    this._itemValues      = {};
    this._templateUnsubs  = [];
  }

  set hass(hass) {
    const prevConnection = this._hass?.connection;
    this._hass = hass;
    if (this._config) {
      if (hass.connection !== prevConnection || this._templateUnsubs.length === 0) {
        this._setupSubscriptions();
      }
    }
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    let needsResubscribe = this._templateUnsubs.length === 0;

    if (!needsResubscribe && this._config) {
      outer: for (const zone of ZONE_KEYS) {
        const oldItems = this._config[`${zone}_items`] ?? [];
        const newItems = config[`${zone}_items`]       ?? [];
        for (let i = 0; i < Math.max(oldItems.length, newItems.length); i++) {
          const oldTmpl = oldItems[i]?.template ?? '';
          const newTmpl = newItems[i]?.template ?? '';
          if (newTmpl !== oldTmpl && (oldTmpl.includes('{{') || newTmpl.includes('{{'))) {
            needsResubscribe = true;
            break outer;
          }
        }
      }
    }

    this._config = config;
    if (this._hass && needsResubscribe) {
      this._setupSubscriptions();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._hass && this._config && this._templateUnsubs.length === 0) {
      this._setupSubscriptions();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownSubscriptions();
  }

  _setupSubscriptions() {
    this._teardownSubscriptions();

    const sub = (template, callback) => {
      const tmpl = String(template);
      if (!tmpl.includes('{{')) {
        callback(tmpl);
        return;
      }
      const unsub = this._hass.connection.subscribeMessage(
        (msg) => callback(msg.result),
        { type: 'render_template', template: tmpl }
      );
      this._templateUnsubs.push(unsub);
    };

    for (const zone of ZONE_KEYS) {
      const items = this._config?.[`${zone}_items`] ?? [];
      items.forEach((item, index) => {
        if ('template' in item) {
          const key = `${zone}-${index}`;
          sub(item.template ?? '', (value) => {
            this._itemValues = { ...this._itemValues, [key]: value };
          });
        }
      });
    }
  }

  _teardownSubscriptions() {
    this._templateUnsubs.forEach(unsub => {
      if (typeof unsub !== 'function') return;
      try {
        const result = unsub();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch (e) {}
    });
    this._templateUnsubs = [];
  }

  // ── Action handling ───────────────────────────────────────────────────────
  _fireAction(entityId, action) {
    if (!action?.action || action.action === 'none') return;
    switch (action.action) {
      case 'toggle':
        if (entityId) this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
        break;
      case 'more-info':
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail:   { entityId: entityId || this._config.entity },
          bubbles:  true,
          composed: true,
        }));
        break;
      case 'navigate':
        history.pushState(null, '', action.navigation_path);
        this.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
        break;
      case 'call-service': {
        const [domain, service] = (action.service || '').split('.');
        if (domain && service) this._hass.callService(domain, service, action.data || {});
        break;
      }
      case 'url':
        if (action.url_path) window.open(action.url_path, '_blank');
        break;
      default:
        break;
    }
  }

  // ── Item style map ────────────────────────────────────────────────────────
  _itemStyleMap(item) {
    return {
      'color':            item.font_color       || undefined,
      'font-size':        (item.font_size   !== '' && item.font_size   != null) ? `${item.font_size}em` : undefined,
      'font-weight':      (item.font_weight !== '' && item.font_weight != null) ? `${item.font_weight}` : undefined,
      'line-height':      (item.line_height !== '' && item.line_height != null) ? `${item.line_height}` : undefined,
      'border-radius':    (item.border_radius !== '' && item.border_radius != null) ? `${item.border_radius}px` : undefined,
      'background-color': item.background_color || undefined,
      'padding-top':      (item.padding_top    !== '' && item.padding_top    != null) ? `${item.padding_top}px`    : undefined,
      'padding-bottom':   (item.padding_bottom !== '' && item.padding_bottom != null) ? `${item.padding_bottom}px` : undefined,
      'padding-left':     (item.padding_left   !== '' && item.padding_left   != null) ? `${item.padding_left}px`   : undefined,
      'padding-right':    (item.padding_right  !== '' && item.padding_right  != null) ? `${item.padding_right}px`  : undefined,
    };
  }

  // ── Render a single bar item ──────────────────────────────────────────────
  _renderItem(item, zone, index) {
    if ('template' in item) {
      const key    = `${zone}-${index}`;
      const value  = this._itemValues[key] ?? '';
      const hasTap = item.tap_action && item.tap_action.action !== 'none';
      return html`
        <span
          class="bar-template-item${hasTap ? ' clickable' : ''}"
          style=${styleMap(this._itemStyleMap(item))}
          @click=${hasTap ? () => this._fireAction(null, item.tap_action) : undefined}
        >${value}</span>
      `;
    }

    if ('entity' in item) {
      const stateObj  = this._hass?.states?.[item.entity];
      if (!stateObj) {
        return html`
          <span class="bar-entity-missing" title="Entity not found: ${item.entity}">!</span>
        `;
      }
      const domain    = getDomain(item.entity);
      const active    = isStateActive(stateObj);
      const icon      = item.icon || domainIcon(domain, stateObj);
      const tapAction = item.tap_action || defaultTapAction(domain);
      const stateLabel = item.show_state
        ? (item.attribute
            ? `${item.prefix ?? ''}${stateObj.attributes?.[item.attribute] ?? ''}${item.suffix ?? ''}`
            : (this._hass?.formatEntityState
                ? this._hass.formatEntityState(stateObj)
                : stateObj.state))
        : '';

      return html`
        <div
          class="bar-entity-item${active ? ' state-on' : ''}"
          style=${styleMap(this._itemStyleMap(item))}
          title="${stateObj.attributes.friendly_name ?? item.entity}: ${stateObj.state}"
          @click=${(e) => { e.stopPropagation(); this._fireAction(item.entity, tapAction); }}
        >
          <ha-icon .icon=${icon}></ha-icon>
          ${item.show_state ? html`<span class="entity-state-label">${stateLabel}</span>` : ''}
        </div>
      `;
    }

    return html``;
  }

  // ── Render a bar zone ─────────────────────────────────────────────────────
  _renderZone(zone) {
    const items = this._config?.[`${zone}_items`] ?? [];
    return html`
      <div class="bar-zone bar-zone-${zone}">
        ${items.map((item, index) => this._renderItem(item, zone, index))}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      position: relative;
      min-height: 48px;
      overflow: hidden;
      height: auto;
      box-sizing: border-box;
    }
    .image-container {
      width: 100%;
      position: relative;
    }
    .image-container.clickable {
      cursor: pointer;
    }
    hui-image {
      display: block;
      width: 100%;
      pointer-events: none;
    }
    .image-container img {
      display: block;
      width: 100%;
      pointer-events: none;
    }
    .image-container.has-ratio {
      height: 0;
    }
    .image-container.has-ratio img {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
    }
    .bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(
        --ha-picture-card-background-color,
        rgba(0, 0, 0, 0.3)
      );
      padding: 4px 8px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
    }
    .bar-zone {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
      flex: 1;
    }
    .bar-zone-left   { justify-content: flex-start; }
    .bar-zone-center { justify-content: center;     }
    .bar-zone-right  { justify-content: flex-end;   }
    .bar-template-item {
      color: var(--ha-picture-card-text-color, white);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
    .bar-template-item.clickable {
      cursor: pointer;
    }
    .bar-entity-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      color: var(--ha-picture-icon-button-color, #a9a9a9);
      min-width: 40px;
    }
    .bar-entity-item.state-on {
      color: var(--ha-picture-icon-button-on-color, white);
    }
    .bar-entity-item ha-icon {
      --mdc-icon-size: 24px;
    }
    .entity-state-label {
      display: block;
      font-size: 10px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ha-picture-card-text-color, white);
      max-width: 48px;
    }
    .bar-entity-missing {
      color: var(--error-color, #f44336);
      font-weight: bold;
      padding: 0 4px;
    }
  `;

  render() {
    if (!this._config || !this._hass) return html``;

    const c             = this._config;
    const aspectPadding = parseAspectRatio(c.aspect_ratio);
    const fitMode       = c.fit_mode        || 'cover';
    const objPosition   = c.object_position || 'center';

    // Resolve image URL
    let imageUrl = c.image || '';
    if (c.image_entity) {
      const stateObj = this._hass.states[c.image_entity];
      const domain   = getDomain(c.image_entity);
      if (domain === 'image' && stateObj) {
        imageUrl = `/api/image_proxy/${c.image_entity}?token=${stateObj.attributes.access_token}&time=${stateObj.last_updated}`;
      } else if (domain === 'person' && stateObj?.attributes?.entity_picture) {
        imageUrl = stateObj.attributes.entity_picture;
      }
    }

    const imgStyles = {
      'object-fit':      fitMode,
      'object-position': objPosition,
    };

    const isClickable = c.tap_action?.action && c.tap_action.action !== 'none';

    // For camera path: hui-image handles aspect ratio internally via .aspectRatio.
    // Do NOT apply has-ratio / padding-bottom on the container — it conflicts.
    // For static image path: use the padding-bottom trick on the container.
    const containerClass = [
      'image-container',
      !c.camera_image && aspectPadding ? 'has-ratio' : '',
      isClickable ? 'clickable' : '',
    ].filter(Boolean).join(' ');

    const containerStyle = (!c.camera_image && aspectPadding)
      ? `padding-bottom: ${aspectPadding};`
      : '';

    return html`
      <ha-card>
        <div
          class="${containerClass}"
          style="${containerStyle}"
          @click=${() => this._fireAction(c.entity, c.tap_action)}
        >
          ${c.camera_image
            ? html`
                <hui-image
                  .hass=${this._hass}
                  .cameraImage=${c.camera_image}
                  .cameraView=${c.camera_view}
                  .fitMode=${fitMode}
                  .aspectRatio=${c.aspect_ratio}
                  style=${styleMap(imgStyles)}
                ></hui-image>
              `
            : html`
                <img
                  src="${imageUrl}"
                  alt=""
                  style=${styleMap(imgStyles)}
                />
              `
          }
        </div>

        <div class="bar" style=${c.bar_background_color ? `background-color:${c.bar_background_color}` : ''}}>
          ${ZONE_KEYS.map(zone => this._renderZone(zone))}
        </div>
      </ha-card>
    `;
  }
}
customElements.define('chrono-picture-card', ChronoPictureCard);

// ─── Card registration ────────────────────────────────────────────────────────
window.customCards = window.customCards || [];
window.customCards.push({
  type:        'chrono-picture-card',
  name:        'Chrono Picture Card',
  description: 'Camera/image card with configurable template bar and full UI editor.',
  preview:     true,
});
