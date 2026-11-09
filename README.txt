LUNÉRA — ELEGANCE IN EVERY LAYER

LIVE STORE
https://lunerastore26-commits.github.io/lunera/

MAIN PAGES
- index.html — storefront homepage
- product.html — collection and product details
- cart.html — shopping bag
- checkout.html — signed-in customer checkout (COD)
- customer-auth.html — email/password and phone OTP
- profile.html — customer profile and private order history
- manage.html — verified-admin catalogue, hero and order management
- lunera-cloud.js — Firebase Authentication and Firestore integration
- firestore.rules — Firestore access controls

SHARED DATA
- Products, categories and hero image: Firestore site/catalogue
- Orders: Firestore orders collection
- Customer order history: filtered by authenticated Firebase UID
- Admin access: verified lunerastore26@gmail.com account only
- First verified admin sign-in initialises the catalogue only if the cloud document does not yet exist; existing cloud catalogue data is never overwritten on login.

IMPORTANT
1. Publish firestore.rules in Firebase Console > Firestore Database > Rules.
2. Add lunerastore26-commits.github.io to Firebase Authentication authorised domains.
3. Verify Email/Password and Phone sign-in providers are enabled.
4. Confirm the Cloudinary unsigned preset lunera_products is restricted to image files and an appropriate upload size.
5. Confirm EmailJS service service_26ob5sw and template e00x0gi are active and test delivery.
6. Place a test COD order and verify it appears in Firestore and the admin panel.
7. Test the complete flow on desktop and mobile before accepting public orders.

Online payment is intentionally not enabled. Do not accept or mark an order as paid without a server-side payment integration and verified gateway signature.
