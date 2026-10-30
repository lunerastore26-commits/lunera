/* LUNÉRA cloud connection. Firebase web config is public; database access is protected by Firestore Rules. */
(function () {
  "use strict";
  const firebaseConfig = {
    apiKey: "AIzaSyDkd2oQTREh6JNs9Kh3Q8B-9DvPDk1sSzc",
    authDomain: "lunera-store.firebaseapp.com",
    projectId: "lunera-store",
    storageBucket: "lunera-store.firebasestorage.app",
    messagingSenderId: "758539336952",
    appId: "1:758539336952:web:fcea0182f0976804aa0f0d",
    measurementId: "G-DZ76166JF1"
  };
  const ADMIN_EMAIL = "lunerastore26@gmail.com";
  const CATALOGUE_KEYS = ["luneraProducts", "luneraCategories", "luneraHero"];
  let auth, db, adminUser = null, syncing = false;
  const ready = (async () => {
    if (!window.firebase) throw new Error("Firebase libraries did not load. Check your internet connection.");
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth(); db = firebase.firestore();
    try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (_) {}
    auth.onAuthStateChanged(user => {
      adminUser = user && String(user.email || "").toLowerCase() === ADMIN_EMAIL ? user : null;
      const manageLink = document.getElementById("manageLink");
      if (manageLink) manageLink.style.display = adminUser ? "inline-block" : "none";
      const login = document.getElementById("login");
      if (login && document.body.contains(login)) {
        login.style.display = adminUser ? "none" : "grid";
        if (adminUser && typeof window.loadCloudOrders === "function") window.loadCloudOrders();
      }
    });
    await syncCatalogueFromCloud();
  })();

  async function syncCatalogueFromCloud() {
    if (syncing) return;
    syncing = true;
    try {
      const snap = await db.collection("site").doc("catalogue").get();
      if (!snap.exists) return;
      const data = snap.data() || {};
      let changed = false;
      for (const key of CATALOGUE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
          let current = null;
          try { current = JSON.parse(localStorage.getItem(key) || "null"); } catch (_) {}
          if (JSON.stringify(current) !== JSON.stringify(data[key])) {
            localStorage.setItem(key, JSON.stringify(data[key])); changed = true;
          }
        }
      }
      if (changed) location.reload();
    } catch (e) {
      console.warn("LUNÉRA catalogue cloud sync unavailable:", e && e.message ? e.message : e);
    } finally { syncing = false; }
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this !== localStorage || !CATALOGUE_KEYS.includes(String(key)) || !db) return;
    ready.then(async () => {
      if (!adminUser) return;
      let parsed;
      try { parsed = JSON.parse(value); } catch (_) { return; }
      try { await db.collection("site").doc("catalogue").set({ [key]: parsed, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: ADMIN_EMAIL }, { merge: true }); }
      catch (e) { console.error("Could not sync catalogue to Firestore:", e); }
    }).catch(() => {});
  };

  window.LuneraCloud = {
    ready,
    
      await ready;
      if (String(email || "").trim().toLowerCase() !== ADMIN_EMAIL) throw new Error("This email is not authorised for LUNÉRA management.");
      if (!password) throw new Error("Please enter your password.");
      const credential = await auth.signInWithEmailAndPassword(ADMIN_EMAIL, password);
      if (!credential.user || String(credential.user.email || "").toLowerCase() !== ADMIN_EMAIL) {
        await auth.signOut(); throw new Error("This account is not authorised for management.");
      }
      adminUser = credential.user;
      return true;
    },
    async resetAdminPassword(email) {
      await ready;
      if (String(email || "").trim().toLowerCase() !== ADMIN_EMAIL) throw new Error("Use the authorised admin email address.");
      await auth.sendPasswordResetEmail(ADMIN_EMAIL);
    },
    async signOutAdmin() { await ready; await auth.signOut(); location.href = "index.html"; },
    async saveOrder(order) {
      await ready;
      if (!order || !order.id) throw new Error("Order details are incomplete.");
      await db.collection("orders").doc(String(order.id)).set({ ...order, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    },
    async getOrders() {
      await ready;
      if (!adminUser) throw new Error("Please sign in with the authorised admin account first.");
      const snap = await db.collection("orders").get();
      return snap.docs.map(d => ({ ...d.data(), idKey: d.id })).sort((a,b) => String(b.date||"").localeCompare(String(a.date||"")));
    },
    async updateOrderStatus(id, status) {
      await ready;
      if (!adminUser) throw new Error("Admin sign-in required.");
      await db.collection("orders").doc(String(id)).update({ status: String(status), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
  };
})();
