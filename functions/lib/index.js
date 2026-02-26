"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInviteStatus = exports.onUserCreate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    var _a, _b;
    await admin.firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        email: (_a = user.email) !== null && _a !== void 0 ? _a : '',
        displayName: (_b = user.displayName) !== null && _b !== void 0 ? _b : '',
        role: 'client',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
exports.checkInviteStatus = functions.https.onCall(async (_data, context) => {
    var _a;
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.email)) {
        return { allowed: false };
    }
    const email = context.auth.email.toLowerCase();
    const snap = await admin.firestore()
        .collection('allowedEmails')
        .where('email', '==', email)
        .limit(1)
        .get();
    return { allowed: !snap.empty };
});
//# sourceMappingURL=index.js.map