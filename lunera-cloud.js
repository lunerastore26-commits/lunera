/* LUNÉRA Firebase client. Keep Firestore Rules authoritative for security. */
(function () {
"use strict";
const firebaseConfig={apiKey:"AIzaSyDkd2oQTREh6JNs9Kh3Q8B-9DvPDk1sSzc",authDomain:"lunera-store.firebaseapp.com",projectId:"lunera-store",storageBucket:"lunera-store.firebasestorage.app",messagingSenderId:"758539336952",appId:"1:758539336952:web:fcea0182f0976804aa0f0d",measurementId:"G-DZ76166JF1"};
const ADMIN_EMAIL="lunerastore26@gmail.com", KEYS=["luneraProducts","luneraCategories","luneraHero","luneraStory","luneraCategoryCovers"];
 function encodeLocal(key,value){return key==="luneraHero"?String(value||""):JSON.stringify(value);}
 function decodeLocal(key,value){if(value==null)return null;if(key==="luneraHero"){const s=String(value);if(s.startsWith('"')&&s.endsWith('"')){try{return JSON.parse(s)}catch(_){}}return s;}try{return JSON.parse(value)}catch(_){return null;}}
let auth,db,adminUser=null,resolveAuth,syncPromise=null;
const authReady=new Promise(r=>resolveAuth=r);
const ready=(async()=>{
 if(!window.firebase)throw Error("Firebase libraries did not load.");
 if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
 auth=firebase.auth();db=firebase.firestore();
 try{await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)}catch(_){}
 auth.onAuthStateChanged(user=>{
  adminUser=user&&user.emailVerified&&String(user.email||"").toLowerCase()===ADMIN_EMAIL?user:null;
  const preview=sessionStorage.getItem("luneraCustomerPreview")==="yes";
  const m=document.getElementById("manageLink");if(m)m.style.display=adminUser&&!preview?"inline-block":"none";
  const connection=document.getElementById("adminConnectionStatus");
  if(connection){
   if(adminUser){connection.textContent="SECURE ADMIN CONNECTED · SHARED CATALOGUE READY";connection.className="admin-connection connected";}
   else if(user){connection.textContent="ADMIN ACCESS NOT VERIFIED";connection.className="admin-connection error";}
   else{connection.textContent="WAITING FOR SECURE ADMIN SIGN-IN";connection.className="admin-connection";}
  }
  const toggle=document.getElementById("customerViewToggle");
  if(toggle){
   toggle.style.display=adminUser?"inline-block":"none";
   toggle.textContent=preview?"Exit Customer View":"View as Customer";
   toggle.setAttribute("aria-pressed",preview?"true":"false");
   if(!toggle.dataset.bound){
    toggle.addEventListener("click",()=>{
     const active=sessionStorage.getItem("luneraCustomerPreview")==="yes";
     if(active)sessionStorage.removeItem("luneraCustomerPreview");
     else sessionStorage.setItem("luneraCustomerPreview","yes");
     const now=sessionStorage.getItem("luneraCustomerPreview")==="yes";
     const manage=document.getElementById("manageLink");
     if(manage)manage.style.display=adminUser&&!now?"inline-block":"none";
     toggle.textContent=now?"Exit Customer View":"View as Customer";
     toggle.setAttribute("aria-pressed",now?"true":"false");
    });
    toggle.dataset.bound="yes";
   }
  }
  const p=document.getElementById("profileLink");if(p)p.href=user?"profile.html":"customer-auth.html";
  const l=document.getElementById("login");if(l){l.style.display=adminUser?"none":"grid";if(adminUser&&typeof window.loadCloudOrders==="function")window.loadCloudOrders()}
  resolveAuth(user||null);
 });
 await syncCatalogue();
})();
async function syncCatalogue(){
 if(syncPromise)return syncPromise;
 syncPromise=(async()=>{
  try{
   const s=await db.collection("site").doc("catalogue").get();
   if(!s.exists)return;
   const d=s.data()||{};let changed=false;
   for(const k of KEYS){
    if(Object.prototype.hasOwnProperty.call(d,k)){
     let old=decodeLocal(k,localStorage.getItem(k));
     if(JSON.stringify(old)!==JSON.stringify(d[k])){localStorage.setItem(k,encodeLocal(k,d[k]));changed=true}
    }
   }
   if(changed)window.dispatchEvent(new CustomEvent("lunera:catalogue-updated",{detail:d}));
  }catch(e){console.warn("LUNÉRA cloud catalogue unavailable:",e.message||e)}
 })();
 try{return await syncPromise}finally{syncPromise=null}
}
async function refreshCatalogue(){
  await ready;
  const snap=await db.collection("site").doc("catalogue").get({source:"server"});
  if(!snap.exists)return null;
  const data=snap.data()||{};
  let changed=false;
  for(const k of KEYS){
    if(Object.prototype.hasOwnProperty.call(data,k)){
      const value=encodeLocal(k,data[k]);
      if(localStorage.getItem(k)!==value){localStorage.setItem(k,value);changed=true;}
    }
  }
  if(changed)window.dispatchEvent(new CustomEvent("lunera:catalogue-updated",{detail:data}));
  return data;
 }
 async function ensureCatalogue(values){
 await ready;
 await authReady;
 if(!adminUser)throw Error("Verified admin sign-in required to initialise the catalogue.");
 const ref=db.collection("site").doc("catalogue");
 const snap=await ref.get();
 if(snap.exists)return false;
 if(!values||typeof values!=="object"||Array.isArray(values))throw Error("Catalogue data is invalid.");
 const payload={updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
 for(const k of KEYS)if(Object.prototype.hasOwnProperty.call(values,k))payload[k]=values[k];
 if(Object.keys(payload).length===1)throw Error("No catalogue data was supplied.");
 await ref.set(payload);
 return true;
}
async function saveCatalogue(values){
 await ready;
 await authReady;
 if(!adminUser)throw Error("Verified admin sign-in required to save the catalogue.");
 if(!values||typeof values!=="object"||Array.isArray(values))throw Error("Catalogue data is invalid.");
 const payload={updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
 for(const k of KEYS)if(Object.prototype.hasOwnProperty.call(values,k))payload[k]=values[k];
 if(Object.keys(payload).length===1)throw Error("No catalogue changes were supplied.");
 await db.collection("site").doc("catalogue").set(payload,{merge:true});
 return true;
}
window.LuneraCloud={
 ready,
 refreshCatalogue,
 saveCatalogue,
 ensureCatalogue,
 async currentUser(){await ready;await authReady;return auth.currentUser||null},
 async createCustomerAccount(email,password,name){await ready;const c=await auth.createUserWithEmailAndPassword(String(email).trim(),password);if(c.user&&name){try{await c.user.updateProfile({displayName:String(name).trim()})}catch(profileError){console.warn("LUNÉRA account created, but display name could not be saved:",profileError)}}return c.user},
 async signInCustomer(email,password){await ready;return (await auth.signInWithEmailAndPassword(String(email).trim(),password)).user},
 async resetCustomerPassword(email){await ready;return auth.sendPasswordResetEmail(String(email).trim())},
 async signInAdmin(email,password){await ready;if(String(email||"").trim().toLowerCase()!==ADMIN_EMAIL)throw Error("This email is not authorised for management.");const c=await auth.signInWithEmailAndPassword(ADMIN_EMAIL,password);await c.user.reload();await c.user.getIdToken(true);if(!c.user.emailVerified){await auth.signOut();throw Error("Verify the admin email before opening Manage.")}adminUser=c.user;return true},
 async resetAdminPassword(email){await ready;if(String(email||"").trim().toLowerCase()!==ADMIN_EMAIL)throw Error("Use the authorised admin email.");return auth.sendPasswordResetEmail(ADMIN_EMAIL)},
 async signOutCustomer(){await ready;await auth.signOut();location.href="index.html"},
 async signOutAdmin(){await ready;await auth.signOut();location.href="index.html"},
 async saveOrder(order){
  await ready;
  const u=await this.currentUser();
  if(!u)throw Error("Please sign in before placing an order.");
  if(!order||!/^LUN[0-9]{8}$/.test(String(order.id||""))||!Array.isArray(order.items)||!order.items.length||order.items.length>50)throw Error("Order details are incomplete or invalid.");
  const catalogue=await db.collection("site").doc("catalogue").get();
  if(!catalogue.exists)throw Error("The LUNÉRA catalogue is not published yet. Please try again shortly.");
  const products=Array.isArray(catalogue.data().luneraProducts)?catalogue.data().luneraProducts:[];
  if(!products.length)throw Error("The LUNÉRA catalogue is empty. Please contact the store.");
  const items=order.items.map(item=>{
   const product=products.find(p=>p&&String(p.id)===String(item.id));
   if(!product)throw Error("A selected product is no longer available. Please refresh your bag.");
   const price=Number(String(product.price??"0").replace(/[^0-9.-]/g,""));
   const quantity=Number(item.quantity);
   const sizes=Array.isArray(product.sizes)?product.sizes.map(String):String(product.sizes||"Standard").split(",").map(s=>s.trim()).filter(Boolean);
   const size=String(item.size||"");
   if(!Number.isFinite(price)||price<=0||price>10000000)throw Error("A product has an invalid price. Please contact the store.");
   if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw Error("Product quantity must be between 1 and 20.");
   if(!sizes.includes(size))throw Error("A selected size is no longer available. Please refresh your bag.");
   return {id:product.id,name:String(product.name||""),price,category:String(product.category||""),image:String(product.image||""),size,quantity};
  });
  const total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
  if(!Number.isFinite(Number(order.total))||Math.abs(total-Number(order.total))>0.001)throw Error("A product price has changed. Please refresh your bag and try again.");
  const customer=order.customer||{};
  const phone=String(customer.phone||"").replace(/\D/g,"");
  const pin=String(customer.pin||"").replace(/\D/g,"");
  if(!String(customer.name||"").trim()||!/^[0-9]{10}$/.test(phone)||!String(customer.address||"").trim()||!String(customer.city||"").trim()||!String(customer.state||"").trim()||!/^[0-9]{6}$/.test(pin))throw Error("Please check your delivery name, 10-digit phone number and complete address.");
  const safe={
   id:String(order.id),
   userId:u.uid,
   date:new Date().toISOString(),
   customer:{name:String(customer.name).trim(),phone,email:String(u.email||customer.email||""),address:String(customer.address).trim(),city:String(customer.city).trim(),state:String(customer.state).trim(),pin,notes:String(customer.notes||"")},
   items,
   total,
   status:"New",
   paymentStatus:"Pending",
   paymentMethod:"Cash on Delivery (COD)",
   emailStatus:"Pending",
   createdAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection("orders").doc(safe.id).set(safe);
  return safe;
 },
 async getMyOrders(){await ready;const u=await this.currentUser();if(!u)throw Error("Please sign in to view your orders.");const s=await db.collection("orders").where("userId","==",u.uid).get();return s.docs.map(d=>({...d.data(),idKey:d.id})).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))},
 async watchMyOrders(onChange,onError){await ready;const u=await this.currentUser();if(!u)throw Error("Please sign in to view your orders.");if(typeof onChange!=="function")throw Error("An order update callback is required.");return db.collection("orders").where("userId","==",u.uid).onSnapshot(s=>{const orders=s.docs.map(d=>({...d.data(),idKey:d.id})).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));onChange(orders)},e=>{if(typeof onError==="function")onError(e);});},
 async getOrders(){await ready;await authReady;if(!adminUser)throw Error("Verified admin sign-in required.");const s=await db.collection("orders").get();return s.docs.map(d=>({...d.data(),idKey:d.id})).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))},
 async updateOrderStatus(id,status){await ready;await authReady;if(!adminUser)throw Error("Verified admin sign-in required.");const allowed=["New","Confirmed","Processing","Shipped","Delivered","Cancelled"];if(!allowed.includes(String(status)))throw Error("Invalid order status.");const update={status:String(status),updatedAt:firebase.firestore.FieldValue.serverTimestamp()};if(String(status)==="Delivered"){update.paymentStatus="Paid";update.paymentCollectedAt=firebase.firestore.FieldValue.serverTimestamp();}return db.collection("orders").doc(String(id)).update(update)}
};
})();