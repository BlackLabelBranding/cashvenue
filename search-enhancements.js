const PM_SB_URL='https://xopcttkrmjvwdddawdaa.supabase.co';
const PM_SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcGN0dGtybWp2d2RkZGF3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQzNjgsImV4cCI6MjA3MTczMDM2OH0.5s1HHvDsDIgWw6TVR3YfhzJC9uEjcVfunRyMa6B7xYY';
let pmSuggestions=[];
let pmEnhanceTimer=null;

function pmEsc(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function pmNormalize(v=''){return String(v).toLowerCase().trim().replace(/[^a-z0-9]+/g,' ');}

async function pmLoadSuggestions(){
  if(pmSuggestions.length)return pmSuggestions;
  try{
    const r=await fetch(`${PM_SB_URL}/rest/v1/rpc/pourmap_public_map`,{method:'POST',headers:{apikey:PM_SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_latitude:null,p_longitude:null,p_radius_miles:500,p_query:null})});
    if(!r.ok)return[];
    const data=await r.json();
    const out=[];
    for(const v of data.venues||[]){
      out.push({type:'Venue',label:v.name,sub:[v.city,v.state].filter(Boolean).join(', '),value:v.name});
      if(v.city)out.push({type:'Town',label:`${v.city}, ${v.state||''}`.trim(),sub:`Find venues in ${v.city}`,value:`${v.city} ${v.state||''}`.trim()});
      for(const p of v.crew||[])out.push({type:'Bartender',label:p.display_name,sub:`${v.name} · ${v.city||''}`,value:p.display_name});
    }
    const seen=new Set();pmSuggestions=out.filter(x=>{const k=`${x.type}|${x.label}`.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
    return pmSuggestions;
  }catch{return[];}
}

function pmFallbackSvg(name='Venue'){
  const text=encodeURIComponent(String(name).slice(0,24));
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1'%3E%3Cstop stop-color='%23111722'/%3E%3Cstop offset='1' stop-color='%23331b3f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='600' fill='url(%23g)'/%3E%3Ccircle cx='180' cy='300' r='105' fill='%232bd9e8' opacity='.18'/%3E%3Ctext x='180' y='330' text-anchor='middle' font-size='110'%3E🍺%3C/text%3E%3Ctext x='330' y='285' fill='white' font-family='Arial,sans-serif' font-size='80' font-weight='800'%3E${text}%3C/text%3E%3Ctext x='334' y='355' fill='%232bd9e8' font-family='Arial,sans-serif' font-size='34'%3ETonight on PourMap%3C/text%3E%3C/svg%3E`;
}

function pmFixImages(){
  document.querySelectorAll('.venue-card__cover img,.page-hero__image').forEach(img=>{
    if(img.dataset.pmFallback)return;
    img.dataset.pmFallback='1';
    img.addEventListener('error',()=>{const card=img.closest('.venue-card');const title=card?.querySelector('h2')?.textContent?.trim()||document.querySelector('.page-hero h1')?.textContent?.trim()||'Venue';img.src=pmFallbackSvg(title);},{once:true});
    if(img.complete&&img.naturalWidth===0)img.dispatchEvent(new Event('error'));
  });
}

async function pmAttachAutocomplete(){
  const form=document.querySelector('[data-map-search]');
  const input=form?.querySelector('input[name="query"]');
  if(!form||!input||input.dataset.pmAutocomplete)return;
  input.dataset.pmAutocomplete='1';
  const wrap=input.closest('.search-input-wrap')||input.parentElement;
  wrap.style.position='relative';
  const box=document.createElement('div');box.className='pm-autocomplete';wrap.appendChild(box);
  const style=document.createElement('style');style.textContent=`.pm-autocomplete{position:absolute;top:calc(100% + 8px);left:0;right:0;background:#111622;border:1px solid rgba(255,255,255,.14);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.45);overflow:hidden;z-index:9999;display:none}.pm-autocomplete.open{display:block}.pm-suggestion{display:flex;gap:12px;align-items:center;width:100%;padding:13px 15px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:transparent;color:white;text-align:left}.pm-suggestion:last-child{border-bottom:0}.pm-suggestion:active,.pm-suggestion:hover{background:rgba(43,217,232,.1)}.pm-suggestion b{display:block;font-size:.95rem}.pm-suggestion small{display:block;color:#9ba6b8;margin-top:3px}.pm-type{font-size:.68rem;font-weight:800;color:#35d9e9;text-transform:uppercase;min-width:62px}@media(max-width:700px){.pm-autocomplete{position:fixed;left:20px;right:20px;top:190px;max-height:45vh;overflow:auto}.pm-suggestion{padding:15px}}`;document.head.appendChild(style);
  const all=await pmLoadSuggestions();
  function close(){box.classList.remove('open');box.innerHTML='';}
  function render(){const q=pmNormalize(input.value);if(q.length<1){close();return;}const words=q.split(/\s+/).filter(Boolean);const matches=all.filter(x=>{const hay=pmNormalize(`${x.label} ${x.sub} ${x.type}`);return words.every(w=>hay.includes(w));}).slice(0,8);if(!matches.length){close();return;}box.innerHTML=matches.map((x,i)=>`<button type="button" class="pm-suggestion" data-pm-index="${i}"><span class="pm-type">${pmEsc(x.type)}</span><span><b>${pmEsc(x.label)}</b><small>${pmEsc(x.sub)}</small></span></button>`).join('');box.classList.add('open');box.querySelectorAll('[data-pm-index]').forEach(b=>b.onclick=()=>{const x=matches[Number(b.dataset.pmIndex)];input.value=x.value;close();form.requestSubmit();input.blur();});}
  input.addEventListener('input',()=>{clearTimeout(pmEnhanceTimer);pmEnhanceTimer=setTimeout(render,90);});
  input.addEventListener('focus',render);
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});
}

function pmEnhance(){if(location.pathname==='/'){pmAttachAutocomplete();pmFixImages();}}
const pmObserver=new MutationObserver(()=>{clearTimeout(pmEnhanceTimer);pmEnhanceTimer=setTimeout(pmEnhance,60);});
pmObserver.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',pmEnhance);window.addEventListener('popstate',pmEnhance);pmEnhance();
