import { LitElement, html, css } from 'https://unpkg.com/lit@2.0.0/index.js?module';
import { live }                  from 'https://unpkg.com/lit@2.0.0/directives/live.js?module';
import { styleMap }              from 'https://unpkg.com/lit@2.0.0/directives/style-map.js?module';
import { unsafeHTML }            from 'https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module';
import { repeat }                from 'https://unpkg.com/lit@2.0.0/directives/repeat.js?module';
import jsyaml                   from 'https://cdn.jsdelivr.net/npm/js-yaml@4/+esm';

// ─── Version ──────────────────────────────────────────────────────────────────
const CARD_VERSION = '1.0.108';

// ─── MDI icon paths ───────────────────────────────────────────────────────────
const mdiDragHorizontalVariant = 'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';

// ─── Version History ──────────────────────────────────────────────────────────
// v1.0.108: New item now renders in the preview (restored _fireConfig in
//          _addItem) and the entity/template field is focused correctly —
//          focus now awaits the ha-expansion-panel's own updateComplete (the
//          panel renders its slotted content on its own update cycle when
//          expanded is set programmatically), instead of guessing timing or
//          poking the value in by hand. Field value comes from the data binding.
// v1.0.107: Restore missing value and type bindings on CpTextfield input element
//          accidentally dropped in 1.0.104 when adding focus() method, causing
//          all text fields in the editor to show empty since that version.
// v1.0.106: Fix empty entity/template field on new item — set field value
//          explicitly after panel opens before focus, to bypass live() skipping
//          a field it considers dirty before the value was committed to the DOM.
// v1.0.105: Remove _fireConfig from _addItem — new items persist only on first
//          edit; _removeItem replaced with undo pattern — removed item shows
//          "Undo remove" row in its original position, any other interaction
//          discards it; fix blank lines between _openPopup/_selectPopupOption;
//          extract px/em helpers in _itemStyleMap; derive _GROUP_ORDER from
//          _GROUP_DEFS as single source of truth for group ordering.
// v1.0.104: Add focus() method to all four chrono-cp-* controls (delegates to
//          their internal focusable element); after adding a new item the
//          Entity ID / Template field now correctly receives focus.
// v1.0.103: Badge word-wrap fix (white-space:nowrap); header text truncated at
//          30 chars; Additional YAML sections hidden (code kept); new entity
//          item defaults to first light.* entity (fallback: first entity);
//          new template item defaults to {{ now().strftime('%H:%M') }}; after
//          adding an item the Entity ID / Template field receives focus.
// v1.0.102: When a new item is added, all other item panels collapse and the new
//          item's panel expands and scrolls into view. Item panel open/closed
//          state is now tracked via _expandedItemId.
// v1.0.101: Editor drag-and-drop now moves items between groups. The item list
//          is built as dividers + items (all 6 group dividers always shown, even
//          when empty), so the drag tool's reported position addresses that
//          combined list directly. On drop, each item takes the group of the
//          divider above it (an item dropped above the top divider joins the
//          top-left group); dividers are non-draggable and never written to YAML.
// v1.0.100: Architectural rewrite — stop re-implementing Home Assistant. Tap
//          handling now routes through a vendored copy of HA's own handleAction
//          (faithful to current HA source) via _handleAction, so every action
//          including fire-dom-event (→ ll-custom, HA's extension point for
//          browser_mod and other add-ons) is forwarded to HA unfiltered; removed
//          the hand-rolled _fireAction switch and client-side _resolveDataTemplates
//          (HA does not pre-resolve call-service data — use a script); all image
//          source types (camera/url/entity) now render through hui-image instead
//          of a raw <img> + manual image_proxy URL; entity items now use
//          ha-state-icon (HA icon + state colour) instead of the private
//          DOMAIN_ICON_MAP/domainIcon and ACTIVE_STATES/isStateActive; entity
//          default tap action is more-info (removed DOMAINS_TOGGLE/
//          defaultTapAction); removed parseAspectRatio (hui-image handles it);
//          input-select-popup remains card-owned. Custom chrono-cp-* UI controls
//          unchanged (HA-recommended for third-party cards). NOTE: assist and
//          action confirmation are not implemented — both require internal HA
//          dialogs an externally-loaded card cannot invoke.
// v0.5.50: Harden _resolveDataTemplates against failed/rejected template
//          subscriptions — fall back to the raw value instead of hanging;
//          reset _itemValues in _setupSubscriptions to clear stale template
//          text on resubscribe; defer numeric-field commit until the typed
//          text matches its canonical form so live() no longer clobbers
//          in-progress decimals (e.g. 1.05); derive a swatch-safe hex in
//          cpColorPicker (handles #rrggbbaa and non-hex); build the
//          item→index Map once per render() instead of once per zone; gate
//          requestUpdate() on referenced-state changes via _hassShouldRender();
//          extract shared migrateConfig() used by both setConfig paths
// v0.4.46: Fire config-changed after migration in editor setConfig so HA
//          receives and stores the migrated items array immediately (was only
//          updated in memory, leaving the YAML view showing the old arrays)
// v0.4.45: Resolve call-service data templates server-side via render_template
//          (subscribeMessage) so any valid Jinja2 is supported, not just
//          states(); _resolveDataTemplates is now async and removes the regex
//          and console.warn; call-service branch fires the service after the
//          resolve; _selectPopupOption now routes through _resolveDataTemplates
//          instead of its own inline block (single source of truth), preserving
//          the select_option-before-resolve ordering
// v0.4.44: Fix subscription teardown — Promise.resolve the subscribeMessage
//          return so template subscriptions actually unsubscribe (was leaking);
//          render honors image_source_type via derived useCamera flag instead
//          of branching on camera_image presence; seed generateId() with
//          existing + in-progress ids during _id migration (both setConfig
//          paths) so the uniqueness guard runs; remove ineffective color-input
//          @change handler; add _subscribed flag so setup no longer re-runs on
//          every hass update for template-less cards; build item→index Map in
//          _renderZone (was O(n^2) indexOf); early-return in
//          _resolveDataTemplates when no values contain templates
// v0.4.43: Fix domainIcon() — move map construction to module level; add
//          console.warn for unresolved {{ }} in _resolveDataTemplates; guard
//          _selectPopupOption after await against lost hass; remove dead CSS
//          classes actions-row and nav-path-row; remove _sortItems() wrapper,
//          call sortItems() directly; fix fit_mode fallback in render() from
//          'cover' to 'fill'; fix cpParseNumber trailing-zero suppression;
//          add uniqueness check to generateId(); move inline header slot
//          styles to CSS classes; replace contenteditable CpTextarea with
//          native textarea
// v0.3.42: Add GROUP_DIVIDER_COLOR const; apply to divider label and line
// v0.3.41: Reorder VERTICAL_OPTIONS to Top|Bottom (default remains bottom)
// v0.3.40: Increase button group margin-top and margin-bottom from 2px to 6px
// v0.3.39: Move show toggle to item header as eye icon button with
//          stopPropagation; remove show toggle row from expanded item
// v0.3.38: Add permanent _id per item for stable Lit keying via repeat();
//          add show boolean per item (default true) with toggle as first row;
//          dim header when show is false; skip hidden items in card render;
//          assign _id to items missing one during setConfig migration
// v0.3.37: Add SHOW_ITEM_POSITION_BADGES const (default false) to toggle T/B
//          L/C/R badges; add group dividers between groups in items list;
//          rename "Items" panel to "Items configuration"
// v0.3.36: Move aspect ratio to camera/fit mode row; rename bar color labels;
//          swap top/bottom bar order; reduce button height to 32px with 2px margins
// v0.3.35: Fix sort order — extract sortItems() as module-level function so
//          migration in setConfig() also sorts; fixes items not sorted after
//          loading old configs
// v0.3.34: Add T/B and L/C/R position badges in item header with color coding;
//          add _sortItems() — auto-sort items by group (TL/TC/TR/BL/BC/BR)
//          on add, reorder, and position property change
// v0.3.33: Replace left_items/center_items/right_items with single items array;
//          add horizontal property (left/center/right) per item alongside
//          existing vertical (top/bottom); merge three zone editor panels into
//          one; add HORIZONTAL_OPTIONS const; auto-migrate old configs on load;
//          update DEFAULT_ITEM with new default values
// v0.2.32: Refactor — extract all hardcoded configuration values into a unified
//          constants block: ACTIVE_STATES, DOMAIN_ICON_MAP, DEFAULT_ENTITY_ICON,
//          DEFAULT_ITEM, DEFAULT_ENTITY_ITEM, DEFAULT_TEMPLATE_ITEM, and five
//          editor option arrays (VERTICAL_OPTIONS, IMAGE_SOURCE_TYPE_OPTIONS,
//          CAMERA_VIEW_OPTIONS, FIT_MODE_OPTIONS, OBJECT_POSITION_OPTIONS);
//          consolidate all separate constant sections under one header
// v0.1.31: Fix input-select-popup template resolution — use subscribeMessage
//          (same as template bar items) to render {{ }} in on_select data
// v0.1.30: Fix input-select-popup — fire select_option then immediately send
//          render_template on same WebSocket; sequential processing guarantees
//          server renders template after state is updated
// v0.1.29: Fix input-select-popup — after state_changed confirms new state,
//          render {{ }} templates in on_select.data server-side via render_template
//          WebSocket call, guaranteeing fresh state values
// v0.1.28: Fix input-select-popup — wait for state_changed event confirming
//          new state before firing on_select, guaranteeing correct template resolution
// v0.1.28: Fix input-select-popup timing — subscribe to state_changed before
//          calling service; fire on_select only after HA confirms new state
// v0.1.27: Fix input-select-popup — await callService before firing on_select
// v0.1.26: Remove hardcoded display parameter injection from input-select-popup;
//          on_select fires as-is after input_select is set
// v0.1.25: Fix input-select-popup — popup overlay was missing from render method
// v0.1.24: Fix call-service data template resolution — {{ states('x') }}
//          now resolved client-side before calling service
// v0.1.23: Rename input_select-popup to input-select-popup
// v0.1.22: Add input-select-popup action — built-in popup list from an
//          input_select entity; on_select fires after option chosen with
//          display value injected into service data
// v0.1.21: Remove unauthorized position property and button group
// v0.1.20: Add vertical (top/bottom) property per item; add top bar with
//          top_bar_background_color; rename bar_background_color to
//          bottom_bar_background_color; update item-typography and
//          item-bg-color-padding grid columns to 19fr 8fr 8fr 8fr 8fr
// v0.0.12: Actually fix bar background color — correct line-level replacement
// v0.0.11: Fix bar background color not applied — use styleMap instead of
//          plain string interpolation
// v0.0.10: bar_background_color default #0000004D; remove CSS bar background
//          fallback — empty value now means no background at all
// v0.0.9: Editor layout: camera entity on own row, camera view+fit mode together,
//         bar bg+aspect ratio together; remove label hints from icon, aspect ratio,
//         bar bg color, additional YAML; badge before text in item header;
//         more padding above show state; Image/Camera renamed Card configuration;
//         source type button has no label; image entity label on one line
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

