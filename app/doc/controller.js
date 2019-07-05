'use strict';
 //// Debug
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
docFire.firestore().enablePersistence();

var doc = {};
var func = {};
doc.db = docFire.firestore();
doc.fun = docFire.functions();
const acc = 'accounts';
const agencies = 'agencies';
const documents = 'documents';

myAppModule.controller('doc_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $http) {
    $scope.doc_content = '';
    $scope.isLoading = true;
    $scope.isUploading = false;
    $scope.currentNavItem = 'Documents';
    $scope.currentDocSelected = 'Draft';
    $scope.currentClicked = 'draft';
    $scope.currentItem = null;
    $scope.currentSubItem = {};
    $scope.currentSubIndex = {};
    $scope.myAgencies = [];
    $scope.otherAgencies = [];
    $scope.resultAccounts = [];
    $scope.agencyAccounts = [];
    $scope.docTabsSelected = 0;
    $scope.n = {};
    const userId = `pcsd_${$scope.user.id}`;
    $scope.doc_user = {};
    

    func.listenToAccountChange = (id) => {
        doc.db.collection(acc).doc(id).onSnapshot( doc => {
            $scope.doc_user = doc.data();
        });
    };

    func.getAgencies = async () => {
        await doc.db.collection(agencies).get().then((qs) => {
            let a = [];
            let b = [];
            qs.forEach(doc => {
                if($scope.doc_user.agencies !== undefined) {
                    $scope.doc_user.agencies.forEach(agc => {
                        if(doc.id == agc){
                            a.push(doc.data());
                        }else {
                            b.push(doc.data());
                        }
                    });
                }else {
                    b.push(doc.data());
                }
            });
            $scope.myAgencies = a;
            $scope.otherAgencies = b;
        });
    };

    func.checkDraft = () => {
        if($scope.doc_user.id !== undefined) {
            doc.db.collection(documents).where("status","==","draft")
            .where("publisher","==",$scope.doc_user.id).get().then( qs => {
                if(!qs.empty) {
                    qs.forEach(doc => {
                        $scope.currentItem = doc.data();
                    });
                }
            });
        }
    };

    func.upload = (files,callBack) => {
        let uploadFile = (idx)=>{
            $scope.isUploading = true;
            let f = files[idx];
            console.log(`uploading ${f.name}:`)
            let form = $utils.upload((data,code)=>{
                $scope.isUploading = false;
                console.log(`done ${code}:`)
                if(code == 200){
                    if(data.status == 1){
                        callBack(data.data,f.name);
                    }
                    if(files.length !== (idx + 1) ){
                        uploadFile(idx + 1);
                    }
                }
            });
            form.append('action', 'file/doc_upload');
            form.append('file',  fs.createReadStream(f.path), {filename: f.name});
        };
        if(files.length > 0 ) uploadFile(0);
    }

    func.refreshDocItem = (id) => {
        doc.db.collection(documents).doc(id).get().then(doc => {
            $scope.currentItem = doc.data();
            $scope.$apply();
        });
    };

    func.updateDoc = (id,data,callBack) => {
        doc.db.collection(documents).doc(id).update(data).then(callBack);
    };

    $scope.doc_init = () => {
        doc.db.collection(acc).where('id','==',userId).get().then( qs => {
            $scope.isLoading = false;
            if(qs.empty) {
                $scope.doc_content = 'app/doc/views/register.html';
            } else {
                $scope.doc_content = 'app/doc/views/dashboard.html';
                qs.forEach(doc => {
                    $scope.doc_user = doc.data();
                    func.listenToAccountChange(doc.id);
                    return null;
                });
                func.checkDraft();
            }
        } ).catch( ()=> {
            setTimeout($scope.doc_init, 3000);
        });
    };

    $scope.loadAgencies = () => {
        func.getAgencies();
    };

    $scope.setAccount = (data) => {
        $scope.isLoading = true;
        data.id = userId;
        data.tags = data.name.split(' ');
        doc.db.collection(acc).doc(userId).set(data).then( () => {
            $scope.doc_content = 'app/doc/views/dashboard.html';
            $scope.isLoading = false;
        });
    };

    $scope.activeNav = (nav) => {
        $scope.currentClicked = 'draft';
        $scope.currentItem = null;
        func.checkDraft();
        if(nav == 'Agencies') func.getAgencies();
        $scope.togglePane();
    };

    $scope.togglePane = () => {
        $mdSidenav('dashSide').toggle();
    };

    $scope.clickAgencyItem = (x) => {
        $scope.currentClicked = 'agency';
        $scope.currentItem = x;
        $scope.getAgencyAccounts(x.id);
        $scope.togglePane();
    };

    $scope.getAccounts = () => {
        doc.db.collection(acc)
        .get().then( qs => {
            let a = [];
            qs.forEach(doc => {
                a.push(doc.data());
            });
            $scope.resultAccounts = a;
            $scope.$apply();
        });
    };

    $scope.getAgencyAccounts = (id) => {
        id = (id === undefined) ? $scope.currentItem.id : id;
        doc.db.collection(acc)
        .where('agencies','array-contains',id)
        .get().then( qs => {
            let a = [];
            qs.forEach(doc => {
                a.push(doc.data());
            });
            $scope.agencyAccounts = a;
            $scope.$apply();
        });
    };

    $scope.hasId = (id, list) => {
        if(list == undefined) return false;
        return (list.includes(id));
    };

    $scope.addToAgency = (t) => {
        let u = $scope.currentSubItem;
        let a = $scope.currentItem;
        let n = {};
        t.active = true;
        n[a.id] = t;
        n['agencies'] = firebase.firestore.FieldValue.arrayUnion(a.id);
        doc.db.collection(acc).doc(u.id).update(n).then(() => {
            $scope.getAccounts();
            $scope.getAgencyAccounts();
        });
        doc.db.collection(agencies).doc(a.id).update({"accounts": firebase.firestore.FieldValue.increment(1)});
        $scope.resultAccounts.splice($scope.currentSubIndex,1);
        $scope.close_dialog();
        $scope.toast(`${u.name} is added to ${a.short_name}.`);
        setTimeout(func.getAgencies,3000);
    };

    $scope.removeToAgency = (x,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Remove ${x.name} to ${$scope.currentItem.short_name}`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(ev)
          .ok('Yes, Remove now')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            doc.db.collection(acc).doc(x.id).update({
                "agencies" : firebase.firestore.FieldValue.arrayRemove($scope.currentItem.id)
            }).then( () => {
                $scope.getAccounts();
                $scope.getAgencyAccounts();
            }).catch((err)=>{console.log(err)});
            doc.db.collection(agencies).doc($scope.currentItem.id).update({"accounts": firebase.firestore.FieldValue.increment(-1)});
        },()=>{});
    };

    $scope.openAddToAgency = (x,idx,evt) =>{
        $scope.currentSubItem = x; 
        $scope.currentSubIndex = idx;
        $scope.showPrerenderedDialog(evt,'addToAgency');
    };

    $scope.openAddDraft = (evt) =>{
        delete($scope.n);
        $scope.n = {};
        $scope.showPrerenderedDialog(evt,'addDraft');
    };

    $scope.createDraft = (x) => {
        if($scope.doc_user.id !== undefined) {
            x.publisher = $scope.doc_user.id;
            x.status = 'draft';
            if( $scope.doc_user.categories === undefined || !$scope.doc_user.categories.includes(x.category) ) {
                doc.db.collection(acc).doc($scope.doc_user.id)
                .update({"categories": firebase.firestore.FieldValue.arrayUnion(x.category)});
            }

            doc.db.collection(documents).add(x).then( ref => {
                $scope.currentItem.id = ref.id;
                doc.db.collection(documents).doc(ref.id).update({"id":ref.id});
            });

            $scope.currentClicked = 'draft';
            $scope.currentItem = x;
            $scope.close_dialog();
            $scope.toast(`Draft document created.`);
        }else {
            $scope.toast("system error, please re-boot this app.")
        }
        
    };

    $scope.upload_file = (id,files)=>{
        if(files !== undefined && id !== undefined){
            func.upload(files, (url,fileName) => {
                const fileObject = {"name": fileName, "url": api_address + '/' + url};
                $scope.updateDocument(id,{ "files": firebase.firestore.FieldValue.arrayUnion(fileObject) });
            });
        }
    };

    $scope.updateDocument = (id,data) => {
        if(id !== undefined) {
            func.updateDoc(id,data, () => {
                func.refreshDocItem(id);
            });
        }
    };

    $scope.deleteDocFile = (id,x,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Remove File ${x.name}`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(ev)
          .ok('Yes, Remove now')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            delete(x['$$hashKey']);
            console.log(x);
            $scope.updateDocument(id,{
                "files" : firebase.firestore.FieldValue.arrayRemove(x)
            });
        },()=>{});
    };

    $scope.renameFile = (id,name,idx) => {
        let n = {};
        n[`files[${idx}].name`] = name;
        $scope.updateDocument(id,n);
    }

});