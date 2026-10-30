
function loadAtlasScript(url){return new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=url;const t=setTimeout(()=>{s.remove();reject(new Error("Map library timed out."));},12000);s.onload=()=>{clearTimeout(t);resolve();};s.onerror=()=>{clearTimeout(t);s.remove();reject(new Error("Map library failed to load."));};document.head.appendChild(s);});}
async function ensureAtlasMapLibre(){if(window.maplibregl)return window.maplibregl;try{await loadAtlasScript("https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.js");}catch(e){await loadAtlasScript("https://cdn.jsdelivr.net/npm/maplibre-gl@6.16.0/dist/maplibre-gl.js");}if(!window.maplibregl)throw new Error("MapLibre did not initialise.");return window.maplibregl;}

(async function(){
"use strict";
const $=id=>document.getElementById(id),status=$("mapStatus");
const say=(m,e=false)=>{status.textContent=m||"";status.classList.toggle("error",!!e);};
window.addEventListener("error",e=>say("Map error: "+(e.message||"Unexpected error"),true));
window.addEventListener("unhandledrejection",e=>say("Map error: "+(e.reason&&e.reason.message||String(e.reason||"Async failure")),true));
let gl;try{await ensureAtlasMapLibre();gl=window.maplibregl;}catch(e){say("Map library unavailable: "+e.message,true);return;}
const IMAGERY="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",STREET="https://tiles.openfreemap.org/styles/liberty",CAMERA_BOUNDS=[[85.8,18.3],[94.8,28.8]];
const levels={country:{label:"Country",adm:0},division:{label:"Division",adm:1},district:{label:"District",adm:2},upazila:{label:"Upazila",adm:3},union:{label:"Union",adm:4},ward:{label:"Ward",adm:5}};
const fields={division:["adm1_en","division","division_name","shapeName","name","Division"],district:["adm2_en","district","district_name","shapeName","name","District"],upazila:["adm3_en","upazila","upazila_name","shapeName","name","Upazila"],union:["adm4_en","union_","union","union_name","shapeName","name","Union"],ward:["adm5_en","ward_name","ward","shapeName","name","Ward_Name"]};
const codes={division:["adm1_pcode","pcode","fid","objectid","OBJECTID"],district:["adm2_pcode","pcode","fid","objectid","OBJECTID"],upazila:["geocode","GeoCode","OBJECTID","objectid"],union:["adm4_pcode","pcode","objectid","OBJECTID"],ward:["adm5_pcode","organisationunitid_wd","pcode","objectid","OBJECTID"]};
const cache={},geocodeCache=new Map();
let map=null,language="en",activeLevel="district",country=null,admin=null,records=[],selected=null,searchBusy=false,lastNomRequest=0,waybackCore=null,waybackItems=[],historyIndex=0,playTimer=null,lastPoint=null,pointMarker=null,activeHistoryUrl="",baseMode="satellite",styleSequence=0,clipRings=[],lastClip="";
const searchInput=$("mapSearch"),searchResults=$("searchResults"),slider=$("timelineSlider"),play=$("timelinePlay"),searchForm=$("searchForm");
function norm(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");}
function field(props,candidates){const all=Object.keys(props||{});for(const c of candidates||[]){const k=all.find(x=>norm(x)===norm(c));if(k&&props[k]!==null&&props[k]!==undefined&&String(props[k]).trim())return String(props[k]).trim();}return "";}
function geomBounds(g){const b=[Infinity,Infinity,-Infinity,-Infinity];const walk=v=>{if(!Array.isArray(v))return;if(typeof v[0]==="number"&&typeof v[1]==="number"){b[0]=Math.min(b[0],v[0]);b[1]=Math.min(b[1],v[1]);b[2]=Math.max(b[2],v[0]);b[3]=Math.max(b[3],v[1]);}else v.forEach(walk);};if(g&&g.coordinates)walk(g.coordinates);return b.every(Number.isFinite)?b:null;}
function allBounds(c){const b=[Infinity,Infinity,-Infinity,-Infinity];(c.features||[]).forEach(f=>{const x=geomBounds(f.geometry);if(x){b[0]=Math.min(b[0],x[0]);b[1]=Math.min(b[1],x[1]);b[2]=Math.max(b[2],x[2]);b[3]=Math.max(b[3],x[3]);}});return b.every(Number.isFinite)?b:null;}
function makeRecords(data,level){const out=[];(data.features||[]).forEach((f,i)=>{const p=f.properties||{},name=field(p,fields[level]||[]);if(!name)return;const division=field(p,["adm1_en","division","division_name","Division"]),district=field(p,["adm2_en","district","district_name","District"]),upazila=field(p,["adm3_en","upazila","upazila_name","Upazila"]),union=field(p,["adm4_en","union_","union","union_name","Union"]),ward=field(p,["adm5_en","ward_name","ward","Ward_Name"]),id=field(p,codes[level]||[])||level+"|"+name+"|"+i;f.id=id;f.properties=Object.assign({},p,{__atlasId:id,__atlasName:name});out.push({id,name,bn:field(p,["name_bn","adm"+levels[level].adm+"_bn",level+"_bn"]),level,division,district,upazila,union,ward,path:[division,district,upazila,union,ward].filter(Boolean),bounds:geomBounds(f.geometry),feature:f});});return out;}
async function fetchTimed(url,options,ms,label){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||20000);try{return await fetch(url,{...(options||{}),signal:c.signal});}catch(e){if(e.name==="AbortError")throw new Error(label+" timed out.");throw e;}finally{clearTimeout(t);}}
async function loadLayer(level){if(cache[level])return cache[level];if(!levels[level])throw new Error("Unknown boundary level.");const features=[];let offset=0,pages=0,sourceLabel="",fallbackReason="";while(pages<100){const r=await fetchTimed("/api/map?level="+encodeURIComponent(level)+"&offset="+offset+"&limit=700",{credentials:"same-origin",headers:{Accept:"application/geo+json,application/json"}},35000,levels[level].label+" boundary");const d=await r.json();if(!r.ok)throw new Error(d.error||"Boundary endpoint returned HTTP "+r.status);if(!Array.isArray(d.features))throw new Error("Invalid boundary features.");features.push(...d.features);sourceLabel=d.sourceLabel||sourceLabel;fallbackReason=d.fallbackReason||fallbackReason;pages++;if(!d.hasMore)break;const n=Number(d.nextOffset);if(!Number.isSafeInteger(n)||n<=offset)throw new Error("Boundary pagination failed.");offset=n;}if(pages>=100||!features.length)throw new Error("Boundary layer did not finish loading.");const result={type:"FeatureCollection",features,sourceLabel,fallbackReason,records:level==="country"?[]:makeRecords({features},level)};if(level!=="country"&&!result.records.length)throw new Error("Administrative names could not be read.");cache[level]=result;return result;}
function toWorldRings(geo){const rings=[];function visit(g){if(!g)return;if(g.type==="Polygon")(g.coordinates||[]).forEach(r=>rings.push(r));else if(g.type==="MultiPolygon")(g.coordinates||[]).forEach(p=>(p||[]).forEach(r=>rings.push(r)));else if(g.type==="GeometryCollection")(g.geometries||[]).forEach(visit);}(geo.features||[]).forEach(f=>visit(f.geometry));return rings.map(r=>r.map(c=>{const p=gl.MercatorCoordinate.fromLngLat([c[0],c[1]]);return [p.x,p.y,0];}));}
function makeClipPath(rings,m,width,height){if(!m||!width||!height)return "";const planes=[p=>p[2]-1e-8,p=>p[0]+p[2],p=>p[2]-p[0],p=>p[1]+p[2],p=>p[2]-p[1]],paths=[];for(const ring of rings){if(!ring||ring.length<3)continue;let pts=ring.map(v=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15]]);for(const d of planes){if(!pts.length)break;const out=[];let prev=pts[pts.length-1],a=d(prev);for(const cur of pts){const b=d(cur);if((a>=0)!==(b>=0)){const t=a/(a-b);out.push(prev.map((v,i)=>v+t*(cur[i]-v)));}if(b>=0)out.push(cur);prev=cur;a=b;}pts=out;}let prev=null;const commands=[];for(const p of pts){if(!Number.isFinite(p[2])||p[2]<=1e-8)continue;const q=[(p[0]/p[2]+1)*width/2,(1-p[1]/p[2])*height/2];if(!q.every(Number.isFinite))continue;if(prev&&Math.hypot(q[0]-prev[0],q[1]-prev[1])<.6)continue;commands.push((commands.length?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1));prev=q;}if(commands.length>2)paths.push(commands.join("")+"Z");}return paths.join("");}
function addSilhouette(){if(!country||map.getLayer("bd-silhouette"))return;clipRings=toWorldRings(country);if(!clipRings.length)throw new Error("Bangladesh boundary rings are missing.");map.getCanvas().style.clipPath="inset(100%)";map.addLayer({id:"bd-silhouette",type:"custom",renderingMode:"2d",render:function(args){const c=map.getCanvas(),d=makeClipPath(clipRings,args&&args.modelViewProjectionMatrix,c.clientWidth,c.clientHeight);if(d&&d!==lastClip){c.style.clipPath='path(evenodd, "'+d+'")';lastClip=d;}}});}
function syncLayers(){if(!map||!map.isStyleLoaded())return;if(country&&!map.getSource("bd-country"))map.addSource("bd-country",{type:"geojson",data:{type:"FeatureCollection",features:country.features}});if(country&&!map.getLayer("bd-country-fill"))map.addLayer({id:"bd-country-fill",type:"fill",source:"bd-country",paint:{"fill-color":"#b3ef52","fill-opacity":.012}});if(country&&!map.getLayer("bd-country-line"))map.addLayer({id:"bd-country-line",type:"line",source:"bd-country",paint:{"line-color":"#c5e6b4","line-width":["interpolate",["linear"],["zoom"],4,.8,9,2.2,14,3.2],"line-opacity":.9}});if(admin){const data={type:"FeatureCollection",features:admin.features};if(!map.getSource("bd-admin"))map.addSource("bd-admin",{type:"geojson",data});else map.getSource("bd-admin").setData(data);if(!map.getLayer("bd-admin-fill"))map.addLayer({id:"bd-admin-fill",type:"fill",source:"bd-admin",paint:{"fill-color":["case",["boolean",["feature-state","selected"],false],"#b3ef52","#9bb9a8"],"fill-opacity":["case",["boolean",["feature-state","selected"],false],.2,.035]}});if(!map.getLayer("bd-admin-line"))map.addLayer({id:"bd-admin-line",type:"line",source:"bd-admin",paint:{"line-color":["case",["boolean",["feature-state","selected"],false],"#b3ef52","#dce9d6"],"line-width":["interpolate",["linear"],["zoom"],4,.6,8,1.35,13,2.1],"line-opacity":.92}});}if(activeHistoryUrl&&!map.getSource("bd-history")){map.addSource("bd-history",{type:"raster",tiles:[activeHistoryUrl],tileSize:256,attribution:"Historical imagery © Esri and imagery providers",maxzoom:19});map.addLayer({id:"bd-history-layer",type:"raster",source:"bd-history"});}addSilhouette();}
function featureState(){if(map&&map.getSource("bd-admin"))records.forEach(r=>map.setFeatureState({source:"bd-admin",id:r.id},{selected:!!(selected&&selected.id===r.id)}));}
function setSelected(r){selected=r||null;$("selectedAreaName").textContent=r?r.name:"Bangladesh";$("selectedAreaBn").textContent=r?(r.bn||""):"বাংলাদেশ";$("selectedPath").textContent=r?(r.path.join(" · ")||r.name):"National view · choose an area on the map";}
function selectArea(r,zoom){setSelected(r);featureState();if(zoom&&r.bounds){const b=r.bounds;map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{top:120,bottom:145,left:innerWidth>900?420:100,right:innerWidth>900?95:70},maxZoom:activeLevel==="ward"?16:activeLevel==="union"?13:activeLevel==="upazila"?11:9,duration:matchMedia("(prefers-reduced-motion: reduce)").matches?0:800});}renderSidePanel(activePanel);}
async function switchLevel(level){if(!levels[level]||level==="country")return;activeLevel=level;document.querySelectorAll("[data-level]").forEach(b=>b.classList.toggle("active",b.dataset.level===level));say("Loading "+levels[level].label.toLowerCase()+" boundaries…");try{const data=await loadLayer(level);admin=data;records=data.records||[];["bd-admin-fill","bd-admin-line"].forEach(id=>{if(map.getLayer(id))map.removeLayer(id);});if(map.getSource("bd-admin"))map.removeSource("bd-admin");syncLayers();featureState();const found=selected&&records.find(r=>norm(r.name)===norm(selected.name));if(found)setSelected(found);else if(selected)setSelected(null);say(records.length.toLocaleString()+" "+levels[level].label.toLowerCase()+" areas · "+(data.sourceLabel||"boundary source"));}catch(e){console.error("Boundary load:",e);say("Could not load "+levels[level].label.toLowerCase()+" boundaries: "+e.message,true);}}
function fitBangladesh(animated){const b=country?allBounds(country):null;map.fitBounds(b?[[b[0],b[1]],[b[2],b[3]]]:[[87.85,20.55],[92.75,26.65]],{padding:{top:110,bottom:145,left:105,right:100},maxZoom:7.3,duration:animated?700:0});}
function selectPoint(p,label){const lng=Number(p.lng??p.lon??p[0]),lat=Number(p.lat??p[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return;lastPoint={lng,lat};stopPlayback();waybackItems=[];activeHistoryUrl="";if(map.getLayer("bd-history-layer"))map.removeLayer("bd-history-layer");if(map.getSource("bd-history"))map.removeSource("bd-history");slider.min="0";slider.max="0";slider.value="0";slider.disabled=true;play.disabled=true;$("timelineDate").textContent="Select a point, then load history";$("timelineStart").textContent="2014 archive";$("timelineEnd").textContent="Latest available";updateTimelineProgress();if(pointMarker)pointMarker.remove();const dot=document.createElement("div");dot.className="atlas-map-point";pointMarker=new gl.Marker({element:dot}).setLngLat([lng,lat]).addTo(map);$("historyMeta").textContent=(label||("Selected map point "+lat.toFixed(5)+", "+lng.toFixed(5)))+" · zoom "+map.getZoom().toFixed(1)+". Load imagery history for this point.";$("loadHistory").disabled=false;}
function closeSearch(){searchResults.classList.remove("open");}
function addSearchResult(label,sub,handler){const b=document.createElement("button");b.type="button";b.className="search-result";b.setAttribute("role","option");const i=document.createElement("span");i.className="result-icon";i.textContent="⌖";const c=document.createElement("span");c.className="result-main";c.textContent=label;const s=document.createElement("small");s.textContent=sub||"";c.appendChild(s);b.append(i,c);b.addEventListener("click",()=>{handler();closeSearch();});searchResults.appendChild(b);}
function renderDirectorySearch(q){const key=norm(q);if(!key||key.length<2||!records.length){closeSearch();return;}const found=records.filter(r=>norm(r.name).includes(key));if(!found.length){closeSearch();return;}searchResults.innerHTML="";found.slice(0,8).forEach(r=>addSearchResult(r.name,r.path.join(" · "),()=>selectArea(r,true)));searchResults.classList.add("open");}
async function geocode(q){if(geocodeCache.has(norm(q)))return geocodeCache.get(norm(q));const wait=Math.max(0,1100-(Date.now()-lastNomRequest));if(wait)await new Promise(r=>setTimeout(r,wait));lastNomRequest=Date.now();const query=new URLSearchParams({q:q+", Bangladesh",format:"jsonv2",addressdetails:"1",limit:"7",countrycodes:"bd",viewbox:"87.45,27.45,93.25,19.75",bounded:"1"});const response=await fetchTimed("https://nominatim.openstreetmap.org/search?"+query,{mode:"cors",credentials:"omit",headers:{Accept:"application/json"}},12000,"Place search");if(!response.ok)throw new Error("Place search returned HTTP "+response.status);const result=await response.json();geocodeCache.set(norm(q),result);return result;}
function chooseGeocode(r){const lat=Number(r.lat),lon=Number(r.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return;if(Array.isArray(r.boundingbox)&&r.boundingbox.length===4){const b=r.boundingbox.map(Number);map.fitBounds([[b[2],b[0]],[b[3],b[1]]],{padding:{top:110,bottom:135,left:105,right:85},maxZoom:16,duration:750});}else map.flyTo({center:[lon,lat],zoom:14,duration:750});selectPoint({lng:lon,lat},r.display_name||"Search result");$("selectedAreaName").textContent=r.name||r.display_name.split(",")[0];$("selectedAreaBn").textContent=r.type||"Map search result";$("selectedPath").textContent=r.display_name||"Bangladesh map search result";renderSidePanel(activePanel);}
searchInput.addEventListener("input",()=>renderDirectorySearch(searchInput.value));
searchForm.addEventListener("submit",async e=>{e.preventDefault();const q=searchInput.value.trim();if(!q||searchBusy)return;searchBusy=true;$("searchSubmit").disabled=true;closeSearch();searchResults.innerHTML="";const local=[];Object.keys(cache).forEach(k=>(cache[k].records||[]).forEach(r=>{if(norm(r.name).includes(norm(q)))local.push(r);}));if(local.length){local.slice(0,8).forEach(r=>addSearchResult(r.name,r.path.join(" · "),async()=>{if(activeLevel!==r.level)await switchLevel(r.level);selectArea((cache[r.level].records||[]).find(x=>x.id===r.id)||r,true);}));searchResults.classList.add("open");if(local.length===1){const r=local[0];if(activeLevel!==r.level)await switchLevel(r.level);selectArea((cache[r.level].records||[]).find(x=>x.id===r.id)||r,true);closeSearch();}searchBusy=false;$("searchSubmit").disabled=false;return;}searchResults.innerHTML='<div class="search-help">Searching Bangladesh places…</div>';searchResults.classList.add("open");try{const results=await geocode(q);searchResults.innerHTML="";if(!results.length){const d=document.createElement("div");d.className="search-help";d.textContent="No Bangladesh place matched. Try a nearby town, road, market or landmark.";searchResults.appendChild(d);}else results.forEach(r=>addSearchResult(r.name||r.display_name.split(",")[0],r.display_name,()=>chooseGeocode(r)));}catch(e){const d=document.createElement("div");d.className="search-help";d.textContent="Place search is unavailable. Check your connection or try an administrative area.";searchResults.innerHTML="";searchResults.appendChild(d);}finally{searchBusy=false;$("searchSubmit").disabled=false;}});
document.addEventListener("click",e=>{if(!e.target.closest(".search-area"))closeSearch();});
async function getWayback(){if(!waybackCore)waybackCore=await import("https://esm.sh/@esri/wayback-core?bundle");return waybackCore;}
function updateTimelineProgress(){const max=Number(slider.max)||0,value=Number(slider.value)||0,p=max?value/max*100:0;slider.style.background="linear-gradient(90deg,#2967ff 0%,#2967ff "+p+"%,#d9e0e6 "+p+"%,#d9e0e6 100%)";}
function stopPlayback(){if(playTimer){clearInterval(playTimer);playTimer=null;}play.textContent="▶";}
async function captureMeta(item){if(!lastPoint)return;try{const core=await getWayback(),meta=await core.getMetadata({longitude:lastPoint.lng,latitude:lastPoint.lat},Math.max(map.getZoom(),12),item.releaseNum),date=meta&&meta.date?new Date(meta.date).toISOString().slice(0,10):"Capture date not supplied";$("historyMeta").textContent="Image capture: "+date+" · "+(meta&&meta.provider||"Provider not supplied")+" · "+(meta&&meta.resolution?meta.resolution+" m/pixel":"Resolution not supplied")+" · archive release "+item.releaseDateLabel+".";}catch(e){$("historyMeta").textContent="Capture metadata unavailable · archive release "+item.releaseDateLabel+".";}}
function applyHistory(i,metadata){if(!waybackItems.length)return;historyIndex=Math.max(0,Math.min(i,waybackItems.length-1));const item=waybackItems[historyIndex];slider.value=String(historyIndex);$("timelineDate").textContent=item.releaseDateLabel||item.itemTitle||"Archive version";const url=String(item.itemURL||"").replaceAll("{level}","{z}").replaceAll("{row}","{y}").replaceAll("{col}","{x}");if(!url){$("historyMeta").textContent="No tile URL was supplied for this version.";return;}activeHistoryUrl=url;if(map.isStyleLoaded()){if(map.getLayer("bd-history-layer"))map.removeLayer("bd-history-layer");if(map.getSource("bd-history"))map.removeSource("bd-history");syncLayers();}if(metadata)void captureMeta(item);else $("historyMeta").textContent="Showing archive release "+item.releaseDateLabel+".";updateTimelineProgress();}
async function loadHistory(){if(!lastPoint)return;$("loadHistory").disabled=true;$("loadHistory").textContent="Checking archive…";try{const zoom=Math.max(map.getZoom(),12);if(map.getZoom()<zoom)map.easeTo({center:[lastPoint.lng,lastPoint.lat],zoom,duration:500});const core=await getWayback(),items=await core.getWaybackItemsWithLocalChanges({longitude:lastPoint.lng,latitude:lastPoint.lat},zoom,{onlyUseSizeToFilterDuplicates:true});if(!Array.isArray(items)||!items.length){waybackItems=[];slider.disabled=true;play.disabled=true;$("timelineDate").textContent="No local archive versions";$("historyMeta").textContent="No distinct imagery versions were returned for this point and scale.";return;}waybackItems=items.slice().sort((a,b)=>(a.releaseDatetime||0)-(b.releaseDatetime||0));slider.min="0";slider.max=String(waybackItems.length-1);slider.value=String(waybackItems.length-1);slider.disabled=false;play.disabled=waybackItems.length<2;$("timelineStart").textContent=waybackItems[0].releaseDateLabel||"Oldest available";$("timelineEnd").textContent=waybackItems[waybackItems.length-1].releaseDateLabel||"Latest available";applyHistory(waybackItems.length-1,true);}catch(e){$("timelineDate").textContent="Archive unavailable";$("historyMeta").textContent="Historical imagery could not be loaded. The current map remains available.";}finally{$("loadHistory").disabled=!lastPoint;$("loadHistory").textContent=language==="bn"?"পুরনো ছবি খুঁজুন":"Find imagery history";}}
$("loadHistory").addEventListener("click",loadHistory);slider.addEventListener("input",()=>{stopPlayback();applyHistory(Number(slider.value),true);});play.addEventListener("click",()=>{if(playTimer){stopPlayback();return;}if(waybackItems.length<2)return;play.textContent="Ⅱ";playTimer=setInterval(()=>applyHistory((historyIndex+1)%waybackItems.length,false),1600);});window.addEventListener("beforeunload",stopPlayback);

  const modules={
    overview:{
      title:"Area overview",
      intro:"Explore the selected administrative area and see which public records are available for it.",
      note:"The map can identify geography. It does not by itself identify a government project, payment, contract or audit finding.",
      cards:[
        ["Administrative profile","Area name, parent division and boundary-source information."],
        ["Public assets","Facilities and assets will be shown only when linked to a documented public source."],
        ["Local development","Projects will be listed only when an official record identifies this area."]
      ],
      sources:[]
    },
    budget:{
      title:"Public budget & expenditure",
      intro:"Follow national allocations, revised budgets, reported actual expenditure, releases and development spending.",
      note:"Allocation is not expenditure. A ministry allocation must not be displayed as local district spending unless an accounting record directly supports that location.",
      cards:[
        ["National budget","Budget speech, budget-in-brief, revenue and expenditure statements."],
        ["Ministry allocations","Original allocation, revised allocation and reported actuals kept separate."],
        ["Development expenditure","ADP / RADP, project allocations, releases and reported expenditure."]
      ],
      sources:[
        ["Ministry of Finance","Budget documents and fiscal statements","https://mof.gov.bd/"],
        ["iBAS++","Government financial management system","https://ibas.finance.gov.bd/"]
      ]
    },
    ministries:{
      title:"Ministries & agencies",
      intro:"A directory for ministry mandates, agencies, budget lines, programmes and linked public projects.",
      note:"Ministry-to-area links will appear only when the official record contains a traceable location or project relationship.",
      cards:[
        ["Ministry directory","Official ministry names, portfolios and source documents."],
        ["Agencies","Implementing agencies, statutory bodies and public entities."],
        ["Financial responsibility","Allocation and expenditure lines with fiscal year and accounting basis."]
      ],
      sources:[["Ministry of Finance","Official government finance portal","https://mof.gov.bd/"],["Cabinet Division","Government ministry and division directory","https://cabinet.gov.bd/"]]
    },
    projects:{
      title:"Development projects",
      intro:"Explore projects from approval to implementation, revision, completion, operation or cancellation.",
      note:"A delay, revised cost or missing update is not evidence of corruption. Status changes require an official source and reporting date.",
      cards:[
        ["ADP / RADP projects","Project identity, approved cost, revisions, agency, schedule and annual expenditure."],
        ["Implementation progress","Reported financial progress and physical progress shown separately."],
        ["Lifecycle history","Proposed, approved, ongoing, delayed, suspended, completed or officially discontinued."]
      ],
      sources:[["IMED","Project monitoring and evaluation reports","https://imed.gov.bd/pages/reports"],["Planning Commission","Development plans and programmes","https://plancomm.gov.bd/"]]
    },
    procurement:{
      title:"Public procurement",
      intro:"Connect a project to its official tender, package, award, supplier disclosure and contract amendments.",
      note:"A supplier, tender value, repeated award or contract amendment is not in itself proof of wrongdoing.",
      cards:[
        ["Tender notices","Tender ID, procuring entity, method, publication and closing dates."],
        ["Contract awards","Award amount, supplier when officially published, package and period."],
        ["Amendments","Extensions, variations and change orders, each linked to the source document."]
      ],
      sources:[["BPPA","Public procurement rules, notices and contract information","https://www.bppa.gov.bd/"],["e-GP","Electronic government procurement portal","https://www.eprocure.gov.bd/"]]
    },
    audit:{
      title:"Audit & oversight",
      intro:"Index official audit reports, observations, management responses and follow-up status.",
      note:"An audit observation is not automatically a finding of fraud or criminal wrongdoing. Keep the report wording and response visible.",
      cards:[
        ["Financial audit reports","Report title, entity, fiscal year, page and paragraph reference."],
        ["Audit observations","Amount questioned, if stated, with units and the exact audit context."],
        ["Responses & follow-up","Government response, settlement, recovery or later audit update."]
      ],
      sources:[["CAG Bangladesh","Financial audit reports","https://cag.org.bd/audit/financial-audit-reports"]]
    },
    environment:{
      title:"Environment & public commitments",
      intro:"Track environmental programmes, forest commitments, tree-planting pledges and verified follow-up.",
      note:"A reported sapling planted is not the same as a tree verified to have survived. Do not combine overlapping programmes without reconciliation.",
      cards:[
        ["Tree commitments","Exact official promise, responsible entity, target and announcement date."],
        ["Planting and survival","Reported planted, checked and independently observed surviving counts kept separate."],
        ["Environmental assets","Protected areas, rivers, forests and restoration locations with source and dataset date."]
      ],
      sources:[["Department of Environment","Official environment information","https://doe.gov.bd/"],["Forest Department","Forest and protected-area information","https://bforest.gov.bd/"]]
    },
    indicators:{
      title:"Bangladesh in the world",
      intro:"Compare Bangladesh indicators with international datasets using matched years, definitions and units.",
      note:"Every value needs a source, observation period, publication date, unit and status as observed, estimated or projected.",
      cards:[
        ["Economy & public finance","GDP, revenue, debt and spending indicators."],
        ["Health & education","Coverage, outcomes, access and quality indicators."],
        ["Environment & infrastructure","Energy, water, transport, forests and climate indicators."]
      ],
      sources:[["Bangladesh Bureau of Statistics","National statistics","https://bbs.gov.bd/"],["World Bank Data","International development indicators","https://data.worldbank.org/country/bangladesh"]]
    },
    sources:{
      title:"Source register",
      intro:"A central list of original public sources used to build the atlas. A link does not mean the data has been extracted or verified.",
      note:"For each published record, keep the source title, URL, publication date, fiscal year, page or table, unit, reviewer and correction history.",
      cards:[
        ["Traceable records","Every figure must link to an original source."],
        ["Review status","Separate collected, extracted, reviewed and independently corroborated records."],
        ["Corrections","Preserve old values, correction date, reason and source."]
      ],
      sources:[
        ["Ministry of Finance","Budget and fiscal documents","https://mof.gov.bd/"],
        ["iBAS++","Government accounting and financial system","https://ibas.finance.gov.bd/"],
        ["Planning Commission","Development planning and ADP","https://plancomm.gov.bd/"],
        ["IMED","Project monitoring reports","https://imed.gov.bd/pages/reports"],
        ["CAG Bangladesh","Financial audit reports","https://cag.org.bd/audit/financial-audit-reports"],
        ["BPPA","Public procurement authority","https://www.bppa.gov.bd/"],
        ["e-GP","Electronic procurement portal","https://www.eprocure.gov.bd/"],
        ["BBS","National statistics","https://bbs.gov.bd/"],
        ["World Bank Data","International indicators","https://data.worldbank.org/country/bangladesh"]
      ]
    }
  };
  let activePanel="overview";
  function renderSidePanel(key){
    activePanel=modules[key]?key:"overview";
    document.querySelectorAll(".sidebar-tab").forEach(button=>
      button.classList.toggle("active",button.dataset.panel===activePanel)
    );
    const module=modules[activePanel];
    const selected=el("selectedAreaName").textContent;
    let html='<h2>'+module.title+'</h2><p class="side-intro">'+module.intro+'</p>';
    html+='<div class="data-status"><span class="status-icon">i</span><span>Prototype status: verified records for this section are not connected yet. Values will remain blank until sourced and reviewed.</span></div>';
    if(activePanel!=="overview")html+='<div class="data-card"><strong>Map context: '+escapeHtml(selected)+'</strong><p>Records shown here must have a documented relationship to this geography. National or ministry-level figures will not be presented as local spending.</p></div>';
    (module.cards||[]).forEach(card=>{
      html+='<div class="data-card"><strong>'+card[0]+'</strong><p>'+card[1]+'</p><p><b style="color:#916b26">No reviewed records published yet</b></p></div>';
    });
    if(module.sources&&module.sources.length){
      html+='<h3>Original public sources</h3><div class="data-source-list">';
      module.sources.forEach(source=>{
        html+='<a class="data-source" href="'+source[2]+'" target="_blank" rel="noopener"><span>'+source[0]+'<small>'+source[1]+'</small></span><span class="source-arrow">↗</span></a>';
      });
      html+='</div>';
    }
    html+='<div class="method-note">'+module.note+'</div>';
    el("sideContent").innerHTML=html;
  }

const card=document.querySelector(".sidebar .selected-area");if(card){const area=document.querySelector(".map-area");area.insertBefore(card,area.querySelector(".map-levels"));}
document.querySelectorAll(".sidebar-tab").forEach(b=>b.addEventListener("click",()=>renderSidePanel(b.dataset.panel)));
document.querySelectorAll("[data-level]").forEach(b=>b.addEventListener("click",()=>switchLevel(b.dataset.level)));
document.querySelectorAll("[data-rail-panel]").forEach(b=>b.addEventListener("click",()=>{renderSidePanel(b.dataset.railPanel);document.body.classList.remove("sidebar-collapsed");}));
$("sidebarToggle").addEventListener("click",()=>{document.body.classList.toggle("sidebar-collapsed");setTimeout(()=>map&&map.resize(),250);});
$("languageToggle").addEventListener("click",()=>{language=language==="en"?"bn":"en";document.documentElement.lang=language;document.querySelectorAll("[data-en][data-bn]").forEach(n=>n.textContent=n.getAttribute("data-"+language));$("languageToggle").textContent=language==="en"?"বাংলা":"English";searchInput.placeholder=language==="en"?"Search a place, road, market or area in Bangladesh…":"বাংলাদেশে স্থান, সড়ক, বাজার বা এলাকা খুঁজুন…";renderSidePanel(activePanel);});
$("zoomIn").addEventListener("click",()=>map&&map.zoomIn({duration:250}));$("zoomOut").addEventListener("click",()=>map&&map.zoomOut({duration:250}));$("fitBangladesh").addEventListener("click",()=>fitBangladesh(true));
$("perspectiveToggle").addEventListener("click",()=>{if(!map)return;const tilt=map.getPitch()>20;map.easeTo({pitch:tilt?0:42,bearing:tilt?0:-8,duration:650});$("perspectiveToggle").classList.toggle("active",!tilt);});
function satelliteStyle(){return {version:8,sources:{"bd-imagery":{type:"raster",tiles:[IMAGERY],tileSize:256,attribution:"Satellite imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community"}},layers:[{id:"bd-imagery-layer",type:"raster",source:"bd-imagery",minzoom:0,maxzoom:19}]};}
function changeBase(mode){if(!map||mode===baseMode)return;baseMode=mode;const seq=++styleSequence;$("satelliteToggle").classList.toggle("active",mode==="satellite");$("outlineToggle").classList.toggle("active",mode==="streets");say(mode==="satellite"?"Switching to satellite imagery…":"Switching to street map…");map.setStyle(mode==="satellite"?satelliteStyle():STREET);map.once("style.load",()=>{if(seq!==styleSequence)return;syncLayers();featureState();say(mode==="satellite"?"Satellite imagery · clipped to Bangladesh":"Street map · clipped to Bangladesh");});}
$("satelliteToggle").addEventListener("click",()=>changeBase("satellite"));$("outlineToggle").addEventListener("click",()=>changeBase("streets"));
function fitBangladesh(animated){const b=country?allBounds(country):null;map.fitBounds(b?[[b[0],b[1]],[b[2],b[3]]]:[[87.85,20.55],[92.75,26.65]],{padding:{top:110,bottom:145,left:105,right:100},maxZoom:7.3,duration:animated?700:0});}
async function getCountry(){try{country=await loadLayer("country");return "country";}catch(e){say("National boundary unavailable; trying division outlines…",true);country=await loadLayer("division");return "division-fallback";}}
async function start(){
 say("Starting Bangladesh map…");map=new gl.Map({container:"map",style:satelliteStyle(),center:[90.35,23.72],zoom:5.8,minZoom:4.7,maxZoom:19,maxPitch:52,renderWorldCopies:false,attributionControl:{compact:true},antialias:true,cooperativeGestures:true});
 window.atlasMap=map;map.getCanvas().style.clipPath="inset(100%)";
 map.on("error",e=>{const x=e&&e.error;if(x&&(x.status===401||x.status===403))say("Imagery provider denied this request. Switch to street map.",true);});
 map.on("webglcontextlost",()=>say("Map graphics context lost. Reload the page.",true));map.on("style.load",syncLayers);
 map.on("load",async()=>{try{
  say("Loading Bangladesh boundary…");const mode=await getCountry();
  if(!CSS.supports("clip-path",'path(evenodd, "M0 0L10 0L10 10Z")'))throw new Error("This browser does not support the country-only map view.");
  syncLayers();fitBangladesh(false);map.setMinZoom(Math.max(4.6,Math.min(6.2,map.getZoom()-.25)));map.setMaxBounds(CAMERA_BOUNDS);
  say(mode==="country"?"Loading district boundaries…":"Using division outlines as the national silhouette fallback.");
  await switchLevel("district");say("Bangladesh map ready · select an area or search for a place.");
  setTimeout(()=>{if(status.textContent.includes("map ready"))say("");},4500);renderSidePanel("overview");
 }catch(e){console.error("Map start:",e);map.getCanvas().style.clipPath="inset(100%)";say("Bangladesh map could not load safely: "+e.message,true);}});
 map.on("click",e=>{if(!country)return;const hits=map.queryRenderedFeatures(e.point,{layers:["bd-country-fill"]});if(!hits.length)return;const f=map.queryRenderedFeatures(e.point,{layers:["bd-admin-fill","bd-admin-line"]})[0];if(f){const r=records.find(x=>String(x.id)===String(f.properties&&f.properties.__atlasId));if(r){selectArea(r,true);return;}}selectPoint({lng:e.lngLat.lng,lat:e.lngLat.lat});renderSidePanel(activePanel);});
 window.addEventListener("resize",()=>map&&map.resize());
}
renderSidePanel("overview");start().catch(e=>say("Map initialisation failed: "+e.message,true));
})();