const DEFAULT_ITEM = {
  _id:              '',
  show:             true,
  horizontal:       'center',
  vertical:         'bottom',
  icon:             '',
  show_state:       false,
  font_color:       '',
  font_size:        1.2,
  font_weight:      600,
  line_height:      1.2,
  border_radius:    50,
  background_color: '',
  padding_top:      10,
  padding_bottom:   10,
  padding_left:     10,
  padding_right:    10,
};

const DEFAULT_ENTITY_ITEM   = { ...DEFAULT_ITEM, entity:   '' };
const DEFAULT_TEMPLATE_ITEM = { ...DEFAULT_ITEM, template: '' };

const DEFAULT_CONFIG = {
  image_source_type:           'camera',
  entity:                      '',
  camera_image:                '',
  camera_view:                 'live',
  image:                       '',
  image_entity:                '',
  aspect_ratio:                '',
  fit_mode:                    'fill',
  object_position:             'center',
  bottom_bar_background_color: '#0000004D',
  top_bar_background_color:    '',
  items:                       [],
};

const NUMERIC_ITEM_KEYS = new Set([
  'font_size', 'font_weight', 'line_height', 'border_radius',
  'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
]);

// Keys managed by dedicated UI fields. All other keys go into the YAML textarea.
const UI_ITEM_KEYS = new Set([
  '_id', 'show',
  'entity', 'template',
  'horizontal', 'vertical',
  'icon', 'show_state',
  'font_color', 'font_size', 'font_weight', 'line_height', 'border_radius',
  'background_color',
  'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
]);

