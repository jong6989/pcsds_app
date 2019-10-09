// //  // Debug

var docFire = firebase;

docFire.firestore().settings({
	cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
var doc = {};
doc.db = docFire.firestore();
doc.fun = docFire.functions();
doc.buc = docFire.storage().ref();
const acc = 'accounts';
const agencies = 'agencies';
const documents = 'documents';
const doc_transactions = 'doc_transactions';
const offlineFiles = 'offlineFiles';
