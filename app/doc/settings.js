// //  // Debug
// var doc_config = {
// 	apiKey: "AIzaSyDJnCE34jNQ8mfQAcBt1zlGj5CJZwaOYfM",
// 	authDomain: "pcsd-app.firebaseapp.com",
// 	databaseURL: "https://pcsd-app.firebaseio.com",
// 	projectId: "pcsd-app",
// 	storageBucket: "pcsd-app.appspot.com",
// 	messagingSenderId: "687215095072"
// };

//// Realese
var doc_config = {
	apiKey: "AIzaSyCELuc2f0_CcV35xeHid9-iFHU7hbrNPKg",
	authDomain: "document-network.firebaseapp.com",
	databaseURL: "https://document-network.firebaseio.com",
	projectId: "document-network",
	storageBucket: "document-network.appspot.com",
	messagingSenderId: "583848541283"
};

var docFire = firebase.initializeApp(doc_config, 'doc');

docFire.firestore().settings({
	cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
docFire.firestore().enablePersistence({synchronizeTabs:true});

var doc = {};
doc.db = docFire.firestore();
doc.fun = docFire.functions();
const acc = 'accounts';
const agencies = 'agencies';
const documents = 'documents';
const doc_transactions = 'doc_transactions';
const offlineFiles = 'offlineFiles';
const storageFolder = (os.platform() == 'win32')? app.getPath('downloads') + '\\document_network\\' : app.getPath('downloads') + '/document_network/';
