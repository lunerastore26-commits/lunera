LUNÉRA update pack

Files:
- lunera-cloud.js: replace existing file.
- profile.html: add as a new file.
- firestore.rules: publish in Firebase Console > Firestore Database > Rules.

Integration still required in existing pages:
1. Add <a href="customer-auth.html" id="profileLink">Profile</a> to the homepage header.
2. Remove the homepage JavaScript function that unconditionally displays Manage; the cloud script now shows it only for a verified admin.
3. Require a signed-in customer before checkout submits. The new saveOrder method rejects anonymous orders and attaches the Firebase UID.
4. Existing historical orders without userId will not appear in customer accounts.
5. Deploy firestore.rules in Firebase Console; a GitHub commit alone does not publish rules.
6. Keep COD only until a payment gateway and server-side verification endpoint are configured.
7. Review Cloudinary upload preset and configure upload restrictions before launch.

Make backups before replacing existing files. This pack is a partial integration package, not a completed/deployed site update.
