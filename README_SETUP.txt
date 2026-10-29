LUNÉRA — STORE PACKAGE (Firebase-connected edition)

WHAT'S INCLUDED
- index.html: luxury editorial home page
- product.html / detail.html: collection and product detail
- cart.html: shopping bag
- checkout.html: checkout, cloud order save, EmailJS notification attempt
- manage.html: private management login, hero/cover image, categories, products, recent cloud orders
- lunera-cloud.js: Firebase Auth + Firestore connection
- firestore.rules: restrictive rules to publish in Firebase Console
- lunera-logo.png: brand logo
- EMAILJS_TEMPLATE.txt: EmailJS template variables

IMPORTANT SECURITY NOTES
- The admin password is NOT embedded in website code. Anyone can inspect a static website's JavaScript, so a hardcoded password would not be private.
- Management sign-in uses Firebase Authentication and only accepts lunerastore26@gmail.com. The management link is hidden from signed-out visitors, and Firestore rules protect the data even if someone knows the page URL.
- A password was shared in chat. For safety, use a new private password rather than reusing a password that has been posted in a conversation.
- Firebase web config is public by design; Firestore Security Rules are what protect the database. Never upload service-account private keys.

REQUIRED ONE-TIME FIREBASE SETUP
1. Open Firebase Console > project lunera-store > Authentication > Sign-in method. Enable Email/Password.
2. In Authentication > Settings > Authorized domains, add `lunerastore26-commits.github.io` if it is not already listed. In Authentication > Users, make sure lunerastore26@gmail.com exists. If you do not know its password, open manage.html after deployment and click “EMAIL ME A PASSWORD RESET LINK”; check inbox/spam and set a private password.
3. Open Firestore Database > Rules. Replace the current deny-all rules with the exact contents of firestore.rules in this package and click Publish. These rules allow public catalogue reads, admin-only catalogue edits, customer order creation, and admin-only order reads/updates.
4. EmailJS: confirm service ID service_26ob5sw, template ID e00x0gi and public key in checkout.html are still active. In the template, set recipient to the `to_email` template variable or fixed recipient lunerastore26@gmail.com, and include these variables: order_id, customer_name, customer_phone, customer_email, delivery_address, order_details, order_total, customer_notes, to_email. EmailJS delivery must be tested with a real test order; code cannot guarantee that a third-party template/service is configured correctly.
5. Cloudinary image upload: the package uses cloud name r5kxmdor and unsigned upload preset lunera_products. Confirm that preset exists and allows unsigned image uploads. Uploaded image URLs are saved in Firestore only when an authorised admin is signed in.

DEPLOY TO GITHUB PAGES
1. Download and extract this ZIP.
2. Upload the files in this folder directly into the root of the GitHub repository (not inside another folder). Keep the filenames exactly as supplied.
3. Commit the changes and wait for GitHub Pages to publish.
4. Open the live website, test product > Add to Bag > Bag > Checkout. Do not announce the shop as production-ready until a test order appears in Firestore and the notification email arrives.

HOW THE DATA WORKS
- Catalogue document: Firestore `site/catalogue` with fields luneraProducts, luneraCategories, luneraHero.
- Orders collection: Firestore `orders`. Customers can create orders but cannot read other customers' orders. Only the admin account can view orders in the management panel.
- Email notification: EmailJS is called from the browser as a best-effort notification. This is not a trusted server-side mail service; for stronger anti-abuse protection, later move notification delivery to a server-side function.
- Payment: this package does not collect or verify online payment. Orders remain payment-pending.
- Static GitHub Pages does not run server code. Firebase provides shared database/authentication; EmailJS is separate and must be configured/tested.

TEST CHECKLIST
[ ] Admin can sign in with the Firebase admin email/password.
[ ] Signed-out homepage does not show the Manage link.
[ ] Admin can upload a product image and hero/cover image.
[ ] Product/category/hero changes are visible in a fresh browser session.
[ ] A test order appears in Firestore `orders`.
[ ] The order notification arrives at lunerastore26@gmail.com.
[ ] Mobile layout, bag quantity, and checkout validation are tested.
