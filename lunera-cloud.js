/* LUNÉRA Firebase client. Keep Firestore Rules authoritative for security. */
(function () {
"use strict";
const firebaseConfig={apiKey:"AIzaSyDkd2oQTREh6JNs9Kh3Q8B-9DvPDk1sSzc",authDomain:"lunera-store.firebaseapp.com",projectId:"lunera-store",storageBucket:"lunera-store.firebasestorage.app",messagingSenderId:"758539336952",appId:"1:758539336952:web:fcea0182f0976804aa0f0d",measurementId:"G-DZ76166JF1"};
const ADMIN_EMAIL="lunerastore26@gmail.com", KEYS=["luneraProducts","luneraCategories","luneraHero"];
let auth,db,adminUser=null,resolveAuth;
const authReady=new Promise(r=>resolveAuth=r);
const ready=(async()=>{
 if(!window.firebase)throw Error("Firebase libraries did not load.");
 if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
 auth=firebase.auth();db=firebase.firestore();
 try{await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)}catch(_){}
 auth.onAuthStateChanged(user=>{
  adminUser=user&&user.emailVerified&&String(user.email||"").toLowerCase()===ADMIN_EMAIL?user:null;
  const m=document.getElementById("manageLink");if(m)m.style.display=adminUser?"inline-block":"none";
  const p=document.getElementById("profileLink");if(p)p.href=user?"profile.html":"customer-auth.html";
  const l=document.getElementById("login");if(l){l.style.display=adminUser?"none":"grid";if(adminUser&&typeof window.loadCloudOrders==="function")window.loadCloudOrders()}
  resolveAuth(user||null);
 });
 await syncCatalogue();
})();
async function syncCatalogue(){
 try{const s=await db.collection("site").doc("catalogue").get();if(!s.exists)return;const d=s.data()||{};let changed=false;
 for(const k of KEYS)if(Object.prototype.hasOwnProperty.call(d,k)){let old=null;try{old=JSON.parse(localStorage.getItem(k)||"null")}catch(_){}if(JSON.stringify(old)!==JSON.stringify(d[k])){localStorage.setItem(k,JSON.stringify(d[k]));changed=true}}
 if(changed)location.reload();
 }catch(e){console.warn("LUNÉRA cloud catalogue unavailable:",e.message||e)}
}
const originalSet=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(this!==localStorage||!KEYS.includes(String(k))||!db)return;
 ready.then(async()=>{if(!adminUser)return;let value;try{value=JSON.parse(v)}catch(_){return}
 await db.collection("site").doc("catalogue").set({[k]:value,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})
 }).catch(e=>console.warn("Catalogue save failed:",e.message||e));
};
window.LuneraCloud={
 ready,
 async currentUser(){await ready;await authReady;return auth.currentUser||null},
 async createCustomerAccount(email,password,name){await ready;const c=await auth.createUserWithEmailAndPassword(String(email).trim(),password);if(c.user&&name)await c.user.updateProfile({displayName:String(name).trim()});return c.user},
 async signInCustomer(email,password){await ready;return (await auth.signInWithEmailAndPassword(String(email).trim(),password)).user},
 async resetCustomerPassword(email){await ready;return auth.sendPasswordResetEmail(String(email).trim())},
 async signInAdmin(email,password){await ready;if(String(email||"").trim().toLowerCase()!==ADMIN_EMAIL)throw Error("This email is not authorised for management.");const c=await auth.signInWithEmailAndPassword(ADMIN_EMAIL,password);await c.user.reload();if(!c.user.emailVerified){await auth.signOut();throw Error("Verify the admin email before opening Manage.")}adminUser=c.user;return true},
 async resetAdminPassword(email){await ready;if(String(email||"").trim().toLowerCase()!==ADMIN_EMAIL)throw Error("Use the authorised admin email.");return auth.sendPasswordResetEmail(ADMIN_EMAIL)},
 async signOutCustomer(){await ready;await auth.signOut();location.href="index.html"},
 async signOutAdmin(){await ready;await auth.signOut();location.href="index.html"},
 async saveOrder(order){await ready;const u=await this.currentUser();if(!u)throw Error("Please sign in before placing an order.");if(!order||!order.id||!Array.isArray(order.items)||!order.items.length)throw Error("Order details are incomplete.");const safe={...order,userId:u.uid,customer:{...(order.customer||{}),email:u.email||""},createdAt:firebase.firestore.FieldValue.serverTimestamp()};await db.collection("orders").doc(String(order.id)).set(safe);return safe},
 async getMyOrders(){await ready;const u=await this.currentUser();if(!u)throw Error("Please sign in to view your orders.");const s=await db.collection("orders").where("userId","==",u.uid).get();return s.docs.map(d=>({...d.data(),idKey:d.id})).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))},
 async getOrders(){await ready;await authReady;if(!adminUser)throw Error("Verified admin sign-in required.");const s=await db.collection("orders").get();return s.docs.map(d=>({...d.data(),idKey:d.id})).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))},
 async updateOrderStatus(id,status){await ready;await authReady;if(!adminUser)throw Error("Verified admin sign-in required.");return db.collection("orders").doc(String(id)).update({status:String(status),updatedAt:firebase.firestore.FieldValue.serverTimestamp()})}
};
})();