const UI_CARD_KEYS = new Set([
  'type', 'image_source_type', 'entity', 'camera_image', 'camera_view',
  'image', 'image_entity', 'aspect_ratio', 'fit_mode', 'object_position',
  'bottom_bar_background_color', 'top_bar_background_color',
  'items',
]);

const VERTICAL_OPTIONS = [
  { label: 'Top',    value: 'top'    },
  { label: 'Bottom', value: 'bottom' },
];

const HORIZONTAL_OPTIONS = [
  { label: 'Left',   value: 'left'   },
  { label: 'Center', value: 'center' },
  { label: 'Right',  value: 'right'  },
];

const IMAGE_SOURCE_TYPE_OPTIONS = [
  { label: 'Camera',       value: 'camera' },
  { label: 'Image URL',    value: 'url'    },
  { label: 'Image entity', value: 'entity' },
];

const CAMERA_VIEW_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Live', value: 'live' },
];

const FIT_MODE_OPTIONS = [
  { label: 'Cover',   value: 'cover'   },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill',    value: 'fill'    },
];

const OBJECT_POSITION_OPTIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Top',    value: 'top'    },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left',   value: 'left'   },
  { label: 'Right',  value: 'right'  },
];

const SHOW_ITEM_POSITION_BADGES = false;

const VERTICAL_BADGE_COLORS = {
  top:    '#ac00ac',
  bottom: '#0600ff',
};

const HORIZONTAL_BADGE_COLORS = {
  left:   '#bb9e00',
  center: '#10a800',
  right:  '#00a896',
};

const GROUP_DIVIDER_COLOR = '#009ac7';

// ─── sortItems ────────────────────────────────────────────────────────────────
const _GROUP_DEFS = [
  { vertical: 'top',    horizontal: 'left',   label: 'Top · Left'      },
  { vertical: 'top',    horizontal: 'center', label: 'Top · Center'    },
  { vertical: 'top',    horizontal: 'right',  label: 'Top · Right'     },
  { vertical: 'bottom', horizontal: 'left',   label: 'Bottom · Left'   },
  { vertical: 'bottom', horizontal: 'center', label: 'Bottom · Center' },
  { vertical: 'bottom', horizontal: 'right',  label: 'Bottom · Right'  },
];

const _GROUP_ORDER = _GROUP_DEFS.map(g => `${g.vertical}-${g.horizontal}`);

function sortItems(items) {
  const key = item => `${item.vertical ?? 'bottom'}-${item.horizontal ?? 'center'}`;
  return [...items].sort((a, b) => _GROUP_ORDER.indexOf(key(a)) - _GROUP_ORDER.indexOf(key(b)));
}

// ─── generateId ───────────────────────────────────────────────────────────────
function generateId(existingItems = []) {
  const existing = new Set(existingItems.map(i => i._id));
  let id;
  do { id = Math.random().toString(16).slice(2, 10); } while (existing.has(id));
  return id;
}

// ─── migrateConfig ────────────────────────────────────────────────────────────
// Migrate legacy left_items/center_items/right_items into a single items array
// and backfill a stable _id on any item missing one. Returns the (possibly new)
// config and whether anything changed.
function migrateConfig(config) {
  let migrated = false;

  if (config.left_items || config.center_items || config.right_items) {
    const items = sortItems([
      ...(config.left_items   ?? []).map(i => ({ ...i, horizontal: 'left'   })),
      ...(config.center_items ?? []).map(i => ({ ...i, horizontal: 'center' })),
      ...(config.right_items  ?? []).map(i => ({ ...i, horizontal: 'right'  })),
    ]);
    const { left_items, center_items, right_items, ...rest } = config;
    config   = { ...rest, items };
    migrated = true;
  }

  if (config.items?.some(i => !i._id)) {
    const withIds = [];
    for (const i of config.items) withIds.push(i._id ? i : { ...i, _id: generateId(config.items.concat(withIds)) });
    config   = { ...config, items: withIds };
    migrated = true;
  }

  return { config, migrated };
}

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

// ─── Home Assistant action compatibility ────────────────────────────────────────
// An externally-loaded card cannot import HA's internal handleAction/fireEvent.
// These are faithful copies of Home Assistant's own implementations so the card
// forwards actions to HA exactly as a built-in card does — including
// fire-dom-event, which HA dispatches as the "ll-custom" event that browser_mod
// and other add-ons listen for. The card adds no allowlist of its own: any action
// HA understands works, and fire-dom-event is HA's extension point for actions
// provided by third-party add-ons.

