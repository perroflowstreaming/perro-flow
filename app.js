const SUPABASE_URL = "https://loacrejdpgrdocbk gmap.supabase.co".replace(" ", "");
const SUPABASE_KEY = "sb_publishable_H6VCKhEcK2_lFQNNsxqQTQ_iIpuFX9g";
const WA = "51999999999";
const KEY = "perroflow_v3";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];
let categories = [];
let active = "Todos";
let imageData = "";
let editingId = "";
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const money = n => "S/ " + Number(n || 0).toFixed(2);

function toUi(p){
  const cat = categories.find(c => c.identificación === p["ID de categoría"] || c.id === p["ID de categoría"]);
  return {
    id: p.identificación,
    sku: p.sku,
    name: p.nombre,
    price: p.precio,
    duration: p.duración,
    category: cat?.nombre || "Otros",
    categoryId: p["ID de categoría"],
    availability: p.disponibilidad,
    renewable: p.renovable,
    featured: p.presentado,
    purchaseLimit: p.límite_de_compra,
    image: p["URL de la imagen"],
    short: p.descripción_corta,
    full: p.descripción,
    terms: p.términos,
    published: p.publicado
  };
}

async function loadCategories(){
  const {data,error}=await sb.from("categorías").select("*").order("nombre");
  if(error){ console.error(error); return; }
  categories=data||[];
  const sel=$("category");
  if(sel){
    const current=sel.value;
    sel.innerHTML=categories.map(c=>`<option value="${esc(c.identificación)}">${esc(c.nombre)}</option>`).join("");
    if(current && [...sel.options].some(o=>o.value===current)) sel.value=current;
  }
}

async function loadProducts(){
  const {data,error}=await sb.from("productos").select("*").eq("publicado",true).order("creado_en",{ascending:false});
  if(error){ console.error(error); $("grid").innerHTML="<p class='note'>No se pudieron cargar los productos. Revisa la conexión con Supabase.</p>"; return; }
  products=(data||[]).map(toUi);
  render();
}

async function loadAdminProducts(){
  const {data,error}=await sb.from("productos").select("*").order("creado_en",{ascending:false});
  if(error){ $("adminList").innerHTML="<p class='note'>No se pudo cargar el panel. Inicia sesión como administradora.</p>"; return; }
  products=(data||[]).map(toUi);
  renderAdmin();
}

function wa(p){return "https://wa.me/"+WA+"?text="+encodeURIComponent("Hola, quiero comprar "+p.name+" por "+money(p.price));}

