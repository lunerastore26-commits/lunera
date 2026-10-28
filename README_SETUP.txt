LUNÉRA WEBSITE — FINAL FRONT-END PACKAGE

UPLOAD / DEPLOY
1. Extract this ZIP.
2. Upload ALL files inside this folder directly to the root of your GitHub Pages repository (not inside an extra nested folder).
3. Keep the filenames exactly as supplied, including lunera-logo.png.
4. Commit the changes and wait for GitHub Pages to publish.
5. Open the live site in a fresh tab and test product → Add to Bag → Bag → Proceed to Checkout → Place Order.

PAGES
- index.html: homepage
- product.html: collection and product detail (query-string based)
- detail.html: compatibility alias for the product page
- cart.html: bag/cart
- checkout.html: order form and confirmation
- manage.html / admin.html: management pages; admin access is intentionally locked until secure server-backed authentication is configured
- lunera-logo.png: logo/favicon

ORDER BEHAVIOUR
- A valid checkout saves the order in this browser's localStorage under luneraOrders, clears luneraCart, and shows confirmation.
- EmailJS is attempted as a best-effort notification. If email delivery fails, the order confirmation still appears and the page states that notification failed. Check the EmailJS template's recipient and variables if email does not arrive.
- Because this is a static GitHub Pages site, browser-local orders are NOT centrally saved and cannot be seen on another device/browser. For production orders, connect a secure backend/database and server-side email service.
- This page does not collect or verify online payment. Payment remains pending; do not describe an order as paid until a payment gateway is integrated and verified.

CURRENCY / DATA
Prices are displayed in INR and product/cart/checkout price parsing accepts both numeric values and values like ₹1,499 from the management page. The site shares cart and product customisation through same-origin localStorage.
