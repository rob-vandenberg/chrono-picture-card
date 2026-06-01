import{LitElement,html,css}from"https://unpkg.com/lit@2.0.0/index.js?module";import{live}from"https://unpkg.com/lit@2.0.0/directives/live.js?module";import{styleMap}from"https://unpkg.com/lit@2.0.0/directives/style-map.js?module";import{unsafeHTML}from"https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module";import{repeat}from"https://unpkg.com/lit@2.0.0/directives/repeat.js?module";import jsyaml from"https://cdn.jsdelivr.net/npm/js-yaml@4/+esm";const CARD_VERSION="1.0.106",mdiDragHorizontalVariant="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z";console.info("%c CHRONO-%cPICTURE%c-CARD %c v1.0.106 ","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 0 2px 4px; border-radius: 3px 0 0 3px;","background-color: #101010; color: #4676d3; font-weight: bold; padding: 2px 0;","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 4px 2px 0;","background-color: #1E1E1E; color: #FFFFFF; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0;");const DEFAULT_ITEM={_id:"",show:!0,horizontal:"center",vertical:"bottom",icon:"",show_state:!1,font_color:"",font_size:1.2,font_weight:600,line_height:1.2,border_radius:50,background_color:"",padding_top:10,padding_bottom:10,padding_left:10,padding_right:10},DEFAULT_ENTITY_ITEM={...DEFAULT_ITEM,entity:""},DEFAULT_TEMPLATE_ITEM={...DEFAULT_ITEM,template:""},DEFAULT_CONFIG={image_source_type:"camera",entity:"",camera_image:"",camera_view:"live",image:"",image_entity:"",aspect_ratio:"",fit_mode:"fill",object_position:"center",bottom_bar_background_color:"#0000004D",top_bar_background_color:"",items:[]},NUMERIC_ITEM_KEYS=new Set(["font_size","font_weight","line_height","border_radius","padding_top","padding_bottom","padding_left","padding_right"]),UI_ITEM_KEYS=new Set(["_id","show","entity","template","horizontal","vertical","icon","show_state","font_color","font_size","font_weight","line_height","border_radius","background_color","padding_top","padding_bottom","padding_left","padding_right"]),UI_CARD_KEYS=new Set(["type","image_source_type","entity","camera_image","camera_view","image","image_entity","aspect_ratio","fit_mode","object_position","bottom_bar_background_color","top_bar_background_color","items"]),VERTICAL_OPTIONS=[{label:"Top",value:"top"},{label:"Bottom",value:"bottom"}],HORIZONTAL_OPTIONS=[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}],IMAGE_SOURCE_TYPE_OPTIONS=[{label:"Camera",value:"camera"},{label:"Image URL",value:"url"},{label:"Image entity",value:"entity"}],CAMERA_VIEW_OPTIONS=[{label:"Auto",value:"auto"},{label:"Live",value:"live"}],FIT_MODE_OPTIONS=[{label:"Cover",value:"cover"},{label:"Contain",value:"contain"},{label:"Fill",value:"fill"}],OBJECT_POSITION_OPTIONS=[{label:"Center",value:"center"},{label:"Top",value:"top"},{label:"Bottom",value:"bottom"},{label:"Left",value:"left"},{label:"Right",value:"right"}],SHOW_ITEM_POSITION_BADGES=!1,VERTICAL_BADGE_COLORS={top:"#ac00ac",bottom:"#0600ff"},HORIZONTAL_BADGE_COLORS={left:"#bb9e00",center:"#10a800",right:"#00a896"},GROUP_DIVIDER_COLOR="#009ac7",_GROUP_DEFS=[{vertical:"top",horizontal:"left",label:"Top · Left"},{vertical:"top",horizontal:"center",label:"Top · Center"},{vertical:"top",horizontal:"right",label:"Top · Right"},{vertical:"bottom",horizontal:"left",label:"Bottom · Left"},{vertical:"bottom",horizontal:"center",label:"Bottom · Center"},{vertical:"bottom",horizontal:"right",label:"Bottom · Right"}],_GROUP_ORDER=_GROUP_DEFS.map(t=>`${t.vertical}-${t.horizontal}`);function sortItems(t){const e=t=>`${t.vertical??"bottom"}-${t.horizontal??"center"}`;return[...t].sort((t,i)=>_GROUP_ORDER.indexOf(e(t))-_GROUP_ORDER.indexOf(e(i)))}function generateId(t=[]){const e=new Set(t.map(t=>t._id));let i;do{i=Math.random().toString(16).slice(2,10)}while(e.has(i));return i}function migrateConfig(t){let e=!1;if(t.left_items||t.center_items||t.right_items){const i=sortItems([...(t.left_items??[]).map(t=>({...t,horizontal:"left"})),...(t.center_items??[]).map(t=>({...t,horizontal:"center"})),...(t.right_items??[]).map(t=>({...t,horizontal:"right"}))]),{left_items:o,center_items:r,right_items:a,...n}=t;t={...n,items:i},e=!0}if(t.items?.some(t=>!t._id)){const i=[];for(const e of t.items)i.push(e._id?e:{...e,_id:generateId(t.items.concat(i))});t={...t,items:i},e=!0}return{config:t,migrated:e}}function serializeExtrasToYaml(t,e){const i={};for(const[o,r]of Object.entries(t))e.has(o)||(i[o]=r);if(!Object.keys(i).length)return"";try{return jsyaml.dump(i,{indent:2}).trimEnd()}catch(t){return""}}function parseYamlExtras(t){const e=(t??"").trim();if(!e)return{};try{const t=jsyaml.load(e);return t&&"object"==typeof t&&!Array.isArray(t)?t:null}catch(t){return null}}function fireEvent(t,e,i={},o={}){const r=new Event(e,{bubbles:o.bubbles??!0,cancelable:Boolean(o.cancelable),composed:o.composed??!0});return r.detail=i,t.dispatchEvent(r),r}function navigate(t,e={}){e.replace?history.replaceState(null,"",t):history.pushState(null,"",t),fireEvent(window,"location-changed",{replace:e.replace??!1})}function toggleEntity(t,e){e&&t.callService("homeassistant","toggle",{entity_id:e})}function handleAction(t,e,i,o){let r;switch("double_tap"===o&&i.double_tap_action?r=i.double_tap_action:"hold"===o&&i.hold_action?r=i.hold_action:"tap"===o&&i.tap_action&&(r=i.tap_action),r||(r={action:"more-info"}),r.action){case"none":default:break;case"more-info":fireEvent(t,"hass-more-info",{entityId:r.entity??i.entity});break;case"navigate":r.navigation_path&&navigate(r.navigation_path,{replace:r.navigation_replace});break;case"url":r.url_path&&window.open(r.url_path,"_blank");break;case"toggle":toggleEntity(e,i.entity);break;case"perform-action":case"call-service":{const t=r.perform_action??r.service;if(!t)break;const[i,o]=t.split(".",2);if(!i||!o)break;e.callService(i,o,r.data??r.service_data,r.target);break}case"fire-dom-event":fireEvent(t,"ll-custom",r)}}function cpParseNumber(t){const e=String(t).replace(",",".");if("-"===e||"-0"===e||e.endsWith("."))return null;if(""===e)return"";const i=parseFloat(e);return isNaN(i)||String(i)!==e?null:i}function cpTextField(t,e,i,o={}){return html`
    <div class="text-field">
      <label>${unsafeHTML(t)}</label>
      <chrono-cp-textfield
        .value=${String(e??"")}
        type=${o.type??"text"}
        step=${o.step??""}
        min=${o.min??""}
        max=${o.max??""}
        @input=${i}
      ></chrono-cp-textfield>
    </div>
  `}function cpToggleField(t,e,i,o=""){return html`
    <div class="toggle-field ${o}">
      <label>${unsafeHTML(t)}</label>
      <ha-switch .checked=${e} @change=${i}></ha-switch>
    </div>
  `}function toSwatchHex(t){const e=String(t??"").trim();return/^#[0-9a-fA-F]{3}$/.test(e)||/^#[0-9a-fA-F]{6}$/.test(e)?e:/^#[0-9a-fA-F]{8}$/.test(e)?e.slice(0,7):"#000000"}function cpColorPicker(t,e,i){const o=toSwatchHex(e);return html`
    <div class="text-field">
      <label>${unsafeHTML(t)}</label>
      <div class="color-picker-row">
        <input type="color" .value=${o} @input=${i}>
        <chrono-cp-textfield
          .value=${String(e??"")}
          @input=${i}
        ></chrono-cp-textfield>
      </div>
    </div>
  `}function cpSelectField(t,e,i,o){return html`
    <div class="text-field">
      <label>${unsafeHTML(t)}</label>
      <chrono-cp-select
        .value=${e??""}
        .options=${i}
        @change=${o}
      ></chrono-cp-select>
    </div>
  `}function cpButtonPicker(t,e,i,o,r="",a=""){return html`
    <div class="button-picker-field ${a}" style=${"end"===r?"justify-self:end":""}>
      <label>${unsafeHTML(t)}</label>
      <chrono-cp-button-toggle-group
        .value=${e}
        .options=${i}
        @change=${o}
      ></chrono-cp-button-toggle-group>
    </div>
  `}class CpTextfield extends LitElement{static properties={value:{type:String},type:{type:String},step:{type:String},min:{type:String},max:{type:String},placeholder:{type:String}};static styles=css`
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
  `;focus(){this.shadowRoot?.querySelector("input")?.focus()}render(){return html`
      <input
        step=${this.step??""}
        min=${this.min??""}
        max=${this.max??""}
        placeholder=${this.placeholder??""}
        @input=${t=>{this.value=t.target.value,this.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}}
      >
    `}}customElements.define("chrono-cp-textfield",CpTextfield);class CpTextarea extends LitElement{static properties={value:{type:String},placeholder:{type:String},error:{type:Boolean}};static styles=css`
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
  `;focus(){this.shadowRoot?.querySelector("textarea")?.focus()}render(){return html`
      <textarea
        class="${this.error?"error":""}"
        .value=${live(this.value??"")}
        placeholder=${this.placeholder??""}
        @input=${t=>{this.value=t.target.value,this.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}}
      ></textarea>
    `}}customElements.define("chrono-cp-textarea",CpTextarea);class CpButtonToggleGroup extends LitElement{static properties={value:{type:String},options:{type:Array}};static styles=css`
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
  `;render(){const t=this.options??[];return html`${t.map((e,i)=>{const o=1===t.length,r=0===i,a=i===t.length-1,n=[e.value===this.value?"active":"",o?"only":r?"first":a?"last":""].filter(Boolean).join(" ");return html`
        <button class="${n}" @click=${()=>this._select(e.value)}>${e.label}</button>
      `})}`}_select(t){this.value=t,this.dispatchEvent(new CustomEvent("change",{detail:{value:t},bubbles:!0,composed:!0}))}focus(){this.shadowRoot?.querySelector("button")?.focus()}}customElements.define("chrono-cp-button-toggle-group",CpButtonToggleGroup);class CpSelect extends LitElement{static properties={value:{type:String},options:{type:Array},_open:{state:!0},_cursor:{state:!0}};static styles=css`
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
  `;constructor(){super(),this.value="",this.options=[],this._open=!1,this._cursor=-1,this._onOutsideClick=this._onOutsideClick.bind(this)}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onOutsideClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onOutsideClick)}_onOutsideClick(t){this.shadowRoot.contains(t.composedPath()[0])||t.composedPath()[0]===this||(this._open=!1,this._cursor=-1)}_select(t){this.value=t,this._open=!1,this._cursor=-1,this.dispatchEvent(new CustomEvent("change",{detail:{value:t},bubbles:!0,composed:!0}))}_handleKeyDown(t){const e=this.options??[];this._open?"ArrowDown"===t.key?(this._cursor=Math.min(this._cursor+1,e.length-1),t.preventDefault()):"ArrowUp"===t.key?(this._cursor=Math.max(this._cursor-1,0),t.preventDefault()):"Enter"===t.key?(this._cursor>=0&&this._cursor<e.length&&this._select(e[this._cursor].value),t.preventDefault()):"Escape"===t.key&&(this._open=!1,this._cursor=-1,t.preventDefault()):"ArrowDown"!==t.key&&"ArrowUp"!==t.key||(this._open=!0,this._cursor=0,t.preventDefault())}render(){const t=this.options??[];return html`
      <div class="combobox ${this._open?"combobox-open":""}">
        <input
          class="combobox-input"
          .value=${live(this.value??"")}
          @input=${t=>{this.dispatchEvent(new CustomEvent("change",{detail:{value:t.target.value},bubbles:!0,composed:!0}))}}
          @blur=${()=>{this._open=!1,this._cursor=-1}}
          @keydown=${this._handleKeyDown}
        >
        <div
          class="combobox-chevron"
          @click=${()=>{this._open=!this._open,this._cursor=-1,this.shadowRoot.querySelector(".combobox-input").focus()}}
          aria-hidden="true"
        >${this._open?"▴":"▾"}</div>
      </div>
      ${this._open?html`
        <div class="combobox-dropdown">
          ${t.map((t,e)=>html`
            <div
              class="combobox-option
                     ${t.value===this.value?"combobox-option-selected":""}
                     ${e===this._cursor?"combobox-option-cursor":""}"
              @mousedown=${e=>{e.preventDefault(),this._select(t.value)}}
            >${t.label}</div>
          `)}
        </div>
      `:""}
    `}focus(){this.shadowRoot?.querySelector(".combobox-input")?.focus()}}customElements.define("chrono-cp-select",CpSelect);class ChronoPictureCardEditor extends LitElement{static properties={hass:{attribute:!1},_config:{state:!0},_expandedItemId:{state:!0},_removedItem:{state:!0}};setConfig(t){const{config:e,migrated:i}=migrateConfig(t);this._config=e,i&&this._fireConfig()}_fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}_valueChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.value??e.detail?.value;this._config={...this._config,[t]:i},this._fireConfig()}_cardYamlChanged(t){if(!this._config)return;const e=parseYamlExtras(t.target.value??t.detail?.value??"");if(null===e)return;const i={};for(const[t,e]of Object.entries(this._config))UI_CARD_KEYS.has(t)&&(i[t]=e);this._config={...i,...e},this._fireConfig()}_itemChanged(t,e,i){if(!this._config)return;this._clearUndo();const o=i.target.value??i.detail?.value;let r;if(NUMERIC_ITEM_KEYS.has(e)){const t=cpParseNumber(o);if(null===t)return;r=t}else r=o;let a=[...this._config.items??[]];a[t]={...a[t],[e]:r},"horizontal"!==e&&"vertical"!==e||(a=sortItems(a)),this._config={...this._config,items:a},this._fireConfig()}_itemYamlChanged(t,e){if(!this._config)return;this._clearUndo();const i=parseYamlExtras(e.target.value??e.detail?.value??"");if(null===i)return;const o=[...this._config.items??[]],r=o[t],a={};for(const[t,e]of Object.entries(r))UI_ITEM_KEYS.has(t)&&(a[t]=e);o[t]={...a,...i},this._config={...this._config,items:o},this._fireConfig()}_itemToggled(t,e,i){if(!this._config)return;this._clearUndo();const o=i.target.checked,r=[...this._config.items??[]];r[t]={...r[t],[e]:o},this._config={...this._config,items:r},this._fireConfig()}_addItem(t){const e=this._config.items??[];let i="";if("entity"===t){const t=this.hass?.states??{},e=Object.keys(t).find(t=>t.startsWith("light."));i=e??Object.keys(t)[0]??""}else i="{{ now().strftime('%H:%M') }}";const o="entity"===t?{...DEFAULT_ENTITY_ITEM,_id:generateId(e),entity:i}:{...DEFAULT_TEMPLATE_ITEM,_id:generateId(e),template:i},r=sortItems([...e,o]);this._expandedItemId=o._id,this._removedItem=null,this._config={...this._config,items:r},this.updateComplete.then(()=>{const t=this.shadowRoot?.querySelector(`[data-item-id="${o._id}"]`);t?.scrollIntoView({behavior:"smooth",block:"nearest"});const e=t?.querySelector("chrono-cp-textfield");e&&(e.value=i,e.focus())})}_removeItem(t){const e=[...this._config.items??[]];this._removedItem={item:e[t],index:t},this._config={...this._config,items:e.filter((e,i)=>i!==t)},this._fireConfig()}_undoRemove(){if(!this._removedItem)return;const{item:t,index:e}=this._removedItem,i=[...this._config.items??[]];i.splice(e,0,t),this._removedItem=null,this._config={...this._config,items:i},this._fireConfig()}_clearUndo(){this._removedItem&&(this._removedItem=null)}_buildRows(t){const e=[];let i=0;for(const o of _GROUP_DEFS)e.push({type:"divider",group:o,key:`divider-${o.vertical}-${o.horizontal}`}),t.forEach((t,r)=>{(t.vertical??"bottom")===o.vertical&&(t.horizontal??"center")===o.horizontal&&(this._removedItem&&i===this._removedItem.index&&e.push({type:"undo",key:"undo-remove"}),e.push({type:"item",item:t,itemIndex:r,key:t._id}),i++)});return this._removedItem&&i===this._removedItem.index&&e.push({type:"undo",key:"undo-remove"}),e}_itemMoved(t){t.stopPropagation(),this._clearUndo();const{oldIndex:e,newIndex:i}=t.detail,o=[...this._config.items??[]],r=this._buildRows(o);if(!r[e]||"item"!==r[e].type)return;r.splice(i,0,r.splice(e,1)[0]);let a=_GROUP_DEFS[0];const n=[];for(const t of r)"divider"!==t.type?n.push({...t.item,vertical:a.vertical,horizontal:a.horizontal}):a=t.group;this._config={...this._config,items:n},this._fireConfig()}_verticalOptions=VERTICAL_OPTIONS;_horizontalOptions=HORIZONTAL_OPTIONS;_imageSourceTypeOptions=IMAGE_SOURCE_TYPE_OPTIONS;_cameraViewOptions=CAMERA_VIEW_OPTIONS;_fitModeOptions=FIT_MODE_OPTIONS;_objectPositionOptions=OBJECT_POSITION_OPTIONS;_renderItemsPanel(){const t=this._config?.items??[],e=this._buildRows(t);return html`
      <ha-expansion-panel header="Items configuration" outlined>

        <ha-sortable handle-selector=".handle" @item-moved=${t=>this._itemMoved(t)}>
          <div class="items-list">
            ${repeat(e,t=>t.key,t=>{if("divider"===t.type)return html`
                  <div class="group-divider">
                    <span class="group-divider-label" style="color:${"#009ac7"}">${t.group.label}</span>
                    <div class="group-divider-line" style="background:${"#009ac7"}"></div>
                  </div>
                `;if("undo"===t.type)return html`
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${()=>this._undoRemove()}>
                      Undo remove
                    </button>
                  </div>
                `;const e=t.item,i=t.itemIndex,o="entity"in e,r=o?"Entity":"Template",a=o?"entity":"template",n=o?e.entity||`Entity ${i+1}`:e.template?e.template.length>30?e.template.slice(0,30)+"…":e.template:`Template ${i+1}`,s=serializeExtrasToYaml(e,UI_ITEM_KEYS);return html`
                <ha-expansion-panel
                  outlined
                  data-item-id="${e._id}"
                  .expanded=${this._expandedItemId===e._id}
                  @expanded-changed=${t=>{this._expandedItemId=t.detail.value?e._id:null}}
                >

                  <div slot="header" class="item-header-slot">
                    <div class="item-header-content${!1===e.show?" item-hidden":""}">
                      ${""}
                      <span class="item-type-badge ${a}">${r}</span>
                      <span>${n}</span>
                    </div>
                    <button
                      class="item-visibility-btn"
                      title="${!1===e.show?"Show item":"Hide item"}"
                      @click=${t=>{t.stopPropagation(),this._itemToggled(i,"show",{target:{checked:!1===e.show}})}}
                    >
                      <ha-icon .icon=${!1===e.show?"mdi:eye-off-outline":"mdi:eye-outline"}></ha-icon>
                    </button>
                  </div>

                  <div class="handle" slot="leading-icon">
                    <ha-svg-icon .path=${mdiDragHorizontalVariant}></ha-svg-icon>
                  </div>

                  <!-- Position: vertical (top/bottom) and horizontal (left/center/right) -->
                  <div class="item-position-row">
                    ${cpButtonPicker("",e.vertical??"bottom",this._verticalOptions,t=>this._itemChanged(i,"vertical",t))}
                    ${cpButtonPicker("",e.horizontal??"center",this._horizontalOptions,t=>this._itemChanged(i,"horizontal",t))}
                  </div>

                  <!-- Entity ID or Template string -->
                  <div class="item-content-row">
                    ${o?cpTextField("Entity ID",e.entity??"",t=>this._itemChanged(i,"entity",t)):cpTextField('Template\n<i>supports Jinja2 e.g. {{ states("sensor.temp") }} °C</i>',e.template??"",t=>this._itemChanged(i,"template",t))}
                  </div>

                  <!-- Entity-only: icon override -->
                  ${o?html`
                    <div class="item-content-row">
                      ${cpTextField("Icon",e.icon??"",t=>this._itemChanged(i,"icon",t))}
                    </div>
                  `:""}

                  <!-- Entity-only: show state toggle -->
                  ${o?html`
                    <div class="item-toggles-row">
                      ${cpToggleField("Show state",e.show_state??!1,t=>this._itemToggled(i,"show_state",t))}
                    </div>
                  `:""}

                  <!-- Typography: font color, size, weight, line height, border radius -->
                  <div class="item-typography">
                    ${cpColorPicker("Font color",e.font_color??"",t=>this._itemChanged(i,"font_color",t))}
                    ${cpTextField("Font size (em)",e.font_size??"",t=>this._itemChanged(i,"font_size",t),{type:"number",step:"0.1",min:"0"})}
                    ${cpTextField("Font weight",e.font_weight??"",t=>this._itemChanged(i,"font_weight",t),{type:"number",step:"100",min:"100",max:"900"})}
                    ${cpTextField("Line height",e.line_height??"",t=>this._itemChanged(i,"line_height",t),{type:"number",step:"0.1",min:"0"})}
                    ${cpTextField("Border\nradius (px)",e.border_radius??"",t=>this._itemChanged(i,"border_radius",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- Background color and padding -->
                  <div class="item-bg-color-padding">
                    ${cpColorPicker("Background color",e.background_color??"",t=>this._itemChanged(i,"background_color",t))}
                    ${cpTextField("Padding\ntop (px)",e.padding_top??"",t=>this._itemChanged(i,"padding_top",t),{type:"number",step:"1",min:"0"})}
                    ${cpTextField("Padding\nbottom (px)",e.padding_bottom??"",t=>this._itemChanged(i,"padding_bottom",t),{type:"number",step:"1",min:"0"})}
                    ${cpTextField("Padding\nleft (px)",e.padding_left??"",t=>this._itemChanged(i,"padding_left",t),{type:"number",step:"1",min:"0"})}
                    ${cpTextField("Padding\nright (px)",e.padding_right??"",t=>this._itemChanged(i,"padding_right",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- YAML extras textarea (hidden, keep for re-enable) -->
                  <!-- <div class="item-content-row">
                    <div class="text-field">
                      <label>Additional YAML</label>
                      <chrono-cp-textarea
                        .value=${s}
                        placeholder=""
                        @input=${t=>this._itemYamlChanged(i,t)}
                      ></chrono-cp-textarea>
                    </div>
                  </div> -->

                  <!-- Remove button -->
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${()=>this._removeItem(i)}>
                      Remove item
                    </button>
                  </div>

                </ha-expansion-panel>
              `})}
          </div>
        </ha-sortable>

        <div class="add-item-row">
          <button class="add-item-btn" @click=${()=>this._addItem("entity")}>+ Add entity</button>
          <button class="add-item-btn" @click=${()=>this._addItem("template")}>+ Add template</button>
        </div>

      </ha-expansion-panel>
    `}static styles=css`

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

  `;render(){if(!this._config)return html``;const t=this._config,e=serializeExtrasToYaml(t,UI_CARD_KEYS),i=t.image_source_type??"camera",o="fill"!==(t.fit_mode??"fill");return html`

      <!-- ── Image / Camera ──────────────────────────────────────────────────────────────────── -->

      <ha-expansion-panel header="Card configuration" outlined .expanded=${!1}>

        <!-- Source type selector -->
        <div class="image-ratio">
          ${cpButtonPicker("",i,this._imageSourceTypeOptions,t=>this._valueChanged("image_source_type",t))}
        </div>

        <!-- Camera fields — camera entity on its own row (item 1) -->
        ${"camera"===i?html`
          <div class="image-ratio">
            ${cpTextField("Camera entity",t.camera_image??"",t=>this._valueChanged("camera_image",t))}
          </div>
          <!-- Camera view + fit mode + aspect ratio on one row -->
          <div class="image-display">
            ${cpSelectField("Camera view",t.camera_view??"live",this._cameraViewOptions,t=>this._valueChanged("camera_view",t))}
            ${cpSelectField("Fit mode",t.fit_mode??"fill",this._fitModeOptions,t=>this._valueChanged("fit_mode",t))}
            ${cpTextField("Aspect ratio",t.aspect_ratio??"",t=>this._valueChanged("aspect_ratio",t))}
          </div>
        `:""}

        <!-- Static image URL -->
        ${"url"===i?html`
          <div class="image-ratio">
            ${cpTextField("Image URL",t.image??"",t=>this._valueChanged("image",t))}
          </div>
          <!-- Fit mode + aspect ratio on one row -->
          <div class="image-source">
            ${cpSelectField("Fit mode",t.fit_mode??"fill",this._fitModeOptions,t=>this._valueChanged("fit_mode",t))}
            ${cpTextField("Aspect ratio",t.aspect_ratio??"",t=>this._valueChanged("aspect_ratio",t))}
          </div>
        `:""}

        <!-- Image entity -->
        ${"entity"===i?html`
          <div class="image-ratio">
            ${cpTextField("Image entity (image. or person.)",t.image_entity??"",t=>this._valueChanged("image_entity",t))}
          </div>
          <!-- Fit mode + aspect ratio on one row -->
          <div class="image-source">
            ${cpSelectField("Fit mode",t.fit_mode??"fill",this._fitModeOptions,t=>this._valueChanged("fit_mode",t))}
            ${cpTextField("Aspect ratio",t.aspect_ratio??"",t=>this._valueChanged("aspect_ratio",t))}
          </div>
        `:""}

        <!-- Object position — only when fit mode is not fill -->
        ${o?html`
          <div class="image-ratio">
            ${cpSelectField("Object position",t.object_position??"center",this._objectPositionOptions,t=>this._valueChanged("object_position",t))}
          </div>
        `:""}

        <!-- Bar background colors -->
        <div class="image-source">
          ${cpColorPicker("Top bar background color",t.top_bar_background_color??"",t=>this._valueChanged("top_bar_background_color",t))}
          ${cpColorPicker("Bottom bar background color",t.bottom_bar_background_color??"",t=>this._valueChanged("bottom_bar_background_color",t))}
        </div>

        <!-- Card-level YAML textarea (hidden, keep for re-enable) -->
        <!-- <div class="image-ratio">
          <div class="text-field">
            <label>Additional YAML<br><i>tap_action, hold_action, double_tap_action, etc.</i></label>
            <chrono-cp-textarea
              .value=${e}
              placeholder=""
              @input=${t=>this._cardYamlChanged(t)}
            ></chrono-cp-textarea>
          </div>
        </div> -->

      </ha-expansion-panel>

      <!-- ── Items panel ─────────────────────────────────────────────────────────────────────── -->

      ${this._renderItemsPanel()}

    `}}customElements.define("chrono-picture-card-editor",ChronoPictureCardEditor);class ChronoPictureCard extends LitElement{static properties={_config:{attribute:!1},_itemValues:{state:!0},_popup:{state:!0}};static getCardSize(){return 3}static getConfigElement(){return document.createElement("chrono-picture-card-editor")}static getStubConfig(){return{...DEFAULT_CONFIG,image:"https://demo.home-assistant.io/stub_config/kitchen.png",items:[{template:"My Camera",horizontal:"left",vertical:"bottom",font_color:"white",font_size:1.1,font_weight:600}]}}constructor(){super(),this._config=null,this._hass=null,this._itemValues={},this._templateUnsubs=[],this._subscribed=!1,this._popup=null}set hass(t){const e=this._hass,i=e?.connection;this._hass=t,this._config&&(t.connection===i&&this._subscribed||this._setupSubscriptions()),this._hassShouldRender(e,t)&&this.requestUpdate()}get hass(){return this._hass}_hassShouldRender(t,e){if(!t||!e)return!0;const i=this._config;if(!i)return!0;if("camera"===(i.image_source_type??(i.camera_image?"camera":i.image_entity?"entity":"url"))&&i.camera_image)return!0;if(t.locale!==e.locale||t.formatEntityState!==e.formatEntityState)return!0;const o=new Set;i.image_entity&&o.add(i.image_entity);for(const t of i.items??[])t.entity&&o.add(t.entity);for(const i of o)if(t.states?.[i]!==e.states?.[i])return!0;return!1}setConfig(t){({config:t}=migrateConfig(t));let e=!this._subscribed;if(!e&&this._config){const i=this._config.items??[],o=t.items??[];for(let t=0;t<Math.max(i.length,o.length);t++){const r=i[t]?.template??"",a=o[t]?.template??"";if(a!==r&&(r.includes("{{")||a.includes("{{"))){e=!0;break}}}this._config=t,this._hass&&e&&this._setupSubscriptions()}connectedCallback(){super.connectedCallback(),this._hass&&this._config&&!this._subscribed&&this._setupSubscriptions()}disconnectedCallback(){super.disconnectedCallback(),this._teardownSubscriptions()}_setupSubscriptions(){this._teardownSubscriptions(),this._itemValues={};const t=(t,e)=>{const i=String(t);if(!i.includes("{{"))return void e(i);const o=this._hass.connection.subscribeMessage(t=>e(t.result),{type:"render_template",template:i});this._templateUnsubs.push(o)};(this._config?.items??[]).forEach((e,i)=>{if("template"in e){const o=`item-${i}`;t(e.template??"",t=>{this._itemValues={...this._itemValues,[o]:t}})}}),this._subscribed=!0}_teardownSubscriptions(){this._templateUnsubs.forEach(t=>{Promise.resolve(t).then(t=>{"function"==typeof t&&t()}).catch(()=>{})}),this._templateUnsubs=[],this._subscribed=!1}_handleAction(t,e="tap"){if(!this._hass)return;const i="double_tap"===e&&t.double_tap_action?t.double_tap_action:"hold"===e&&t.hold_action?t.hold_action:t.tap_action;"input-select-popup"!==i?.action?handleAction(this,this._hass,t,e):this._openPopup(i)}_openPopup(t){const e=t.entity;if(!e)return;const i=this._hass.states[e];i&&(this._popup={entity:e,options:i.attributes.options??[],current:i.state,on_select:t.on_select??null})}_selectPopupOption(t){const e=this._popup;this._popup=null,e&&this._hass&&(this._hass.callService("input_select","select_option",{entity_id:e.entity,option:t}),e.on_select&&handleAction(this,this._hass,{tap_action:e.on_select,entity:e.entity},"tap"))}_itemStyleMap(t){const e=t=>""!==t&&null!=t?`${t}px`:void 0,i=t=>""!==t&&null!=t?`${t}`:void 0;return{color:t.font_color||void 0,"font-size":(o=t.font_size,""!==o&&null!=o?`${o}em`:void 0),"font-weight":i(t.font_weight),"line-height":i(t.line_height),"border-radius":e(t.border_radius),"background-color":t.background_color||void 0,"padding-top":e(t.padding_top),"padding-bottom":e(t.padding_bottom),"padding-left":e(t.padding_left),"padding-right":e(t.padding_right)};var o}_renderItem(t,e){if(!1===t.show)return html``;if("template"in t){const i=`item-${e}`,o=this._itemValues[i]??"",r=t.tap_action&&"none"!==t.tap_action.action;return html`
        <span
          class="bar-template-item${r?" clickable":""}"
          style=${styleMap(this._itemStyleMap(t))}
          @click=${r?()=>this._handleAction(t):void 0}
        >${o}</span>
      `}if("entity"in t){const e=this._hass?.states?.[t.entity];if(!e)return html`
          <span class="bar-entity-missing" title="Entity not found: ${t.entity}">!</span>
        `;const i={...t,entity:t.entity},o=t.show_state?t.attribute?`${t.prefix??""}${e.attributes?.[t.attribute]??""}${t.suffix??""}`:this._hass?.formatEntityState?this._hass.formatEntityState(e):e.state:"";return html`
        <div
          class="bar-entity-item"
          style=${styleMap(this._itemStyleMap(t))}
          title="${e.attributes.friendly_name??t.entity}: ${e.state}"
          @click=${t=>{t.stopPropagation(),this._handleAction(i)}}
        >
          <ha-state-icon
            .hass=${this._hass}
            .stateObj=${e}
            .icon=${t.icon||void 0}
          ></ha-state-icon>
          ${t.show_state?html`<span class="entity-state-label">${o}</span>`:""}
        </div>
      `}return html``}_renderZone(t,e,i){const o=(this._config?.items??[]).filter(i=>(i.horizontal??"center")===t&&(i.vertical??"bottom")===e);return html`
      <div class="bar-zone bar-zone-${t}">
        ${o.map(t=>this._renderItem(t,i.get(t)))}
      </div>
    `}static styles=css`
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
  `;render(){if(!this._config||!this._hass)return html``;const t=this._config,e=t.fit_mode||"fill",i=t.object_position||"center",o=t.image_source_type??(t.camera_image?"camera":t.image_entity?"entity":"url"),r={};"camera"===o&&t.camera_image?(r.cameraImage=t.camera_image,r.cameraView=t.camera_view):"entity"===o&&t.image_entity?r.entity=t.image_entity:r.image=t.image||"";const a={"object-fit":e,"object-position":i},n=["image-container",t.tap_action?.action&&"none"!==t.tap_action.action?"clickable":""].filter(Boolean).join(" "),s=new Map((t.items??[]).map((t,e)=>[t,e]));return html`
      <ha-card>
        <div
          class="${n}"
          @click=${()=>this._handleAction(t)}
        >
          <hui-image
            .hass=${this._hass}
            .entity=${r.entity}
            .image=${r.image}
            .cameraImage=${r.cameraImage}
            .cameraView=${r.cameraView}
            .fitMode=${e}
            .aspectRatio=${t.aspect_ratio}
            style=${styleMap(a)}
          ></hui-image>
        </div>

        <div class="bar bar-top" style=${styleMap({"background-color":t.top_bar_background_color||void 0})}>
          ${["left","center","right"].map(t=>this._renderZone(t,"top",s))}
        </div>

        <div class="bar bar-bottom" style=${styleMap({"background-color":t.bottom_bar_background_color||void 0})}>
          ${["left","center","right"].map(t=>this._renderZone(t,"bottom",s))}
        </div>

        ${this._popup?html`
          <div class="popup-overlay" @click=${()=>{this._popup=null}}>
            <div class="popup-panel" @click=${t=>t.stopPropagation()}>
              ${this._popup.options.map(t=>html`
                <div
                  class="popup-option${t===this._popup.current?" selected":""}"
                  @click=${()=>this._selectPopupOption(t)}
                >
                  <span class="popup-option-dot"></span>
                  ${t}
                </div>
              `)}
            </div>
          </div>
        `:""}
      </ha-card>
    `}}customElements.define("chrono-picture-card",ChronoPictureCard),window.customCards=window.customCards||[],window.customCards.push({type:"chrono-picture-card",name:"Chrono Picture Card",description:"Camera/image card with configurable template bar and full UI editor.",preview:!0});