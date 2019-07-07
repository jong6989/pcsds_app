'use strict';
//  // Debug
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
const offlineFiles = 'offlineFiles';
const storageFolder = (os.platform() == 'win32')? app.getPath('downloads') + '\\document_network\\' : app.getPath('downloads') + '/document_network/';

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
    $scope.filesTobeUploaded = [];
    $scope.myDrafts = [];
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

    func.getMyDrafts = async () => {
        let res = await doc.db.collection(documents).where("status","==","draft").where("publisher","==",userId).get();
        let r = res.docs.map( doc => { let o = doc.data(); o.id = doc.id; return o; });
        return r;
    }

    func.checkDraft = async () => {
        if(userId !== undefined) {
            $scope.myDrafts = await func.getMyDrafts();
            if($scope.myDrafts.length > 0) {
                $scope.currentItem = $scope.myDrafts[0];
            }else {
                $scope.currentItem = null;
            }
        }
    };

    func.getFilesTobeUploaded = async () => {
        let res =   await doc.db.collection(acc).doc(userId).collection(offlineFiles).where("uploaded","==",false).get();
        let d = res.docs.map( doc => { 
            let o = doc.data();
            o.id = doc.id;
            return o;
        });
        return d;
    };

    func.upload = (files,callBack) => {
        let dateNow = new Date();
        const divider = (os.platform() == 'win32')? '\\' : '/';
        const saveFolder = dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider + dateNow.getDate() + divider + userId + divider;
        if(!fs.existsSync(storageFolder)){
            fs.mkdirSync(storageFolder);
        }
        if(!fs.existsSync(storageFolder + dateNow.getFullYear()+divider)){
            fs.mkdirSync(storageFolder + dateNow.getFullYear()+divider);
        }
        if(!fs.existsSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider)){
            fs.mkdirSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider);
        }
        if(!fs.existsSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider + dateNow.getDate() + divider)){
            fs.mkdirSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider + dateNow.getDate() + divider);
        }
        if(!fs.existsSync(storageFolder + saveFolder)){
            fs.mkdirSync(storageFolder + saveFolder);
        }
        files.forEach(f => {
            setTimeout( () => {
                let path = storageFolder + saveFolder + f.name;
                fs.copyFile(f.path, path, (err) => {
                    if (err) throw err;
                    doc.db.collection(acc).doc(userId).collection(offlineFiles).add({"name":f.name,"path": saveFolder + f.name, "uploaded": false});
                    callBack(saveFolder + f.name,f.name);
                });
            },500);
        });
    }

    func.uploadFile = (f) => {
        console.log(`uploading ${f.name}:`)
        let form = $utils.upload((data,code)=>{
            console.log(`done ${code}:`);
            $scope.uploadFiles();
            if(code == 200){
                if(data.status == 1){
                    doc.db.collection(acc).doc(userId).collection(offlineFiles).doc(f.id).update({"uploaded": true});
                }else {
                    $scope.toast("error uploading");
                    console.log(data);
                }
            }
        });
        form.append('action', 'file/doc_upload');
        form.append('userPath', f.path);
        form.append('file',  fs.createReadStream(storageFolder + f.path), {filename: f.name});
    }
    
    func.refreshDocItem = (id) => {
        doc.db.collection(documents).doc(id).get().then(doc => {
            let d = doc.data();
            if(d.status !== 'archived'){
                $scope.currentItem = d;
                $scope.currentItem.id = doc.id;
                $scope.$apply();
            }
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
        // $scope.currentItem = null;
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

    $scope.createDraft = async (x) => {
        if($scope.doc_user.id !== undefined) {
            x.publisher = $scope.doc_user.id;
            x.status = 'draft';
            if( $scope.doc_user.categories === undefined || !$scope.doc_user.categories.includes(x.category) ) {
                doc.db.collection(acc).doc($scope.doc_user.id)
                .update({"categories": firebase.firestore.FieldValue.arrayUnion(x.category)});
            }

            doc.db.collection(documents).add(x).then( ref => {
                $scope.currentItem.id = ref.id;
                console.log(ref.id);
                doc.db.collection(documents).doc(ref.id).update({"id":ref.id});
            });

            $scope.currentClicked = 'draft';
            $scope.currentItem = x;
            $scope.close_dialog();
            $scope.toast(`Draft document created.`);
            $scope.myDrafts = await func.getMyDrafts();
        }else {
            $scope.toast("system error, please re-boot this app.")
        }
        
    };

    $scope.upload_file = (id,files)=>{
        if(files !== undefined && id !== undefined){
            func.upload(files, (url,fileName) => {
                $scope.uploadFiles();
                const fileObject = {"name": fileName, "url": api_address + '/uploads/' + url,"path": url, "opened": false};
                $scope.updateDocument(id,{ "files": firebase.firestore.FieldValue.arrayUnion(fileObject) });
            });
        }
    };

    $scope.updateDocument = async (id,data) => {
        if(id !== undefined) {
            func.updateDoc(id,data, () => {
                func.refreshDocItem(id);
            });
            setTimeout(()=>{func.refreshDocItem(id);},300);
            $scope.myDrafts = await func.getMyDrafts();
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
            $scope.updateDocument(id,{
                "files" : firebase.firestore.FieldValue.arrayRemove(x)
            });
        },()=>{});
    };

    $scope.deleteDraft = (id,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Delete this Draft Document?`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(ev)
          .ok('Yes, Delete now')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.currentItem = null;
            $scope.updateDocument(id,{'status':'archived'});
        },()=>{});
    };

    $scope.uploadFiles = async () => {
        $scope.filesTobeUploaded = await func.getFilesTobeUploaded();
        if($scope.filesTobeUploaded.length > 0){
            func.uploadFile($scope.filesTobeUploaded[0]);
        }
    };
    $scope.uploadFiles();
    setTimeout($scope.uploadFiles,10000);

    $scope.checkIfUploaded = (path) => {
        let r = true;
        $scope.filesTobeUploaded.forEach(f => {
            if( f.path === path) {
                r = f.uploaded;
            }
        });
        return r;
    };

    $scope.setCurrentItem = (x) => {
        $scope.currentItem = x;
    }

    $scope.openFile = (id,path,cF) => {
        $scope.updateDocument(id,{'files': cF});
        shell.openItem(storageFolder + path);
    };

    $scope.refreshFile = (id,x,cF) => {
        x.path = storageFolder + x.path;
        $scope.updateDocument(id,{'files': cF});
        $scope.upload_file(id,[x]);
    };

});