function render(){
  let cats=["Todos",...new Set(products.map(p=>p.category).filter(Boolean))];
  $("cats").innerHTML=cats.map(c=>`<button class="cat ${c===active?"active":""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{active=b.dataset.c;render()});
  let q=$("search").value.toLowerCase();
  let list=products.filter(p=>(active==="Todos"||p.category===active)&&(`${p.name} ${p.short} ${p.category}`).toLowerCase().includes(q));
  $("grid").innerHTML=list.map(p=>`<article class="card"><div>${p.image?`<img class="card-img" src="${p.image}" alt="${esc(p.name)}">`:`<div class="noimg">📦</div>`}</div><div class="body"><span class="tag">${esc(p.category)}</span>${p.featured?` <span class="tag">★ Destacado</span>`:""}<h3>${esc(p.name)}</h3><p>${esc(p.short||"Producto digital")}</p><div class="price">${money(p.price)} <small>${p.duration?"/ "+esc(p.duration):""}</small></div><a class="btn buy" href="${wa(p)}" target="_blank" rel="noopener">Comprar</a></div></article>`).join("");
  $("empty").style.display=list.length?"none":"block";
}

function renderAdmin(){
  $("adminList").innerHTML=products.length?products.map(p=>`<div class="row"><img src="${p.image||""}" alt=""><div class="info"><b>${esc(p.name)}</b><br><small>${money(p.price)} · ${esc(p.duration||"sin duración")} · ${esc(p.category)} · ${p.published===false?"Oculto":"Publicado"}</small></div><button class="edit" onclick="editProduct('${p.id}')">Editar</button><button class="delete" onclick="removeProduct('${p.id}')">Eliminar</button></div>`).join(""):"<p class='note'>No has creado productos todavía.</p>";
}

async function isAdmin(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return false;
  const {data,error}=await sb.from("perfiles").select("rol").eq("identificación",user.id).maybeSingle();
  return !error && data?.rol === "admin";
}

async function showAdmin(){
  const ok=await isAdmin();
  if(!ok){
    alert("Debes iniciar sesión como administradora para usar este panel.");
    location.hash="tienda";
    return false;
  }
  $("admin").style.display="block";
  await loadAdminProducts();
  return true;
}

$("search").addEventListener("input",render);
$("image").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;if(f.size>1500000){alert("La imagen debe pesar menos de 1.5 MB.");e.target.value="";return;}const r=new FileReader();r.onload=()=>{imageData=r.result;$("preview").src=imageData;$("previewBox").classList.remove("hidden")};r.readAsDataURL(f)});

$("form").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!(await isAdmin())){alert("No tienes permisos de administrador.");return;}
  const payload={
    sku:$("sku").value.trim()||null,
    nombre:$("name").value.trim(),
    precio:Number($("price").value),
    duración:$("duration").value.trim()||null,
    "ID de categoría":$("category").value||null,
    disponibilidad:$("availability").value,
    renovable:$("renewable").checked,
    presentado:$("featured").checked,
    "URL de la imagen":imageData||null,
    descripción_corta:$("short").value.trim(),
    descripción:$("full").value.trim()||null,
    términos:$("terms").value.trim()||null,
    publicado:$("published").checked
  };
  if(!payload["URL de la imagen"] && !editingId){alert("Sube una imagen del producto.");return;}
  let result;
  if(editingId){
    if(!payload["URL de la imagen"]){
      const old=products.find(p=>p.id===editingId); payload["URL de la imagen"]=old?.image||null;
    }
    result=await sb.from("productos").update(payload).eq("identificación",editingId);
  }else{
    result=await sb.from("productos").insert(payload);
  }
  if(result.error){alert("No se pudo guardar: "+result.error.message);return;}
  alert("Producto guardado correctamente en Supabase.");
  reset();
  await loadAdminProducts();
  await loadProducts();
  location.hash="tienda";
});

function reset(){$("form").reset();editingId="";imageData="";$('previewBox').classList.add('hidden');$('save').textContent='Guardar y publicar';}
window.editProduct=async id=>{if(!(await isAdmin()))return;const {data,error}=await sb.from("productos").select("*").eq("identificación",id).single();if(error){alert(error.message);return;}const p=toUi(data);editingId=p.id;$("id").value=p.id;$("sku").value=p.sku||"";$("name").value=p.name||"";$("price").value=p.price||0;$("duration").value=p.duration||"";$("category").value=p.categoryId||"";$("availability").value=p.availability||"En stock";$("renewable").checked=!!p.renewable;$("featured").checked=!!p.featured;$("short").value=p.short||"";$("full").value=p.full||"";$("terms").value=p.terms||"";$("published").checked=p.published!==false;imageData=p.image||"";if(imageData){$("preview").src=imageData;$("previewBox").classList.remove("hidden")};$("save").textContent="Guardar cambios";location.hash="admin";};
window.removeProduct=async id=>{if(!(await isAdmin()))return;if(confirm("¿Eliminar este producto?")){const {error}=await sb.from("productos").delete().eq("identificación",id);if(error)alert(error.message);else{await loadAdminProducts();await loadProducts();}}};
$("cancel").onclick=reset;
$("waTop").href="https://wa.me/"+WA;

(async()=>{await loadCategories();await loadProducts();$("admin").style.display="none";window.addEventListener("hashchange",()=>{if(location.hash==="#admin")showAdmin();});if(location.hash==="#admin")showAdmin();})();
