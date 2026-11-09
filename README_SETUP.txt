LUNÉRA — LIVE STORE SETUP GUIDE

PROJECT
Firebase project: lunera-store
GitHub Pages: https://lunerastore26-commits.github.io/lunera/
Admin account: lunerastore26@gmail.com

WHAT IS IN THE REPOSITORY
- index.html: luxury storefront homepage
- product.html / detail.html: collection and product details
- cart.html: shopping bag
- checkout.html: signed-in customer checkout; COD only
- customer-auth.html: email/password and phone OTP
- profile.html: customer profile and private order history
- manage.html: verified-admin product, category, hero and order management
- lunera-cloud.js: Firebase Authentication and Firestore client
- firestore.rules: database access controls
- lunera-logo.png: brand logo

ONE-TIME FIREBASE SETUP
1. Firebase Console > Authentication > Sign-in method: enable Email/Password and Phone.
2. Authentication > Settings > Authorized domains: add lunerastore26-commits.github.io.
3. Authentication > Users: ensure lunerastore26@gmail.com exists. The admin must verify this email before Manage access is granted. Use the password-reset link on manage.html if needed.
4. Firestore Database > Rules: publish the exact rules from this repository's firestore.rules file.
5. Open manage.html and sign in with the verified admin account once. If site/catalogue does not exist, this first admin sign-in initialises it from the starter catalogue. Existing cloud catalogue data is never overwritten just by logging in.

CLOUDINARY IMAGE UPLOAD
The management panel uses cloud name r5kxmdor and unsigned preset lunera_products. In Cloudinary, restrict the preset to image files (JPG, PNG, WebP) and set a 10 MB maximum upload size. The browser also validates file type and size, and only stores secure Cloudinary image URLs.

EMAIL NOTIFICATIONS
Checkout attempts an EmailJS notification using:
- Service: service_26ob5sw
- Template: e00x0gi
- Public key: configured in checkout.html
Set the template recipient (To Email) to the fixed address lunerastore26@gmail.com; do not use a browser-supplied recipient variable. Include: order_id, customer_name, customer_phone, customer_email, delivery_address, order_details, order_total, customer_notes, to_email.
EmailJS is best-effort browser-side notification. Confirm the service/template are active and test delivery.

ORDER AND CUSTOMER DATA
- Catalogue: Firestore document site/catalogue (luneraProducts, luneraCategories, luneraHero).
- Orders: Firestore collection orders.
- Each order is attached to the signed-in Firebase UID. Customers can read only their own orders; the verified admin can read and update order status.
- Checkout rechecks products, prices, sizes and quantities against the shared catalogue before saving.
- Historical orders created before userId was added may not appear in customer profile history.

PRE-LAUNCH TEST
[ ] Admin sign-in succeeds only for the verified admin account.
[ ] Signed-out users cannot see the Manage link or read admin orders.
[ ] Product/category/hero edits save and appear in a fresh browser session.
[ ] Product image and hero uploads work.
[ ] Email/password account creation and sign-in work.
[ ] Phone OTP sends and verifies successfully.
[ ] A test COD order appears in Firestore and Manage.
[ ] Customer Profile shows only that customer's order.
[ ] Admin can update order status and customer sees the new status on refresh.
[ ] Test navigation, bag quantity, checkout validation and layout on desktop and mobile.

IMPORTANT
GitHub Pages is static hosting; it does not run a private server. EmailJS sends browser-side notifications and is not a trusted server-side mail service. Do not announce the store as production-ready until Firebase rules are published and a complete test order succeeds.

Online payment is intentionally disabled. A real payment gateway requires a server-side order/payment endpoint and verified gateway signatures. Never mark an order paid from a browser redirect or customer screenshot.
