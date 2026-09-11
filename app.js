const STORE={name:"Perro Flow",whatsapp:"51999999999"};
const PRODUCTS=[
{id:1,name:"Netflix",cat:"Streaming",price:10.50,period:"30 días",desc:"Perfil premium para disfrutar de tus contenidos.",icon:"N",accent:"#ff1838"},
{id:2,name:"Prime Video",cat:"Streaming",price:8,period:"30 días",desc:"Series, películas y entretenimiento.",icon:"P",accent:"#00a8e1"},
{id:3,name:"Disney+",cat:"Streaming",price:8.50,period:"30 días",desc:"Entretenimiento para toda la familia.",icon:"D+",accent:"#2588ff"},
{id:4,name:"HBO Max",cat:"Streaming",price:10,period:"30 días",desc:"Series, películas y contenido premium.",icon:"M",accent:"#7650ff"},
{id:5,name:"Spotify Premium",cat:"Música",price:8,period:"30 días",desc:"Música sin interrupciones y más.",icon:"S",accent:"#20d66b"},
{id:6,name:"Canva Premium",cat:"Software",price:7,period:"30 días",desc:"Herramientas premium para tus diseños.",icon:"C",accent:"#31d5cf"},
{id:7,name:"Gaming Pass",cat:"Gaming",price:12,period:"30 días",desc:"Una opción digital para tus sesiones de gaming.",icon:"G",accent:"#a05cff"},
{id:8,name:"YouTube Premium",cat:"Streaming",price:9,period:"30 días",desc:"Contenido y experiencia premium.",icon:"▶",accent:"#ff2538"}
];
let category="Todos";
let balance=Number(localStorage.getItem("pf_balance")||0);
let user=JSON.parse(localStorage.getItem("pf_user")||"null");
const $=s=>document.querySelector(s);
function money(n){return `S/ ${n.toFixed(2)}`}
function updateBalance(){["#navBalance","#bigBalance"].forEach(s=>$(s).textContent=money(balance))}
function save(){localStorage.setItem("pf_balance",balance.toFixed(2)); if(user)localStorage.setItem("pf_user",JSON.stringify(user)); updateBalance()}
function renderCats(){
 const cats=["Todos","Streaming","Música","Gaming","Software"];
 $("#cats").innerHTML=cats.map(c=>`<button class="cat ${c===category?"active":""}" data-cat="${c}">${c==="Todos"?"✦":c==="Streaming"?"📺":c==="Música"?"🎵":c==="Gaming"?"🎮":"💻"} ${c}</button>`).join("");
 document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderCats();renderProducts()});
}
function renderProducts(){
 const q=$("#search").value.toLowerCase();
 const list=PRODUCTS.filter(p=>(category==="Todos"||p.cat===category)&&`${p.name} ${p.cat} ${p.desc}`.toLowerCase().includes(q));
 $("#products").innerHTML=list.map(p=>`<article class="product"><div class="art" style="--a:${p.accent}"><span class="tag">${p.cat}</span>${p.icon}</div><div class="pbody"><h3>${p.name}</h3><p>${p.desc}</p><div class="pbottom"><div class="price">${money(p.price)} <small>/ ${p.period}</small></div><button class="buy" data-id="${p.id}">Comprar</button></div></div></article>`).join("");
 document.querySelectorAll(".buy").forEach(b=>b.onclick=()=>buy(Number(b.dataset.id)));
}
function openModal(content){$("#modalContent").innerHTML=content;$("#modal").classList.add("show")}
function buy(id){
 const p=PRODUCTS.find(x=>x.id===id);
 openModal(`<label>🛒 COMPRA</label><h2>${p.name}</h2><p>${p.desc}</p><div class="status">Precio: <b>${money(p.price)}</b> · ${p.period}<br>Saldo disponible: <b>${money(balance)}</b></div><div class="modal-actions"><button class="btn primary full" id="confirmBuy">Comprar con mi saldo</button><button class="btn dark full" id="buyWA">Consultar por WhatsApp</button></div>`);
 $("#confirmBuy").onclick=()=>{
   if(balance<p.price){alert("Saldo insuficiente. Recarga tu billetera desde S/ 3.00.");return}
   balance-=p.price;save();
   openModal(`<label>✅ COMPRA REGISTRADA</label><h2>¡Pedido recibido!</h2><p>Se descontaron <b>${money(p.price)}</b> de tu saldo. Ahora puedes coordinar la entrega del servicio.</p><div class="status">Nuevo saldo: <b>${money(balance)}</b></div><div class="modal-actions"><button class="btn primary full" id="done">Listo</button></div>`);
   $("#done").onclick=()=>$("#modal").classList.remove("show");
 };
 $("#buyWA").onclick=()=>window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hola Perro Flow, quiero información sobre "+p.name+".")}`,"_blank");
}
function auth(){
 openModal(`<label>👤 CUENTA PERRO FLOW</label><h2>${user?"Mi cuenta":"Crear cuenta / Iniciar sesión"}</h2>
 ${user?`<p>Hola, <b>${user.name}</b> 👋</p><div class="status">Saldo actual: <b>${money(balance)}</b></div><div class="modal-actions"><button class="btn primary full" id="accRecharge">💳 Recargar saldo</button><button class="btn dark full" id="logout">Cerrar sesión</button></div>`:
 `<div class="field"><label>NOMBRE</label><input id="name" placeholder="Tu nombre"></div><div class="field"><label>CELULAR O CORREO</label><input id="contact" placeholder="Tu celular o correo"></div><div class="field"><label>CONTRASEÑA</label><input id="pass" type="password" placeholder="Contraseña"></div><div class="modal-actions"><button class="btn primary full" id="register">Crear cuenta</button></div><p>Esta versión gratuita funciona como demo local. Para cuentas reales multiusuario se conecta después a una base de datos.</p>`}`);
 if(user){$("#accRecharge").onclick=showRecharge;$("#logout").onclick=()=>{user=null;localStorage.removeItem("pf_user");$("#modal").classList.remove("show")}}
 else $("#register").onclick=()=>{const n=$("#name").value.trim();if(!n)return alert("Escribe tu nombre.");user={name:n,contact:$("#contact").value};save();auth()}
}
function showRecharge(){
 openModal(`<label>💳 RECARGA AUTOMÁTICA</label><h2>Recarga desde S/ 3.00</h2><p>Realiza tu transferencia y luego valida el movimiento.</p><div class="status">Canal de recarga: <b>Yape / BCP</b></div><div class="qrbox">COLOCA AQUÍ<br>TU QR DE YAPE</div><div class="field"><label>TITULAR</label><input value="TU NOMBRE" readonly></div><div class="field"><label>CELULAR</label><input value="+51 XXX XXX XXX" readonly></div><button class="btn primary full" id="transferred">✓ Ya transferí</button>`);
 $("#transferred").onclick=validateRecharge;
}
function validateRecharge(){
 openModal(`<label>🏦 VALIDAR RECARGA</label><h2>Validar recarga</h2><p>Completa los datos y envía tu solicitud.</p><div class="field"><label>¿DESDE DÓNDE TRANSFERISTE?</label><select id="bank"><option>YAPE / BCP</option><option>OTRO BANCO</option></select></div><div class="field"><label>PRIMER NOMBRE DEL TITULAR</label><input id="holder" placeholder="Ingresa el dato"></div><div class="field"><label>MONTO EXACTO TRANSFERIDO EN SOLES (PEN)</label><input id="amount" type="number" min="3" step="0.01" placeholder="3.00"></div><div class="status">La recarga real debe ser confirmada por el sistema de pagos o por el administrador. Esta demo no inventa confirmaciones.</div><button class="btn primary full" id="sendValidation">Enviar para validación</button>`);
 $("#sendValidation").onclick=()=>{const a=Number($("#amount").value);if(a<3)return alert("El monto mínimo es S/ 3.00.");openModal(`<label>🟡 SOLICITUD ENVIADA</label><h2>Pago pendiente</h2><p>Tu solicitud de <b>${money(a)}</b> quedó registrada para validación.</p><div class="status">Estado: <b>En revisión</b><br>Cuando el pago sea confirmado, el saldo podrá acreditarse.</div><button class="btn dark full" id="closePending">Cerrar</button>`);$("#closePending").onclick=()=>$("#modal").classList.remove("show")}
}
$("#loginBtn").onclick=auth;$("#walletBtn").onclick=()=>user?showRecharge():auth();$("#rechargeBtn").onclick=()=>user?showRecharge():auth();$("#heroRecharge").onclick=()=>user?showRecharge():auth();
$("#search").oninput=renderProducts;$("#close").onclick=()=>$("#modal").classList.remove("show");$("#modal").onclick=e=>{if(e.target.id==="modal")$("#modal").classList.remove("show")};
$("#hamb").onclick=()=>{const n=$("#mainNav");n.style.display=n.style.display==="flex"?"none":"flex";n.style.flexDirection="column";n.style.position="absolute";n.style.top="65px";n.style.left="10px";n.style.right="10px";n.style.padding="12px";n.style.background="#0c0813";n.style.border="1px solid #2b1747";n.style.borderRadius="15px"};
const wa=`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hola Perro Flow, quiero información sobre sus servicios.")}`;$("#wa").href=wa;$("#footerWA").href=wa;$("#year").textContent=new Date().getFullYear();updateBalance();renderCats();renderProducts();
