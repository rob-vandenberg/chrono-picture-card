import{LitElement,html,css}from"https://unpkg.com/lit@2.0.0/index.js?module";import{live}from"https://unpkg.com/lit@2.0.0/directives/live.js?module";import{styleMap}from"https://unpkg.com/lit@2.0.0/directives/style-map.js?module";import{unsafeHTML}from"https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module";import{repeat}from"https://unpkg.com/lit@2.0.0/directives/repeat.js?module";import jsyaml from"https://cdn.jsdelivr.net/npm/js-yaml@4/+esm";const CARD_VERSION="0.3.38",mdiDragHorizontalVariant="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z";console.info("%c CHRONO-%cPICTURE%c-CARD %c v0.3.38 ","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 0 2px 4px; border-radius: 3px 0 0 3px;","background-color: #101010; color: #4676d3; font-weight: bold; padding: 2px 0;","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 4px 2px 0;","background-color: #1E1E1E; color: #FFFFFF; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0;");const DOMAINS_TOGGLE=new Set(["automation","cover","fan","group","humidifier","input_boolean","light","media_player","remote","script","switch","timer","vacuum"]),ACTIVE_STATES=["on","open","opening","unlocked","active","home","playing"],DEFAULT_ENTITY_ICON="mdi:circle",DOMAIN_ICON_MAP={light:"mdi:lightbulb",switch:"mdi:toggle-switch",sensor:"mdi:eye",script:"mdi:script-text",automation:"mdi:robot",input_boolean:"mdi:toggle-switch",cover:"mdi:window-shutter",fan:"mdi:fan",media_player:"mdi:cast",camera:"mdi:camera"},DEFAULT_ITEM={_id:"",show:!0,horizontal:"center",vertical:"bottom",icon:"",show_state:!1,font_color:"",font_size:1.2,font_weight:600,line_height:1.2,border_radius:50,background_color:"",padding_top:12,padding_bottom:12,padding_left:12,padding_right:12},DEFAULT_ENTITY_ITEM={...DEFAULT_ITEM,entity:""},DEFAULT_TEMPLATE_ITEM={...DEFAULT_ITEM,template:""},DEFAULT_CONFIG={image_source_type:"camera",entity:"",camera_image:"",camera_view:"live",image:"",image_entity:"",aspect_ratio:"",fit_mode:"fill",object_position:"center",bottom_bar_background_color:"#0000004D",top_bar_background_color:"",items:[]},NUMERIC_ITEM_KEYS=new Set(["font_size","font_weight","line_height","border_radius","padding_top","padding_bottom","padding_left","padding_right"]),UI_ITEM_KEYS=new Set(["_id","show","entity","template","horizontal","vertical","icon","show_state","font_color","font_size","font_weight","line_height","border_radius","background_color","padding_top","padding_bottom","padding_left","padding_right"]),UI_CARD_KEYS=new Set(["type","image_source_type","entity","camera_image","camera_view","image","image_entity","aspect_ratio","fit_mode","object_position","bottom_bar_background_color","top_bar_background_color","items"]),VERTICAL_OPTIONS=[{label:"Bottom",value:"bottom"},{label:"Top",value:"top"}],HORIZONTAL_OPTIONS=[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}],IMAGE_SOURCE_TYPE_OPTIONS=[{label:"Camera",value:"camera"},{label:"Image URL",value:"url"},{label:"Image entity",value:"entity"}],CAMERA_VIEW_OPTIONS=[{label:"Auto",value:"auto"},{label:"Live",value:"live"}],FIT_MODE_OPTIONS=[{label:"Cover",value:"cover"},{label:"Contain",value:"contain"},{label:"Fill",value:"fill"}],OBJECT_POSITION_OPTIONS=[{label:"Center",value:"center"},{label:"Top",value:"top"},{label:"Bottom",value:"bottom"},{label:"Left",value:"left"},{label:"Right",value:"right"}],VERTICAL_BADGE_COLORS={top:"#ac00ac",bottom:"#0600ff"},HORIZONTAL_BADGE_COLORS={left:"#bb9e00",center:"#10a800",right:"#00a896"},SHOW_ITEM_POSITION_BADGES=!1,_GROUP_ORDER=["top-left","top-center","top-right","bottom-left","bottom-center","bottom-right"];function sortItems(t){const e=t=>`${t.vertical??"bottom"}-${t.horizontal??"center"}`;return[...t].sort((t,i)=>_GROUP_ORDER.indexOf(e(t))-_GROUP_ORDER.indexOf(e(i)))}function generateId(){return Math.random().toString(16).slice(2,10)}function serializeExtrasToYaml(t,e){const i={};for(const[o,r]of Object.entries(t))e.has(o)||(i[o]=r);if(!Object.keys(i).length)return"";try{return jsyaml.dump(i,{indent:2}).trimEnd()}catch(t){return""}}function parseYamlExtras(t){const e=(t??"").trim();if(!e)return{};try{const t=jsyaml.load(e);return t&&"object"==typeof t&&!Array.isArray(t)?t:null}catch(t){return null}}function getDomain(t){return t?.split(".")?.[0]??""}function defaultTapAction(t){return DOMAINS_TOGGLE.has(t)?{action:"toggle"}:{action:"more-info"}}function isStateActive(t){if(!t)return!1;const e=t.state;return ACTIVE_STATES.includes(e)}function domainIcon(t,e){const i=e?.attributes?.device_class,o={...DOMAIN_ICON_MAP,binary_sensor:i?`mdi:${i}`:"mdi:radiobox-blank"};return e?.attributes?.icon??o[t]??"mdi:circle"}function parseAspectRatio(t){if(!t)return null;const e=String(t).match(/^(\d+(?:\.\d+)?)\s*[x:\/]\s*(\d+(?:\.\d+)?)$/i);if(e)return(parseFloat(e[1])/parseFloat(e[2])*100).toFixed(4)+"%";const i=parseFloat(t);return isNaN(i)?null:(100*i).toFixed(4)+"%"}function cpParseNumber(t){const e=String(t).replace(",",".");if("-"===e||"-0"===e||e.endsWith("."))return null;if(e.includes(".")&&e.endsWith("0"))return null;if(""===e)return"";const i=parseFloat(e);return isNaN(i)?null:i}function cpTextField(t,e,i,o={}){return html`
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
  `}function cpColorPicker(t,e,i){const o=e||"#000000";return html`
    <div class="text-field">
      <label>${unsafeHTML(t)}</label>
      <div class="color-picker-row">
        <input type="color" .value=${o} @input=${i}
          @change=${t=>{"#000000"!==t.target.value&&i(t)}}>
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
  `}function cpButtonPicker(t,e,i,o,r="",n=""){return html`
    <div class="button-picker-field ${n}" style=${"end"===r?"justify-self:end":""}>
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
  `;render(){return html`
      <input
        .value=${live(this.value??"")}
        type=${this.type??"text"}
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
  `;updated(t){if(t.has("value")){const t=this.shadowRoot.querySelector(".editor");t&&t!==document.activeElement&&t.innerText!==this.value&&(t.innerText=this.value??"")}}render(){return html`
      <div
        class="editor${this.error?" error":""}"
        contenteditable="true"
        data-placeholder=${this.placeholder??""}
        @input=${t=>{this.value=t.target.innerText,this.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}}
      ></div>
    `}}customElements.define("chrono-cp-textarea",CpTextarea);class CpButtonToggleGroup extends LitElement{static properties={value:{type:String},options:{type:Array}};static styles=css`
    :host {
      display: inline-flex;
    }
    button {
      min-width: 70px;
      height: 32px;
      margin-top: 2px;
      margin-bottom: 2px;
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
  `;render(){const t=this.options??[];return html`${t.map((e,i)=>{const o=1===t.length,r=0===i,n=i===t.length-1,a=[e.value===this.value?"active":"",o?"only":r?"first":n?"last":""].filter(Boolean).join(" ");return html`
        <button class="${a}" @click=${()=>this._select(e.value)}>${e.label}</button>
      `})}`}_select(t){this.value=t,this.dispatchEvent(new CustomEvent("change",{detail:{value:t},bubbles:!0,composed:!0}))}}customElements.define("chrono-cp-button-toggle-group",CpButtonToggleGroup);class CpSelect extends LitElement{static properties={value:{type:String},options:{type:Array},_open:{state:!0},_cursor:{state:!0}};static styles=css`
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
    `}}customElements.define("chrono-cp-select",CpSelect);class ChronoPictureCardEditor extends LitElement{static properties={hass:{attribute:!1},_config:{state:!0}};setConfig(t){if(t.left_items||t.center_items||t.right_items){const e=sortItems([...(t.left_items??[]).map(t=>({...t,horizontal:"left"})),...(t.center_items??[]).map(t=>({...t,horizontal:"center"})),...(t.right_items??[]).map(t=>({...t,horizontal:"right"}))]),{left_items:i,center_items:o,right_items:r,...n}=t;t={...n,items:e}}t.items?.some(t=>!t._id)&&(t={...t,items:t.items.map(t=>t._id?t:{...t,_id:generateId()})}),this._config=t}_fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}_valueChanged(t,e){if(!this._config)return;const i=e.target.value??e.detail?.value;this._config={...this._config,[t]:i},this._fireConfig()}_cardYamlChanged(t){if(!this._config)return;const e=parseYamlExtras(t.target.value??t.detail?.value??"");if(null===e)return;const i={};for(const[t,e]of Object.entries(this._config))UI_CARD_KEYS.has(t)&&(i[t]=e);this._config={...i,...e},this._fireConfig()}_itemChanged(t,e,i){if(!this._config)return;const o=i.target.value??i.detail?.value;let r;if(NUMERIC_ITEM_KEYS.has(e)){const t=cpParseNumber(o);if(null===t)return;r=t}else r=o;let n=[...this._config.items??[]];n[t]={...n[t],[e]:r},"horizontal"!==e&&"vertical"!==e||(n=this._sortItems(n)),this._config={...this._config,items:n},this._fireConfig()}_itemYamlChanged(t,e){if(!this._config)return;const i=parseYamlExtras(e.target.value??e.detail?.value??"");if(null===i)return;const o=[...this._config.items??[]],r=o[t],n={};for(const[t,e]of Object.entries(r))UI_ITEM_KEYS.has(t)&&(n[t]=e);o[t]={...n,...i},this._config={...this._config,items:o},this._fireConfig()}_itemToggled(t,e,i){if(!this._config)return;const o=i.target.checked,r=[...this._config.items??[]];r[t]={...r[t],[e]:o},this._config={...this._config,items:r},this._fireConfig()}_sortItems(t){return sortItems(t)}_addItem(t){const e="entity"===t?{...DEFAULT_ENTITY_ITEM,_id:generateId()}:{...DEFAULT_TEMPLATE_ITEM,_id:generateId()},i=this._sortItems([...this._config.items??[],e]);this._config={...this._config,items:i},this._fireConfig()}_removeItem(t){const e=(this._config.items??[]).filter((e,i)=>i!==t);this._config={...this._config,items:e},this._fireConfig()}_itemMoved(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,o=[...this._config.items??[]];o.splice(i,0,o.splice(e,1)[0]),this._config={...this._config,items:this._sortItems(o)},this._fireConfig()}_verticalOptions=VERTICAL_OPTIONS;_horizontalOptions=HORIZONTAL_OPTIONS;_imageSourceTypeOptions=IMAGE_SOURCE_TYPE_OPTIONS;_cameraViewOptions=CAMERA_VIEW_OPTIONS;_fitModeOptions=FIT_MODE_OPTIONS;_objectPositionOptions=OBJECT_POSITION_OPTIONS;_renderItemsPanel(){const t=this._config?.items??[],e=t=>`${"top"===(t.vertical??"bottom")?"Top":"Bottom"} · ${{left:"Left",center:"Center",right:"Right"}[t.horizontal??"center"]}`;return html`
      <ha-expansion-panel header="Items configuration" outlined>

        <ha-sortable handle-selector=".handle" @item-moved=${t=>this._itemMoved(t)}>
          <div class="items-list">
            ${repeat(t,t=>t._id,(i,o)=>{const r="entity"in i,n=r?"Entity":"Template",a=r?"entity":"template",s=r?i.entity||`Entity ${o+1}`:i.template?i.template.length>35?i.template.slice(0,35)+"…":i.template:`Template ${o+1}`,l=serializeExtrasToYaml(i,UI_ITEM_KEYS),c=t[o-1],p=0===o||e(i)!==e(c);return html`
                ${p?html`
                  <div class="group-divider">
                    <span class="group-divider-label">${e(i)}</span>
                    <div class="group-divider-line"></div>
                  </div>
                `:""}

                <ha-expansion-panel outlined>

                  <div slot="header" style="display:flex;align-items:center;gap:6px;${!1===i.show?"opacity:0.45;":""}">
                    ${""}
                    <span class="item-type-badge ${a}">${n}</span>
                    <span>${s}</span>
                  </div>

                  <div class="handle" slot="leading-icon">
                    <ha-svg-icon .path=${mdiDragHorizontalVariant}></ha-svg-icon>
                  </div>

                  <!-- Show toggle — first row -->
                  <div class="item-toggles-row">
                    ${cpToggleField("Show",!1!==i.show,t=>this._itemToggled(o,"show",t))}
                  </div>

                  <!-- Position: vertical (top/bottom) and horizontal (left/center/right) -->
                  <div class="item-position-row">
                    ${cpButtonPicker("",i.vertical??"bottom",this._verticalOptions,t=>this._itemChanged(o,"vertical",t))}
                    ${cpButtonPicker("",i.horizontal??"center",this._horizontalOptions,t=>this._itemChanged(o,"horizontal",t))}
                  </div>

                  <!-- Entity ID or Template string -->
                  <div class="item-content-row">
                    ${r?cpTextField("Entity ID",i.entity??"",t=>this._itemChanged(o,"entity",t)):cpTextField('Template\n<i>supports Jinja2 e.g. {{ states("sensor.temp") }} °C</i>',i.template??"",t=>this._itemChanged(o,"template",t))}
                  </div>

                  <!-- Entity-only: icon override -->
                  ${r?html`
                    <div class="item-content-row">
                      ${cpTextField("Icon",i.icon??"",t=>this._itemChanged(o,"icon",t))}
                    </div>
                  `:""}

                  <!-- Entity-only: show state toggle -->
                  ${r?html`
                    <div class="item-toggles-row">
                      ${cpToggleField("Show state",i.show_state??!1,t=>this._itemToggled(o,"show_state",t))}
                    </div>
                  `:""}

                  <!-- Typography: font color, size, weight, line height, border radius -->
                  <div class="item-typography">
                    ${cpColorPicker("Font color",i.font_color??"",t=>this._itemChanged(o,"font_color",t))}
                    ${cpTextField("Font size (em)",i.font_size??"",t=>this._itemChanged(o,"font_size",t),{type:"number",step:"0.1",min:"0"})}
                    ${cpTextField("Font weight",i.font_weight??"",t=>this._itemChanged(o,"font_weight",t),{type:"number",step:"100",min:"100",max:"900"})}
                    ${cpTextField("Line height",i.line_height??"",t=>this._itemChanged(o,"line_height",t),{type:"number",step:"0.1",min:"0"})}
                    ${cpTextField("Border\nradius (px)",i.border_radius??"",t=>this._itemChanged(o,"border_radius",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- Background color and padding -->
                  <div class="item-bg-color-padding">
                    ${cpColorPicker("Background color",i.background_color??"",t=>this._itemChanged(o,"background_color",t))}
                    ${cpTextField("Padding\ntop (px)",i.padding_top??"",t=>this._itemChanged(o,"padding_top",t),{type:"number",step:"1",min:"0"})}
                    ${cpTextField("Padding\nbottom (px)",i.padding_bottom??"",t=>this._itemChanged(o,"padding_bottom",t),{type:"number",step:"1",min:"0"})}
                    ${cpTextField("Padding\nleft (px)",i.padding_left??"",t=>this._itemChanged(o,"padding_left",t),{type:"number",step:"1",min:"0"})}
                    ${cpTextField("Padding\nright (px)",i.padding_right??"",t=>this._itemChanged(o,"padding_right",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- YAML extras textarea -->
                  <div class="item-content-row">
                    <div class="text-field">
                      <label>Additional YAML</label>
                      <chrono-cp-textarea
                        .value=${l}
                        placeholder=""
                        @input=${t=>this._itemYamlChanged(o,t)}
                      ></chrono-cp-textarea>
                    </div>
                  </div>

                  <!-- Remove button -->
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${()=>this._removeItem(o)}>
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

        <!-- Card-level YAML textarea -->
        <div class="image-ratio">
          <div class="text-field">
            <label>Additional YAML<br><i>tap_action, hold_action, double_tap_action, etc.</i></label>
            <chrono-cp-textarea
              .value=${e}
              placeholder=""
              @input=${t=>this._cardYamlChanged(t)}
            ></chrono-cp-textarea>
          </div>
        </div>

      </ha-expansion-panel>

      <!-- ── Items panel ─────────────────────────────────────────────────────────────────────── -->

      ${this._renderItemsPanel()}

    `}}customElements.define("chrono-picture-card-editor",ChronoPictureCardEditor);class ChronoPictureCard extends LitElement{static properties={_config:{attribute:!1},_itemValues:{state:!0},_popup:{state:!0}};static getCardSize(){return 3}static getConfigElement(){return document.createElement("chrono-picture-card-editor")}static getStubConfig(){return{...DEFAULT_CONFIG,image:"https://demo.home-assistant.io/stub_config/kitchen.png",items:[{template:"My Camera",horizontal:"left",vertical:"bottom",font_color:"white",font_size:1.1,font_weight:600}]}}constructor(){super(),this._config=null,this._hass=null,this._itemValues={},this._templateUnsubs=[],this._popup=null}set hass(t){const e=this._hass?.connection;this._hass=t,this._config&&(t.connection===e&&0!==this._templateUnsubs.length||this._setupSubscriptions()),this.requestUpdate()}get hass(){return this._hass}setConfig(t){if(t.left_items||t.center_items||t.right_items){const e=sortItems([...(t.left_items??[]).map(t=>({...t,horizontal:"left"})),...(t.center_items??[]).map(t=>({...t,horizontal:"center"})),...(t.right_items??[]).map(t=>({...t,horizontal:"right"}))]),{left_items:i,center_items:o,right_items:r,...n}=t;t={...n,items:e}}t.items?.some(t=>!t._id)&&(t={...t,items:t.items.map(t=>t._id?t:{...t,_id:generateId()})});let e=0===this._templateUnsubs.length;if(!e&&this._config){const i=this._config.items??[],o=t.items??[];for(let t=0;t<Math.max(i.length,o.length);t++){const r=i[t]?.template??"",n=o[t]?.template??"";if(n!==r&&(r.includes("{{")||n.includes("{{"))){e=!0;break}}}this._config=t,this._hass&&e&&this._setupSubscriptions()}connectedCallback(){super.connectedCallback(),this._hass&&this._config&&0===this._templateUnsubs.length&&this._setupSubscriptions()}disconnectedCallback(){super.disconnectedCallback(),this._teardownSubscriptions()}_setupSubscriptions(){this._teardownSubscriptions();const t=(t,e)=>{const i=String(t);if(!i.includes("{{"))return void e(i);const o=this._hass.connection.subscribeMessage(t=>e(t.result),{type:"render_template",template:i});this._templateUnsubs.push(o)};(this._config?.items??[]).forEach((e,i)=>{if("template"in e){const o=`item-${i}`;t(e.template??"",t=>{this._itemValues={...this._itemValues,[o]:t}})}})}_teardownSubscriptions(){this._templateUnsubs.forEach(t=>{if("function"==typeof t)try{const e=t();e&&"function"==typeof e.catch&&e.catch(()=>{})}catch(t){}}),this._templateUnsubs=[]}_fireAction(t,e){if(e?.action&&"none"!==e.action)switch(e.action){case"toggle":t&&this._hass.callService("homeassistant","toggle",{entity_id:t});break;case"more-info":this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:t||this._config.entity},bubbles:!0,composed:!0}));break;case"navigate":history.pushState(null,"",e.navigation_path),this.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}));break;case"call-service":{const[t,i]=(e.service||"").split(".");if(t&&i){const o=this._resolveDataTemplates(e.data||{});this._hass.callService(t,i,o)}break}case"url":e.url_path&&window.open(e.url_path,"_blank");break;case"input-select-popup":{const t=e.entity;if(!t)break;const i=this._hass.states[t];if(!i)break;this._popup={entity:t,options:i.attributes.options??[],current:i.state,on_select:e.on_select??null};break}}}_resolveDataTemplates(t){const e={};for(const[i,o]of Object.entries(t))"string"==typeof o&&o.includes("{{")?e[i]=o.replace(/\{\{\s*states\(\s*['"](.*?)['"]\s*\)\s*\}\}/g,(t,e)=>this._hass.states[e]?.state??""):e[i]=o;return e}async _selectPopupOption(t){const e=this._popup;if(this._popup=null,!e.on_select)return void this._hass.callService("input_select","select_option",{entity_id:e.entity,option:t});const i={...e.on_select};if(i.data){this._hass.callService("input_select","select_option",{entity_id:e.entity,option:t});const o={},r=Object.entries(i.data).filter(([,t])=>"string"==typeof t&&t.includes("{{")),n=Object.entries(i.data).filter(([,t])=>!("string"==typeof t&&t.includes("{{")));for(const[t,e]of n)o[t]=e;await Promise.all(r.map(([t,e])=>new Promise(i=>{const r=this._hass.connection.subscribeMessage(e=>{o[t]=e.result,r.then(t=>t()),i()},{type:"render_template",template:e})}))),i.data=o}else this._hass.callService("input_select","select_option",{entity_id:e.entity,option:t});this._fireAction(null,i)}_itemStyleMap(t){return{color:t.font_color||void 0,"font-size":""!==t.font_size&&null!=t.font_size?`${t.font_size}em`:void 0,"font-weight":""!==t.font_weight&&null!=t.font_weight?`${t.font_weight}`:void 0,"line-height":""!==t.line_height&&null!=t.line_height?`${t.line_height}`:void 0,"border-radius":""!==t.border_radius&&null!=t.border_radius?`${t.border_radius}px`:void 0,"background-color":t.background_color||void 0,"padding-top":""!==t.padding_top&&null!=t.padding_top?`${t.padding_top}px`:void 0,"padding-bottom":""!==t.padding_bottom&&null!=t.padding_bottom?`${t.padding_bottom}px`:void 0,"padding-left":""!==t.padding_left&&null!=t.padding_left?`${t.padding_left}px`:void 0,"padding-right":""!==t.padding_right&&null!=t.padding_right?`${t.padding_right}px`:void 0}}_renderItem(t,e){if(!1===t.show)return html``;if("template"in t){const i=`item-${e}`,o=this._itemValues[i]??"",r=t.tap_action&&"none"!==t.tap_action.action;return html`
        <span
          class="bar-template-item${r?" clickable":""}"
          style=${styleMap(this._itemStyleMap(t))}
          @click=${r?()=>this._fireAction(null,t.tap_action):void 0}
        >${o}</span>
      `}if("entity"in t){const e=this._hass?.states?.[t.entity];if(!e)return html`
          <span class="bar-entity-missing" title="Entity not found: ${t.entity}">!</span>
        `;const i=getDomain(t.entity),o=isStateActive(e),r=t.icon||domainIcon(i,e),n=t.tap_action||defaultTapAction(i),a=t.show_state?t.attribute?`${t.prefix??""}${e.attributes?.[t.attribute]??""}${t.suffix??""}`:this._hass?.formatEntityState?this._hass.formatEntityState(e):e.state:"";return html`
        <div
          class="bar-entity-item${o?" state-on":""}"
          style=${styleMap(this._itemStyleMap(t))}
          title="${e.attributes.friendly_name??t.entity}: ${e.state}"
          @click=${e=>{e.stopPropagation(),this._fireAction(t.entity,n)}}
        >
          <ha-icon .icon=${r}></ha-icon>
          ${t.show_state?html`<span class="entity-state-label">${a}</span>`:""}
        </div>
      `}return html``}_renderZone(t,e){const i=this._config?.items??[],o=i.filter(i=>(i.horizontal??"center")===t&&(i.vertical??"bottom")===e);return html`
      <div class="bar-zone bar-zone-${t}">
        ${o.map((t,e)=>{const o=i.indexOf(t);return this._renderItem(t,o)})}
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
  `;render(){if(!this._config||!this._hass)return html``;const t=this._config,e=parseAspectRatio(t.aspect_ratio),i=t.fit_mode||"cover",o=t.object_position||"center";let r=t.image||"";if(t.image_entity){const e=this._hass.states[t.image_entity],i=getDomain(t.image_entity);"image"===i&&e?r=`/api/image_proxy/${t.image_entity}?token=${e.attributes.access_token}&time=${e.last_updated}`:"person"===i&&e?.attributes?.entity_picture&&(r=e.attributes.entity_picture)}const n={"object-fit":i,"object-position":o},a=t.tap_action?.action&&"none"!==t.tap_action.action,s=["image-container",!t.camera_image&&e?"has-ratio":"",a?"clickable":""].filter(Boolean).join(" "),l=!t.camera_image&&e?`padding-bottom: ${e};`:"";return html`
      <ha-card>
        <div
          class="${s}"
          style="${l}"
          @click=${()=>this._fireAction(t.entity,t.tap_action)}
        >
          ${t.camera_image?html`
                <hui-image
                  .hass=${this._hass}
                  .cameraImage=${t.camera_image}
                  .cameraView=${t.camera_view}
                  .fitMode=${i}
                  .aspectRatio=${t.aspect_ratio}
                  style=${styleMap(n)}
                ></hui-image>
              `:html`
                <img
                  src="${r}"
                  alt=""
                  style=${styleMap(n)}
                />
              `}
        </div>

        <div class="bar bar-top" style=${styleMap({"background-color":t.top_bar_background_color||void 0})}>
          ${["left","center","right"].map(t=>this._renderZone(t,"top"))}
        </div>

        <div class="bar bar-bottom" style=${styleMap({"background-color":t.bottom_bar_background_color||void 0})}>
          ${["left","center","right"].map(t=>this._renderZone(t,"bottom"))}
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