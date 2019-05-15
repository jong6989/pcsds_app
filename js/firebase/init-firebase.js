var config = {
	apiKey: "AIzaSyDJnCE34jNQ8mfQAcBt1zlGj5CJZwaOYfM",
	authDomain: "pcsd-app.firebaseapp.com",
	databaseURL: "https://pcsd-app.firebaseio.com",
	projectId: "pcsd-app",
	storageBucket: "pcsd-app.appspot.com",
	messagingSenderId: "687215095072"
};
firebase.initializeApp(config);

firebase.firestore().settings({
	cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

firebase.firestore().enablePersistence()

var db_list = ["transactions","datasets"];
var fire = {};
var db = firebase.firestore();

fire.create_user = function(email, password, callback){
	firebase.auth().createUserWithEmailAndPassword(email, password).catch(callback);
};

fire.login = function(user,email,callback){
	firebase.auth().signInWithEmailAndPassword(user, email).catch(callback);
};

fire.logout = (callback)=>{
	firebase.auth().signOut().then(callback).catch(function(error) {
			console.log(error)
	  });
}

fire.user_changed = (a,b)=>{
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
		  a(user)
		} else {
		  b()
		}
	  });
}

fire.db = {};
db_list.forEach(element => {
	fire.db[element] = {
		query : db.collection(element),
		get_all : (callback)=>{
			db.collection(element).get().then((querySnapshot) => {
				var d = [];
				querySnapshot.forEach(function(doc) {
					d.push(doc.data());
				});
				callback(d);
			  });
		},
		get : (id,callback,errorCallBack)=>{
			if(typeof id == typeof 1) id = `${id}`;
			db.collection(element).doc(id).get().then(function(doc) {
				if (doc.exists) {
					callback(doc.data())
				} else {
					callback(undefined)
				}
			}).catch(function(error) {
				errorCallBack(error)
			});
		},
		add : (data,callback,errorCallBack)=>{
			db.collection(element).add(data)
			.then(function(docRef) {
				callback(docRef.id)
			})
			.catch(function(error) {
				errorCallBack(error)
			});
		},
		set : (id,data)=>{
			if(typeof id == typeof 1) id = `${id}`;
			db.collection(element).doc(id).set(data)
		},
		update : (id,data)=>{
			if(typeof id == typeof 1) id = `${id}`;
			db.collection(element).doc(id).update(data)
		},
		when : (id,callback)=>{
			if(typeof id == typeof 1) id = `${id}`;
			return db.collection(element).doc(id)
			.onSnapshot(function(doc) {
				callback(doc.data());
			});
		},
		when_all : (callback)=>{
			return db.collection(element)
			.onSnapshot(function(snapshot) {
				var d = [];
				snapshot.forEach(function(doc) {
					d.push(doc.data());
				});
				callback(d);
			});
		}
	}
});