function fireEvent(node, type, detail = {}, options = {}) {
  const event = new Event(type, {
    bubbles:    options.bubbles    ?? true,
    cancelable: Boolean(options.cancelable),
    composed:   options.composed   ?? true,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
}

function navigate(path, options = {}) {
  if (options.replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
  fireEvent(window, 'location-changed', { replace: options.replace ?? false });
}

function toggleEntity(hass, entityId) {
  if (!entityId) return;
  hass.callService('homeassistant', 'toggle', { entity_id: entityId });
}

// Faithful copy of HA's handleAction. Selects the action config for the given
// interaction (tap/hold/double_tap), defaults to more-info, and routes it.
// Unknown actions do nothing — matching HA, not filtering. assist and action
// confirmation are intentionally not handled: both need internal HA dialogs that
// an externally-loaded card cannot open.
function handleAction(node, hass, config, action) {
  let actionConfig;
  if (action === 'double_tap' && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (action === 'hold' && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (action === 'tap' && config.tap_action) {
    actionConfig = config.tap_action;
  }
  if (!actionConfig) actionConfig = { action: 'more-info' };

  switch (actionConfig.action) {
    case 'none':
      break;
    case 'more-info':
      fireEvent(node, 'hass-more-info', { entityId: actionConfig.entity ?? config.entity });
      break;
    case 'navigate':
      if (actionConfig.navigation_path) {
        navigate(actionConfig.navigation_path, { replace: actionConfig.navigation_replace });
      }
      break;
    case 'url':
      if (actionConfig.url_path) window.open(actionConfig.url_path, '_blank');
      break;
    case 'toggle':
      toggleEntity(hass, config.entity);
      break;
    case 'perform-action':
    case 'call-service': {
      const serviceName = actionConfig.perform_action ?? actionConfig.service;
      if (!serviceName) break;
      const [domain, service] = serviceName.split('.', 2);
      if (!domain || !service) break;
      hass.callService(domain, service, actionConfig.data ?? actionConfig.service_data, actionConfig.target);
      break;
    }
    case 'fire-dom-event':
      fireEvent(node, 'll-custom', actionConfig);
      break;
    default:
      // Unknown action: do nothing, exactly as HA does.
      break;
  }
}

// ─── cpParseNumber ────────────────────────────────────────────────────────────
function cpParseNumber(raw) {
  const v = String(raw).replace(',', '.');
  if (v === '-' || v === '-0' || v.endsWith('.')) return null;
  if (v === '')                                    return '';
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  // Defer commit while the typed text has not yet reached its canonical
  // numeric form (e.g. "1.0", "1.05" mid-typing), so the live() binding does
  // not overwrite in-progress decimal entry.
  if (String(n) !== v) return null;
  return n;
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

function toSwatchHex(value) {
  const v = String(value ?? '').trim();
  if (/^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{8}$/.test(v)) return v.slice(0, 7); // drop alpha; color input has none
  return '#000000';                                       // named/rgb()/empty → neutral
}

function cpColorPicker(label, value, onChange) {
  const swatchValue = toSwatchHex(value);
  return html`
    <div class="text-field">
      <label>${unsafeHTML(label)}</label>
      <div class="color-picker-row">
        <input type="color" .value=${swatchValue} @input=${onChange}>
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

  focus() {
    this.shadowRoot?.querySelector('input')?.focus();
  }

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
    textarea {
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
    textarea:focus {
      border-bottom: 2px solid var(--primary-color);
    }
    textarea.error {
      border-bottom: 2px solid var(--error-color, #f44336);
    }
  `;

  focus() {
    this.shadowRoot?.querySelector('textarea')?.focus();
  }

  render() {
    return html`
      <textarea
        class="${this.error ? 'error' : ''}"
        .value=${live(this.value ?? '')}
        placeholder=${this.placeholder ?? ''}
        @input=${e => {
          this.value = e.target.value;
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }}
      ></textarea>
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
      height: 32px;
      margin-top: 6px;
      margin-bottom: 6px;
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

  focus() {
    this.shadowRoot?.querySelector('button')?.focus();
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

  focus() {
    this.shadowRoot?.querySelector('.combobox-input')?.focus();
  }
}
customElements.define('chrono-cp-select', CpSelect);

// ─── Editor ───────────────────────────────────────────────────────────────────
class ChronoPictureCardEditor extends LitElement {
  static properties = {
    hass:            { attribute: false },
    _config:         { state: true },
    _expandedItemId: { state: true },
    _removedItem:    { state: true },
  };

  setConfig(config) {
    const { config: migratedConfig, migrated } = migrateConfig(config);
    this._config = migratedConfig;
    if (migrated) this._fireConfig();
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
    this._clearUndo();
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
  _itemChanged(index, key, e) {
    if (!this._config) return;
    this._clearUndo();
    const raw = e.target.value ?? e.detail?.value;
    let value;
    if (NUMERIC_ITEM_KEYS.has(key)) {
      const parsed = cpParseNumber(raw);
      if (parsed === null) return;
      value = parsed;
    } else {
      value = raw;
    }
    let items    = [...(this._config.items ?? [])];
    items[index] = { ...items[index], [key]: value };
    if (key === 'horizontal' || key === 'vertical') items = sortItems(items);
    this._config = { ...this._config, items };
    this._fireConfig();
  }

  // ── Item-level YAML textarea changed ─────────────────────────────────────
  _itemYamlChanged(index, e) {
    if (!this._config) return;
    this._clearUndo();
    const text   = e.target.value ?? e.detail?.value ?? '';
    const parsed = parseYamlExtras(text);
    if (parsed === null) return; // invalid YAML — don't save
    const items  = [...(this._config.items ?? [])];
    const item   = items[index];
    // Keep only UI-controlled keys from the existing item, then merge extras
    const clean  = {};
    for (const [k, v] of Object.entries(item)) {
      if (UI_ITEM_KEYS.has(k)) clean[k] = v;
    }
    items[index]     = { ...clean, ...parsed };
    this._config     = { ...this._config, items };
    this._fireConfig();
  }

  _itemToggled(index, key, e) {
    if (!this._config) return;
    this._clearUndo();
    const value      = e.target.checked;
    const items      = [...(this._config.items ?? [])];
    items[index]     = { ...items[index], [key]: value };
    this._config     = { ...this._config, items };
    this._fireConfig();
  }

  // ── Add / remove / reorder items ──────────────────────────────────────────
  _addItem(type) {
    const existing = this._config.items ?? [];
    let defaultValue = '';
    if (type === 'entity') {
      const states = this.hass?.states ?? {};
      const light  = Object.keys(states).find(id => id.startsWith('light.'));
      defaultValue = light ?? Object.keys(states)[0] ?? '';
    } else {
      defaultValue = "{{ now().strftime('%H:%M') }}";
    }
    const base = type === 'entity'
      ? { ...DEFAULT_ENTITY_ITEM,   _id: generateId(existing), entity:   defaultValue }
      : { ...DEFAULT_TEMPLATE_ITEM, _id: generateId(existing), template: defaultValue };
    const items  = sortItems([...existing, base]);
    this._expandedItemId = base._id;
    this._removedItem    = null;
    this._config = { ...this._config, items };
    this._fireConfig();

    // Focus the new item's field only once its panel has rendered its content.
    // ha-expansion-panel renders the slotted content when `expanded` is set
    // (via its own update cycle), so await the panel's updateComplete — not the
    // editor's — before the field exists in the DOM. Value comes from the data
    // binding; it is not set here.
    this.updateComplete.then(async () => {
      const panel = this.shadowRoot?.querySelector(`[data-item-id="${base._id}"]`);
      if (!panel) return;
      await panel.updateComplete;
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      panel.querySelector('chrono-cp-textfield')?.focus();
    });
  }

  _removeItem(index) {
    const items = [...(this._config.items ?? [])];
    this._removedItem = { item: items[index], index };
    this._config = { ...this._config, items: items.filter((_, i) => i !== index) };
    this._fireConfig();
  }

  _undoRemove() {
    if (!this._removedItem) return;
    const { item, index } = this._removedItem;
    const items = [...(this._config.items ?? [])];
    items.splice(index, 0, item);
    this._removedItem = null;
    this._config = { ...this._config, items };
    this._fireConfig();
  }

  _clearUndo() {
    if (this._removedItem) this._removedItem = null;
  }

  // Build the editor's visible list: every group's divider followed by that
  // group's items in array order. All 6 dividers always present. Each item row
  // carries its index within _config.items (the edit handlers address it).
  // If an item was just removed, an undo row appears at its original position.
  _buildRows(items) {
    const rows = [];
    let itemCount = 0;
    for (const g of _GROUP_DEFS) {
      rows.push({ type: 'divider', group: g, key: `divider-${g.vertical}-${g.horizontal}` });
      items.forEach((item, itemIndex) => {
        if ((item.vertical ?? 'bottom') === g.vertical && (item.horizontal ?? 'center') === g.horizontal) {
          // Insert undo row at its original index position
          if (this._removedItem && itemCount === this._removedItem.index) {
            rows.push({ type: 'undo', key: 'undo-remove' });
          }
          rows.push({ type: 'item', item, itemIndex, key: item._id });
          itemCount++;
        }
      });
    }
    // If undo row belongs at the end (was last item)
    if (this._removedItem && itemCount === this._removedItem.index) {
      rows.push({ type: 'undo', key: 'undo-remove' });
    }
    return rows;
  }

  _itemMoved(e) {
    e.stopPropagation();
    this._clearUndo();
    const { oldIndex, newIndex } = e.detail;
    const items = [...(this._config.items ?? [])];
    const rows  = this._buildRows(items);
    if (!rows[oldIndex] || rows[oldIndex].type !== 'item') return; // dividers don't move

    rows.splice(newIndex, 0, rows.splice(oldIndex, 1)[0]);

    // Each item takes the group of the nearest divider above it. An item that
    // ends up above the first divider falls into the first group (top-left).
    let group = _GROUP_DEFS[0];
    const newItems = [];
    for (const row of rows) {
      if (row.type === 'divider') { group = row.group; continue; }
      newItems.push({ ...row.item, vertical: group.vertical, horizontal: group.horizontal });
    }
    this._config = { ...this._config, items: newItems };
    this._fireConfig();
  }

  // ── Option arrays ─────────────────────────────────────────────────────────
  _verticalOptions           = VERTICAL_OPTIONS;
  _horizontalOptions         = HORIZONTAL_OPTIONS;
  _imageSourceTypeOptions    = IMAGE_SOURCE_TYPE_OPTIONS;
  _cameraViewOptions         = CAMERA_VIEW_OPTIONS;
  _fitModeOptions            = FIT_MODE_OPTIONS;
  _objectPositionOptions     = OBJECT_POSITION_OPTIONS;

  // ─── Items panel ───────────────────────────────────────────────────────────
  _renderItemsPanel() {
    const items = this._config?.items ?? [];
    const rows  = this._buildRows(items);

    return html`
      <ha-expansion-panel header="Items configuration" outlined>

        <ha-sortable handle-selector=".handle" @item-moved=${(e) => this._itemMoved(e)}>
          <div class="items-list">
            ${repeat(rows, row => row.key, (row) => {
              if (row.type === 'divider') {
                return html`
                  <div class="group-divider">
                    <span class="group-divider-label" style="color:${GROUP_DIVIDER_COLOR}">${row.group.label}</span>
                    <div class="group-divider-line" style="background:${GROUP_DIVIDER_COLOR}"></div>
                  </div>
                `;
              }

              if (row.type === 'undo') {
                return html`
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${() => this._undoRemove()}>
                      Undo remove
                    </button>
                  </div>
                `;
              }

              const item       = row.item;
              const index      = row.itemIndex;
              const isEntity   = 'entity'   in item;
              const typeLabel  = isEntity ? 'Entity' : 'Template';
              const typeClass  = isEntity ? 'entity' : 'template';
              const headerText = isEntity
                ? (item.entity || `Entity ${index + 1}`)
                : (item.template
                    ? (item.template.length > 30
                        ? item.template.slice(0, 30) + '…'
                        : item.template)
                    : `Template ${index + 1}`);

              const extrasYaml = serializeExtrasToYaml(item, UI_ITEM_KEYS);

              return html`
                <ha-expansion-panel
                  outlined
                  data-item-id="${item._id}"
                  .expanded=${this._expandedItemId === item._id}
                  @expanded-changed=${(e) => {
                    this._expandedItemId = e.detail.value ? item._id : null;
                  }}
                >

                  <div slot="header" class="item-header-slot">
                    <div class="item-header-content${item.show === false ? ' item-hidden' : ''}">
                      ${SHOW_ITEM_POSITION_BADGES ? html`
                        <span class="item-pos-badge" style="background:${VERTICAL_BADGE_COLORS[item.vertical ?? 'bottom']}">${(item.vertical ?? 'bottom') === 'top' ? 'T' : 'B'}</span>
                        <span class="item-pos-badge" style="background:${HORIZONTAL_BADGE_COLORS[item.horizontal ?? 'center']}">${{ left: 'L', center: 'C', right: 'R' }[item.horizontal ?? 'center']}</span>
                      ` : ''}
                      <span class="item-type-badge ${typeClass}">${typeLabel}</span>
                      <span>${headerText}</span>
                    </div>
                    <button
                      class="item-visibility-btn"
                      title="${item.show === false ? 'Show item' : 'Hide item'}"
                      @click=${(e) => { e.stopPropagation(); this._itemToggled(index, 'show', { target: { checked: item.show === false } }); }}
                    >
                      <ha-icon .icon=${item.show === false ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}></ha-icon>
                    </button>
                  </div>

                  <div class="handle" slot="leading-icon">
                    <ha-svg-icon .path=${mdiDragHorizontalVariant}></ha-svg-icon>
                  </div>

                  <!-- Position: vertical (top/bottom) and horizontal (left/center/right) -->
                  <div class="item-position-row">
                    ${cpButtonPicker('', item.vertical ?? 'bottom', this._verticalOptions, e => this._itemChanged(index, 'vertical', e))}
                    ${cpButtonPicker('', item.horizontal ?? 'center', this._horizontalOptions, e => this._itemChanged(index, 'horizontal', e))}
                  </div>

                  <!-- Entity ID or Template string -->
                  <div class="item-content-row">
                    ${isEntity
                      ? cpTextField('Entity ID', item.entity ?? '', e => this._itemChanged(index, 'entity', e))
                      : cpTextField('Template\n<i>supports Jinja2 e.g. {{ states("sensor.temp") }} °C</i>', item.template ?? '', e => this._itemChanged(index, 'template', e))
                    }
                  </div>

                  <!-- Entity-only: icon override -->
                  ${isEntity ? html`
                    <div class="item-content-row">
                      ${cpTextField('Icon', item.icon ?? '', e => this._itemChanged(index, 'icon', e))}
                    </div>
                  ` : ''}

                  <!-- Entity-only: show state toggle -->
                  ${isEntity ? html`
                    <div class="item-toggles-row">
                      ${cpToggleField('Show state', item.show_state ?? false, e => this._itemToggled(index, 'show_state', e))}
                    </div>
                  ` : ''}

                  <!-- Typography: font color, size, weight, line height, border radius -->
                  <div class="item-typography">
                    ${cpColorPicker('Font color', item.font_color ?? '', e => this._itemChanged(index, 'font_color', e))}
                    ${cpTextField('Font size (em)', item.font_size   ?? '', e => this._itemChanged(index, 'font_size',   e), { type: 'number', step: '0.1', min: '0' })}
                    ${cpTextField('Font weight',    item.font_weight ?? '', e => this._itemChanged(index, 'font_weight', e), { type: 'number', step: '100', min: '100', max: '900' })}
                    ${cpTextField('Line height',    item.line_height ?? '', e => this._itemChanged(index, 'line_height', e), { type: 'number', step: '0.1', min: '0' })}
                    ${cpTextField('Border\nradius (px)', item.border_radius ?? '', e => this._itemChanged(index, 'border_radius', e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- Background color and padding -->
                  <div class="item-bg-color-padding">
                    ${cpColorPicker('Background color', item.background_color ?? '', e => this._itemChanged(index, 'background_color', e))}
                    ${cpTextField('Padding\ntop (px)',    item.padding_top    ?? '', e => this._itemChanged(index, 'padding_top',    e), { type: 'number', step: '1', min: '0' })}
                    ${cpTextField('Padding\nbottom (px)', item.padding_bottom ?? '', e => this._itemChanged(index, 'padding_bottom', e), { type: 'number', step: '1', min: '0' })}
                    ${cpTextField('Padding\nleft (px)',   item.padding_left   ?? '', e => this._itemChanged(index, 'padding_left',   e), { type: 'number', step: '1', min: '0' })}
                    ${cpTextField('Padding\nright (px)',  item.padding_right  ?? '', e => this._itemChanged(index, 'padding_right',  e), { type: 'number', step: '1', min: '0' })}
                  </div>

                  <!-- YAML extras textarea (hidden, keep for re-enable) -->
                  <!-- <div class="item-content-row">
                    <div class="text-field">
                      <label>Additional YAML</label>
                      <chrono-cp-textarea
                        .value=${extrasYaml}
                        placeholder=""
                        @input=${e => this._itemYamlChanged(index, e)}
                      ></chrono-cp-textarea>
                    </div>
                  </div> -->

                  <!-- Remove button -->
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${() => this._removeItem(index)}>
                      Remove item
                    </button>
                  </div>

                </ha-expansion-panel>
              `;
            })}
          </div>
        </ha-sortable>

        <div class="add-item-row">
          <button class="add-item-btn" @click=${() => this._addItem('entity')}>+ Add entity</button>
          <button class="add-item-btn" @click=${() => this._addItem('template')}>+ Add template</button>
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

    .item-position-row {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
      margin-top: 4px;
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
      margin-top: 24px;
      margin-bottom: 16px;
    }

    .item-typography {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-bg-color-padding {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
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

    .item-header-slot {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }

    .item-header-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .item-header-content.item-hidden {
      opacity: 0.45;
    }

    .group-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 4px;
    }

    .group-divider-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .group-divider-line {
      flex: 1;
      height: 1px;
      background: var(--divider-color, #444);
      opacity: 0.4;
    }

    .item-visibility-btn {
      background: none;
      border: none;
      padding: 0 4px;
      cursor: pointer;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .item-visibility-btn:hover {
      color: var(--primary-text-color);
    }

    .item-pos-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
    }

    .item-type-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
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

      <ha-expansion-panel header="Card configuration" outlined .expanded=${false}>

        <!-- Source type selector -->
        <div class="image-ratio">
          ${cpButtonPicker('', sourceType, this._imageSourceTypeOptions, e => this._valueChanged('image_source_type', e))}
        </div>

        <!-- Camera fields — camera entity on its own row (item 1) -->
        ${sourceType === 'camera' ? html`
          <div class="image-ratio">
            ${cpTextField('Camera entity', c.camera_image ?? '', e => this._valueChanged('camera_image', e))}
          </div>
          <!-- Camera view + fit mode + aspect ratio on one row -->
          <div class="image-display">
            ${cpSelectField('Camera view', c.camera_view ?? 'live', this._cameraViewOptions, e => this._valueChanged('camera_view', e))}
            ${cpSelectField('Fit mode', c.fit_mode ?? 'fill', this._fitModeOptions, e => this._valueChanged('fit_mode', e))}
            ${cpTextField('Aspect ratio', c.aspect_ratio ?? '', e => this._valueChanged('aspect_ratio', e))}
          </div>
        ` : ''}

        <!-- Static image URL -->
        ${sourceType === 'url' ? html`
          <div class="image-ratio">
            ${cpTextField('Image URL', c.image ?? '', e => this._valueChanged('image', e))}
          </div>
          <!-- Fit mode + aspect ratio on one row -->
          <div class="image-source">
            ${cpSelectField('Fit mode', c.fit_mode ?? 'fill', this._fitModeOptions, e => this._valueChanged('fit_mode', e))}
            ${cpTextField('Aspect ratio', c.aspect_ratio ?? '', e => this._valueChanged('aspect_ratio', e))}
          </div>
        ` : ''}

        <!-- Image entity -->
        ${sourceType === 'entity' ? html`
          <div class="image-ratio">
            ${cpTextField('Image entity (image. or person.)', c.image_entity ?? '', e => this._valueChanged('image_entity', e))}
          </div>
          <!-- Fit mode + aspect ratio on one row -->
          <div class="image-source">
            ${cpSelectField('Fit mode', c.fit_mode ?? 'fill', this._fitModeOptions, e => this._valueChanged('fit_mode', e))}
            ${cpTextField('Aspect ratio', c.aspect_ratio ?? '', e => this._valueChanged('aspect_ratio', e))}
          </div>
        ` : ''}

        <!-- Object position — only when fit mode is not fill -->
        ${showObjPos ? html`
          <div class="image-ratio">
            ${cpSelectField('Object position', c.object_position ?? 'center', this._objectPositionOptions, e => this._valueChanged('object_position', e))}
          </div>
        ` : ''}

        <!-- Bar background colors -->
        <div class="image-source">
          ${cpColorPicker('Top bar background color',    c.top_bar_background_color    ?? '', e => this._valueChanged('top_bar_background_color',    e))}
          ${cpColorPicker('Bottom bar background color', c.bottom_bar_background_color ?? '', e => this._valueChanged('bottom_bar_background_color', e))}
        </div>

        <!-- Card-level YAML textarea (hidden, keep for re-enable) -->
        <!-- <div class="image-ratio">
          <div class="text-field">
            <label>Additional YAML<br><i>tap_action, hold_action, double_tap_action, etc.</i></label>
            <chrono-cp-textarea
              .value=${cardYaml}
              placeholder=""
              @input=${e => this._cardYamlChanged(e)}
            ></chrono-cp-textarea>
          </div>
        </div> -->

      </ha-expansion-panel>

      <!-- ── Items panel ─────────────────────────────────────────────────────────────────────── -->

      ${this._renderItemsPanel()}

    `;
  }
}
customElements.define('chrono-picture-card-editor', ChronoPictureCardEditor);

// ─── Card ─────────────────────────────────────────────────────────────────────
class ChronoPictureCard extends LitElement {
  static properties = {
    _config:     { attribute: false },
    _itemValues: { state: true },
    _popup:      { state: true },
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
      items: [{ template: 'My Camera', horizontal: 'left', vertical: 'bottom', font_color: 'white', font_size: 1.1, font_weight: 600 }],
    };
  }

  constructor() {
    super();
    this._config          = null;
    this._hass            = null;
    this._itemValues      = {};
    this._templateUnsubs  = [];
    this._subscribed      = false;
    this._popup           = null;
  }

  set hass(hass) {
    const prev           = this._hass;
    const prevConnection = prev?.connection;
    this._hass = hass;
    if (this._config) {
      if (hass.connection !== prevConnection || !this._subscribed) {
        this._setupSubscriptions();
      }
    }
    if (this._hassShouldRender(prev, hass)) this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  // ── Decide whether a hass update affects anything this card renders ─────────
  // Template item values arrive via _itemValues (reactive state) and trigger
  // their own update, so they are intentionally not considered here.
  _hassShouldRender(prev, next) {
    if (!prev || !next) return true;
    const c = this._config;
    if (!c) return true;
    const sourceType = c.image_source_type ?? (c.camera_image ? 'camera' : (c.image_entity ? 'entity' : 'url'));
    if (sourceType === 'camera' && c.camera_image) return true; // hui-image needs fresh hass
    if (prev.locale !== next.locale || prev.formatEntityState !== next.formatEntityState) return true;
    const ids = new Set();
    if (c.image_entity) ids.add(c.image_entity);
    for (const item of c.items ?? []) if (item.entity) ids.add(item.entity);
    for (const id of ids) if (prev.states?.[id] !== next.states?.[id]) return true;
    return false;
  }

  setConfig(config) {
    ({ config } = migrateConfig(config));

    let needsResubscribe = !this._subscribed;

    if (!needsResubscribe && this._config) {
      const oldItems = this._config.items ?? [];
      const newItems = config.items       ?? [];
      for (let i = 0; i < Math.max(oldItems.length, newItems.length); i++) {
        const oldTmpl = oldItems[i]?.template ?? '';
        const newTmpl = newItems[i]?.template ?? '';
        if (newTmpl !== oldTmpl && (oldTmpl.includes('{{') || newTmpl.includes('{{'))) {
          needsResubscribe = true;
          break;
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
    if (this._hass && this._config && !this._subscribed) {
      this._setupSubscriptions();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownSubscriptions();
  }

  _setupSubscriptions() {
    this._teardownSubscriptions();
    this._itemValues = {};

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

    const items = this._config?.items ?? [];
    items.forEach((item, index) => {
      if ('template' in item) {
        const key = `item-${index}`;
        sub(item.template ?? '', (value) => {
          this._itemValues = { ...this._itemValues, [key]: value };
        });
      }
    });
    this._subscribed = true;
  }

  _teardownSubscriptions() {
    this._templateUnsubs.forEach(unsub => {
      Promise.resolve(unsub)
        .then(fn => { if (typeof fn === 'function') fn(); })
        .catch(() => {});
    });
    this._templateUnsubs = [];
    this._subscribed     = false;
  }

  // ── Action handling ───────────────────────────────────────────────────────
  // Forward to HA's action handler. The only action the card owns is
  // input-select-popup (custom UI with no HA equivalent); everything else,
  // including fire-dom-event and any add-on action, goes straight to HA.
  _handleAction(config, action = 'tap') {
    if (!this._hass) return;
    const actionConfig =
      (action === 'double_tap' && config.double_tap_action) ? config.double_tap_action :
      (action === 'hold'       && config.hold_action)       ? config.hold_action       :
      config.tap_action;
    if (actionConfig?.action === 'input-select-popup') {
      this._openPopup(actionConfig);
      return;
    }
    handleAction(this, this._hass, config, action);
  }

  // ── input-select-popup (card-owned UI feature) ─────────────────────────────
  _openPopup(action) {
    const entity = action.entity;
    if (!entity) return;
    const stateObj = this._hass.states[entity];
    if (!stateObj) return;
    this._popup = {
      entity,
      options:   stateObj.attributes.options ?? [],
      current:   stateObj.state,
      on_select: action.on_select ?? null,
    };
  }

  // ── Popup option selected ─────────────────────────────────────────────────
  _selectPopupOption(option) {
    const popup = this._popup;
    this._popup = null;
    if (!popup || !this._hass) return;

    // Set the input_select first.
    this._hass.callService('input_select', 'select_option', {
      entity_id: popup.entity,
      option,
    });

    // Then forward any configured on_select action to HA, unchanged.
    if (popup.on_select) {
      handleAction(this, this._hass, { tap_action: popup.on_select, entity: popup.entity }, 'tap');
    }
  }

  // ── Item style map ────────────────────────────────────────────────────────
  _itemStyleMap(item) {
    const px  = v => (v !== '' && v != null) ? `${v}px` : undefined;
    const em  = v => (v !== '' && v != null) ? `${v}em` : undefined;
    const raw = v => (v !== '' && v != null) ? `${v}`   : undefined;
    return {
      'color':            item.font_color       || undefined,
      'font-size':        em(item.font_size),
      'font-weight':      raw(item.font_weight),
      'line-height':      raw(item.line_height),
      'border-radius':    px(item.border_radius),
      'background-color': item.background_color || undefined,
      'padding-top':      px(item.padding_top),
      'padding-bottom':   px(item.padding_bottom),
      'padding-left':     px(item.padding_left),
      'padding-right':    px(item.padding_right),
    };
  }

  // ── Render a single bar item ──────────────────────────────────────────────
  _renderItem(item, index) {
    if (item.show === false) return html``;
    if ('template' in item) {
      const key    = `item-${index}`;
      const value  = this._itemValues[key] ?? '';
      const hasTap = item.tap_action && item.tap_action.action !== 'none';
      return html`
        <span
          class="bar-template-item${hasTap ? ' clickable' : ''}"
          style=${styleMap(this._itemStyleMap(item))}
          @click=${hasTap ? () => this._handleAction(item) : undefined}
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
      const itemConfig = { ...item, entity: item.entity };
      const stateLabel = item.show_state
        ? (item.attribute
            ? `${item.prefix ?? ''}${stateObj.attributes?.[item.attribute] ?? ''}${item.suffix ?? ''}`
            : (this._hass?.formatEntityState
                ? this._hass.formatEntityState(stateObj)
                : stateObj.state))
        : '';

      return html`
        <div
          class="bar-entity-item"
          style=${styleMap(this._itemStyleMap(item))}
          title="${stateObj.attributes.friendly_name ?? item.entity}: ${stateObj.state}"
          @click=${(e) => { e.stopPropagation(); this._handleAction(itemConfig); }}
        >
          <ha-state-icon
            .hass=${this._hass}
            .stateObj=${stateObj}
            .icon=${item.icon || undefined}
          ></ha-state-icon>
          ${item.show_state ? html`<span class="entity-state-label">${stateLabel}</span>` : ''}
        </div>
      `;
    }

    return html``;
  }

  // ── Render a bar zone ─────────────────────────────────────────────────────
  _renderZone(horizontal, vertical, indexOf) {
    const allItems = this._config?.items ?? [];
    const items    = allItems.filter(item =>
      (item.horizontal ?? 'center') === horizontal &&
      (item.vertical   ?? 'bottom') === vertical
    );
    return html`
      <div class="bar-zone bar-zone-${horizontal}">
        ${items.map(item => this._renderItem(item, indexOf.get(item)))}
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
    .bar {
      position: absolute;
      left: 0;
      right: 0;
      padding: 4px 8px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
    }
    .bar-bottom { bottom: 0; }
    .bar-top    { top: 0;    }
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
      min-width: 40px;
    }
    .bar-entity-item ha-state-icon {
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

    /* ── input_select popup ─────────────────────────────────────────────────── */
    .popup-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      cursor: pointer;
    }
    .popup-panel {
      background: var(--card-background-color, #1c1c1c);
      border-radius: 12px;
      padding: 8px 0;
      min-width: 180px;
      max-width: 80%;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      cursor: default;
    }
    .popup-option {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      font-size: 14px;
      color: var(--primary-text-color);
      cursor: pointer;
      transition: background 0.1s;
      gap: 10px;
    }
    .popup-option:hover {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
    .popup-option.selected {
      color: var(--primary-color);
      font-weight: 600;
    }
    .popup-option-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      flex-shrink: 0;
      opacity: 0;
    }
    .popup-option.selected .popup-option-dot {
      opacity: 1;
    }
  `;

  render() {
    if (!this._config || !this._hass) return html``;

    const c             = this._config;
    const fitMode       = c.fit_mode        || 'fill';
    const objPosition   = c.object_position || 'center';
    const sourceType    = c.image_source_type ?? (c.camera_image ? 'camera' : (c.image_entity ? 'entity' : 'url'));

    // hui-image handles all three source types and aspect ratio internally:
    //   camera → .cameraImage / .cameraView
    //   entity → .entity (image, person, etc. — proxy/token handled by HA)
    //   url    → .image
    const imageProps = {};
    if (sourceType === 'camera' && c.camera_image) {
      imageProps.cameraImage = c.camera_image;
      imageProps.cameraView  = c.camera_view;
    } else if (sourceType === 'entity' && c.image_entity) {
      imageProps.entity = c.image_entity;
    } else {
      imageProps.image = c.image || '';
    }

    const imgStyles = {
      'object-fit':      fitMode,
      'object-position': objPosition,
    };

    const isClickable = c.tap_action?.action && c.tap_action.action !== 'none';

    const containerClass = [
      'image-container',
      isClickable ? 'clickable' : '',
    ].filter(Boolean).join(' ');

    // Build item→index map once; _renderZone uses it instead of rebuilding per zone.
    const itemIndex = new Map((c.items ?? []).map((it, i) => [it, i]));

    return html`
      <ha-card>
        <div
          class="${containerClass}"
          @click=${() => this._handleAction(c)}
        >
          <hui-image
            .hass=${this._hass}
            .entity=${imageProps.entity}
            .image=${imageProps.image}
            .cameraImage=${imageProps.cameraImage}
            .cameraView=${imageProps.cameraView}
            .fitMode=${fitMode}
            .aspectRatio=${c.aspect_ratio}
            style=${styleMap(imgStyles)}
          ></hui-image>
        </div>

        <div class="bar bar-top" style=${styleMap({'background-color': c.top_bar_background_color || undefined})}>
          ${['left', 'center', 'right'].map(h => this._renderZone(h, 'top', itemIndex))}
        </div>

        <div class="bar bar-bottom" style=${styleMap({'background-color': c.bottom_bar_background_color || undefined})}>
          ${['left', 'center', 'right'].map(h => this._renderZone(h, 'bottom', itemIndex))}
        </div>

        ${this._popup ? html`
          <div class="popup-overlay" @click=${() => { this._popup = null; }}>
            <div class="popup-panel" @click=${(e) => e.stopPropagation()}>
              ${this._popup.options.map(option => html`
                <div
                  class="popup-option${option === this._popup.current ? ' selected' : ''}"
                  @click=${() => this._selectPopupOption(option)}
                >
                  <span class="popup-option-dot"></span>
                  ${option}
                </div>
              `)}
            </div>
          </div>
        ` : ''}
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
