/* script.js - TastyTales 3.0 single-file client app */

/* ========== Config / Storage keys ========== */
const LS_KEY = 'tastytales3.recipes.v1';
const USER_KEY = 'tastytales3.user.v1';

/* ========== EmailJS placeholders - REPLACE with your actual IDs ========== */
const EMAILJS_USER_ID = 'REPLACE_WITH_EMAILJS_USER_ID';
const EMAILJS_SERVICE_ID = 'REPLACE_WITH_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'REPLACE_WITH_EMAILJS_TEMPLATE_ID';

/* initialize EmailJS if present */
if(window.emailjs && EMAILJS_USER_ID !== 'REPLACE_WITH_EMAILJS_USER_ID'){
  emailjs.init(EMAILJS_USER_ID);
}

/* ========== Initial demo recipes ========== */
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1432139509613-5c4255815697?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=2e0a6d5ed3f69a9a0d5f3d9a30b2f8e9',
  'https://images.unsplash.com/photo-1545030420-6f8e8aa4b3d7?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3a1b7d9b5b9f4d0a4e3b5c92b5e8a0f2',
  'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=77ad7d4e6a3b2f1c0d1e5a3f2b6e7c8d',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=6f7e8b0cd8a4b2f6bcd4e1a2c8b7d5e0',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=8a5a72b7c3e1a24d2b4a9e6f0c3d2b1f'
];

let recipes = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
if(!recipes || recipes.length === 0){
  recipes = [
    { id: idNow(), name:'Citrus Pancakes', tag:'Breakfast', ingredients:['Flour','Milk','Egg','Orange zest'], steps:['Mix ingredients','Pan fry 2 min each side'], img:SAMPLE_IMAGES[1], time:18, fav:true, createdAt: Date.now() },
    { id: idNow(), name:'Spicy Tomato Curry', tag:'Lunch', ingredients:['Tomato','Onion','Chili','Spices'], steps:['Saute onion','Add tomato & simmer 20 mins'], img:SAMPLE_IMAGES[0], time:30, fav:false, createdAt: Date.now() },
    { id: idNow(), name:'Avocado Salad', tag:'Salad', ingredients:['Avocado','Lettuce','Lemon','Salt'], steps:['Chop veggies','Mix & dress'], img:SAMPLE_IMAGES[2], time:10, fav:false, createdAt: Date.now() }
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(recipes));
}

