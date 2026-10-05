import { CONFIG } from './config.js';
import { trackingState } from './supabase.js';
import { escapeHtml, appRoot, publicShell, showToast } from './ui.js';
import { toDataURL } from './vendor/qrcode.js';

export async function ticketing(action,body={},token=null){
 const response=await fetch(`${CONFIG.supabaseUrl}/functions/v1/ticketing-api`,{method:'POST',headers:{apikey:CONFIG.supabaseAnonKey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({action,...body})});
 let data;try{data=await response.json();}catch{throw new Error('Ticketing service could not be reached.');}
 if(!response.ok||data.ok===false)throw new Error(data.error||'Ticketing request failed.');return data;
}
export async function checkout(slug,customer,items,payDeposit,requestId){
 const result=await ticketing('checkout',{site_key:CONFIG.siteKey,campaign_slug:slug,customer,items,pay_deposit:payDeposit,request_id:requestId,tracking_token:trackingState().token||null});
 const link=`/ticket/#order=${result.order_id}&token=${result.access_token}`;
 sessionStorage.setItem(`ticketing-${result.order_id}`,result.access_token);
 if(result.checkout_url){const u=new URL(result.checkout_url);if(u.protocol!=='https:'||u.hostname!=='checkout.stripe.com')throw new Error('Invalid payment destination.');location.assign(u.href);}
 else location.assign(link);
 return result;
}
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
export async function ticketPage(site){
 const params=new URLSearchParams(location.hash.replace(/^#/,''));
 const orderId=params.get('order');const accessToken=params.get('token')||sessionStorage.getItem(`ticketing-${orderId}`);
 appRoot.innerHTML=publicShell(site,'<section class="section"><div class="container"><h1>Your tickets</h1><p role="status">Loading your order…</p></div></section>');
 if(!orderId||!accessToken){appRoot.innerHTML=publicShell(site,'<section class="section"><div class="container"><h1>Ticket link required</h1><p>Open the private ticket link from your order confirmation.</p></div></section>');return;}
 const credentials={order_id:orderId,access_token:accessToken};
 try{
  const order=await ticketing('order',credentials);
  const qr=order.qr_token?await toDataURL(order.qr_token,{width:240,margin:2}):null;
  const remaining=Number(order.balance_amount);
  appRoot.innerHTML=publicShell(site,`<section class="section"><div class="container" style="max-width:760px"><article class="admin-panel"><div class="admin-panel__head"><h1>${escapeHtml(order.event?.name||'Your tickets')}</h1></div><div class="admin-panel__body"><p><strong>${escapeHtml(order.order_number)}</strong></p><p role="status">${escapeHtml(order.status.replaceAll('_',' '))}</p><ul>${order.items.map(i=>`<li>${i.quantity} × ${escapeHtml(i.ticket_name)} — ${money(i.line_total)}</li>`).join('')}</ul><p>Total: <strong>${money(order.total_amount)}</strong></p><p>Paid: <strong>${money(order.paid_amount)}</strong>${order.refunded_amount?` · Refunded: ${money(order.refunded_amount)}`:''}</p>${remaining>0?`<p>Remaining balance: <strong>${money(remaining)}</strong>${order.balance_due_at?` · Due ${escapeHtml(new Date(order.balance_due_at).toLocaleDateString())}`:''}</p>`:''}${qr?`<img src="${qr}" alt="Ticket check-in QR code" width="240" height="240"/><p>Save this ticket and bring it to the door. Each scan admits one guest from this order.</p><button type="button" class="button button--primary js-print-ticket">Print / Save Ticket</button>`:order.status==='partially_paid'?'<p>Your reservation is secured. Your entry QR becomes available after the remaining balance is paid.</p>':order.status==='pending_payment'?'<p>Payment has not been confirmed. You can resume your secure checkout below.</p>':''}<div class="button-row">${order.status==='partially_paid'?'<button class="button button--primary js-pay-balance">Pay Remaining Balance</button>':''}${order.checkout_url&&order.status==='pending_payment'?`<a class="button button--primary" href="${escapeHtml(order.checkout_url)}" rel="noreferrer">Resume Checkout</a>`:''}<button class="button button--ghost js-refresh-ticket">Refresh Status</button></div>${order.email_pending?'<p class="copy">Keep this private link. Your email confirmation is pending.</p>':''}<p class="form-status" role="status"></p></div></article></div></section>`);
  document.querySelector('.js-print-ticket')?.addEventListener('click',()=>window.print());
  document.querySelector('.js-refresh-ticket')?.addEventListener('click',()=>ticketPage(site));
  document.querySelector('.js-pay-balance')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{const r=await ticketing('balance',credentials);const u=new URL(r.checkout_url);if(u.hostname!=='checkout.stripe.com'||u.protocol!=='https:')throw new Error('Invalid checkout destination.');location.assign(u.href);}catch(err){showToast(err.message,true);e.currentTarget.disabled=false;}});
 }catch(error){appRoot.innerHTML=publicShell(site,`<section class="section"><div class="container"><h1>Ticket order unavailable</h1><p>${escapeHtml(error.message)}</p><button class="button button--ghost" onclick="location.reload()">Retry</button></div></section>`);}
}