/* ========== UI refs ========== */
const bubblesEl = document.getElementById('bubbles');
const favListEl = document.getElementById('favList');
const detailPanel = document.getElementById('detailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailImg = document.getElementById('detailImg');
const detailIngs = document.getElementById('detailIngs');
const detailSteps = document.getElementById('detailSteps');
const detailTags = document.getElementById('detailTags');

const modalWrap = document.getElementById('modalWrap');
const form = document.getElementById('recipeForm');
const rName = document.getElementById('rName');
const rTag = document.getElementById('rTag');
const rIngs = document.getElementById('rIngs');
const rSteps = document.getElementById('rSteps');
const rImg = document.getElementById('rImg');
const rTime = document.getElementById('rTime');
const cancelBtn = document.getElementById('cancelBtn');

const fab = document.getElementById('fab');
const addTop = document.getElementById('addTop'); // may be undefined if not present
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');
const surpriseBtn = document.getElementById('surpriseBtn');
const exportBtn = document.getElementById('exportBtn');

const loginWrap = document.getElementById('loginWrap');
const loginBtn = document.getElementById('loginBtn');
const loginClose = document.getElementById('loginClose');
const doLogin = document.getElementById('doLogin');
const doRegister = document.getElementById('doRegister');
const loginName = document.getElementById('loginName');
const loginEmail = document.getElementById('loginEmail');
const userNameEl = document.getElementById('userName');

const editBtn = document.getElementById('editRecipeBtn');
const deleteBtn = document.getElementById('deleteRecipeBtn');
const favToggleBtn = document.getElementById('favToggleBtn');
const closeDetailBtn = document.getElementById('closeDetail');

/* state */
let currentViewId = null; // id of recipe shown in detail
let editingId = null; // id of recipe being edited (in modal)
let user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');

/* ========== Helpers ========== */
function idNow(){ return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function persist(){ localStorage.setItem(LS_KEY, JSON.stringify(recipes)); }
function saveUser(u){ localStorage.setItem(USER_KEY, JSON.stringify(u)); user = u; updateUserUI(); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ========== Initial UI setup ========== */
updateUserUI();
renderAll();

/* ========== Event bindings ========== */
fab.addEventListener('click', ()=> openModal());
if(addTop) addTop.addEventListener('click', ()=> openModal());
cancelBtn.addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('loginClose').addEventListener('click', ()=> { loginWrap.style.display='none'; });
loginBtn.addEventListener('click', ()=> { loginWrap.style.display='flex'; });
doLogin.addEventListener('click', doQuickLogin);
doRegister.addEventListener('click', doQuickRegister);
form.addEventListener('submit', onSaveRecipe);
searchInput.addEventListener('input', ()=> renderAll(searchInput.value));
surpriseBtn.addEventListener('click', surpriseMe);
exportBtn.addEventListener('click', exportJSON);
closeDetailBtn.addEventListener('click', ()=> { detailPanel.classList.remove('open'); currentViewId=null; });

editBtn.addEventListener('click', ()=> { if(currentViewId) { openModal(currentViewId); }});
deleteBtn.addEventListener('click', ()=> { if(!currentViewId) return; if(confirm('Delete recipe?')) { recipes = recipes.filter(r=>r.id !== currentViewId); persist(); renderAll(); detailPanel.classList.remove('open'); showToast('Deleted'); }});
favToggleBtn.addEventListener('click', ()=> { if(!currentViewId) return; const r = recipes.find(x=>x.id===currentViewId); r.fav = !r.fav; persist(); renderAll(); favToggleBtn.textContent = r.fav ? '★ Favorite' : '☆ Favorite'; });

/* ========== Functions: render, open, modal ========== */
function renderAll(filter=''){
  bubblesEl.innerHTML=''; favListEl.innerHTML='';
  const q = filter.trim().toLowerCase();

  recipes.forEach((r, idx) => {
    const hay = (r.name + ' ' + (r.tag||'') + ' ' + (r.ingredients||[]).join(' ')).toLowerCase();
    if(q && !hay.includes(q)) return;

    const bubble = document.createElement('div'); bubble.className='bubble'; bubble.dataset.id = r.id;
    bubble.innerHTML = `
      <div class="food"><img src="${r.img || placeholder(r.name)}" alt="${escapeHtml(r.name)}" /></div>
      <h4>${escapeHtml(r.name)}</h4>
      <div class="meta"><div class="chip">${escapeHtml(r.tag || 'General')}</div><div style="margin-left:auto;color:rgba(0,0,0,0.6)">${r.time? r.time+'m':''}</div></div>
    `;
    bubble.addEventListener('click', ()=> openDetail(r.id));
    bubblesEl.appendChild(bubble);

    // GSAP entry + gentle levitation
    gsap.from(bubble, {y:18, opacity:0, duration:0.6, delay: idx*0.04, ease:'power3.out'});
    gsap.to(bubble, {y:'-=6', repeat:-1, yoyo:true, duration:2.6 + Math.random(), ease:'sine.inOut', delay: idx*0.06});
  });

  // favorites list
  recipes.filter(x=>x.fav).forEach(x => {
    const d = document.createElement('div'); d.textContent = x.name; d.style.padding='6px 0';
    favListEl.appendChild(d);
  });
}

function openDetail(id){
  currentViewId = id;
  const r = recipes.find(x=>x.id === id);
  if(!r) return;
  detailTitle.textContent = r.name;
  detailImg.src = r.img || placeholder(r.name);
  detailIngs.innerHTML = (r.ingredients||[]).map(it => `<li>${escapeHtml(it)}</li>`).join('');
  detailSteps.innerHTML = (r.steps||[]).map(st => `<li>${escapeHtml(st)}</li>`).join('');
  detailTags.innerHTML = `<div class="chip">${escapeHtml(r.tag || 'General')}</div>`;
  favToggleBtn.textContent = r.fav ? '★ Favorite' : '☆ Favorite';
  detailPanel.classList.add('open');
  gsap.fromTo(detailPanel, {x:40, opacity:0}, {x:0, opacity:1, duration:0.32});
}

function openModal(editId = null){
  editingId = editId;
  if(editId){
    const r = recipes.find(x=>x.id===editId);
    rName.value = r.name;
    rTag.value = r.tag || '';
    rIngs.value = (r.ingredients||[]).join('\n');
    rSteps.value = (r.steps||[]).join('\n');
    rTime.value = r.time || '';
  } else {
    form.reset();
  }
  modalWrap.style.display = 'flex';
  gsap.fromTo('.modal', {y:20, opacity:0}, {y:0, opacity:1, duration:0.34});
}

function closeModal(){
  gsap.to('.modal', {y:18, opacity:0, duration:0.22, onComplete: ()=> modalWrap.style.display='none'});
}

/* ========== Save recipe handler ========== */
async function onSaveRecipe(e){
  e.preventDefault();
  const name = rName.value.trim();
  if(!name) { showToast('Add a name'); return; }
  const tag = rTag.value.trim();
  const ingredients = rIngs.value.split('\n').map(x=>x.trim()).filter(Boolean);
  const steps = rSteps.value.split('\n').map(x=>x.trim()).filter(Boolean);
  const time = parseInt(rTime.value) || null;

  let imgData = null;
  if(rImg.files && rImg.files[0]){
    imgData = await readFileAsDataURL(rImg.files[0]);
  }

  const payload = {
    id: editingId || idNow(),
    name, tag, ingredients, steps,
    img: imgData || null,
    time, fav: editingId ? (recipes.find(x=>x.id===editingId).fav || false) : false,
    createdAt: Date.now()
  };

  if(editingId){
    recipes = recipes.map(x => x.id === editingId ? payload : x);
    showToast('Recipe updated');
  } else {
    recipes.unshift(payload);
    showToast('Recipe added');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    // send email via EmailJS if set
    sendAddEmail(payload);
  }
  persist();
  renderAll(searchInput.value);
  closeModal();
}

/* ========== Utilities ========== */
function readFileAsDataURL(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
function placeholder(name){
  const initials = (name||'Tasty').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><rect width='100%' height='100%' fill='#FFD9C0'/><text x='50%' y='50%' font-family='Baloo 2' font-size='160' text-anchor='middle' fill='#7B3F00' dy='.35em'>${initials}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + svg;
}

/* ========== Surprise / export ========== */
function surpriseMe(){
  if(recipes.length===0) return showToast('No recipes yet');
  const idx = Math.floor(Math.random()*recipes.length);
  const el = document.querySelector(`.bubble[data-id='${recipes[idx].id}']`) || document.querySelector('.bubble');
  if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
  gsap.fromTo(el, {scale:0.96, rotation:-2}, {scale:1.04, rotation:2, duration:0.32, yoyo:true, repeat:1});
}
function exportJSON(){
  const data = JSON.stringify(recipes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'tastytales-recipes.json'; a.click();
  URL.revokeObjectURL(url); showToast('Exported JSON');
}

/* ========== Login (simple client-side demo) ========== */
function doQuickRegister(){
  const name = (loginName.value || '').trim();
  const email = (loginEmail.value || '').trim();
  if(!email || !name) { showToast('Provide name and email'); return; }
  const u = { name, email, createdAt: Date.now() };
  saveUser(u);
  loginWrap.style.display = 'none';
  showToast('Registered locally');
}
function doQuickLogin(){
  const name = (loginName.value || '').trim();
  const email = (loginEmail.value || '').trim();
  if(!email || !name) { showToast('Provide name and email'); return; }
  const u = { name, email, lastLogin: Date.now() };
  saveUser(u);
  loginWrap.style.display = 'none';
  showToast('Logged in as ' + (u.name || u.email));
}
function updateUserUI(){
  if(user){
    userNameEl.textContent = user.name || (user.email||'Guest').split('@')[0];
    document.getElementById('loginBtn').textContent = 'Profile';
    document.getElementById('loginBtn').addEventListener('click', ()=> showProfile());
  } else {
    userNameEl.textContent = 'Guest';
    document.getElementById('loginBtn').textContent = 'Login';
    document.getElementById('loginBtn').addEventListener('click', ()=> { loginWrap.style.display='flex'; });
  }
}
function showProfile(){
  if(!user) return loginWrap.style.display='flex';
  alert(`User: ${user.name}\nEmail: ${user.email}\nSaved recipes: ${recipes.filter(r=>r.createdBy === (user.email||'')).length}`);
}

/* ========== Toast ========== */
function showToast(msg, dur=1400){
  toastEl.textContent = msg; toastEl.style.display='block';
  gsap.fromTo(toastEl, {y:20, opacity:0}, {y:0, opacity:1, duration:0.28});
  setTimeout(()=> gsap.to(toastEl, {opacity:0, duration:0.28, onComplete: ()=> toastEl.style.display='none'}), dur);
}

/* ========== Email sending via EmailJS (client side) ========== */
function sendAddEmail(recipe){
  // only send if EmailJS is configured
  if(!window.emailjs || EMAILJS_USER_ID === 'REPLACE_WITH_EMAILJS_USER_ID') return;
  if(!user || !user.email) return;

  const templateParams = {
    to_name: user.name || user.email,
    to_email: user.email,
    recipe_name: recipe.name,
    recipe_tag: recipe.tag || 'General',
    ingredients: (recipe.ingredients||[]).join(', '),
    steps: (recipe.steps||[]).slice(0,3).join(' | ')
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    .then(() => console.log('EmailJS: email sent'), (err) => console.error('EmailJS error', err));
}

/* ========== Lottie chef (small) & initial animation ========== */
try{
  lottie.loadAnimation({
    container: document.querySelector('.sticker') || document.body,
    renderer: 'svg', loop: true, autoplay: true,
    path: 'https://assets5.lottiefiles.com/packages/lf20_4kx2q32n.json'
  });
} catch(e){ /* ignore */ }

/* ========== start render ========== */
renderAll();
createFloaters();

/* ========== Floaters (decorative icons) ========== */
function createFloaters(){
  const icons = ['🥄','🍋','🍅','🥣','🍞','🍓'];
  const area = document.querySelector('.bubble-area');
  icons.forEach((ic, idx)=>{
    const d = document.createElement('div');
    d.style.position='absolute';
    d.style.fontSize = (14 + Math.random()*24) + 'px';
    d.style.left = (20 + idx*76 + Math.random()*30) + 'px';
    d.style.top = (40 + Math.random()*40) + 'px';
    d.style.pointerEvents='none';
    d.textContent = ic;
    area.appendChild(d);
    gsap.to(d, {y: (idx%2? -18:18), duration: 3 + Math.random()*2, repeat:-1, yoyo:true, ease:'sine.inOut', delay: idx*0.12});
  });
}
