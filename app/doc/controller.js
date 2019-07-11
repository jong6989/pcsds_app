'use strict';

document.write(`<script src="./app/doc/settings.js"></script>`);
myAppModule.controller('doc_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $localStorage) {
    $scope.doc_content = '';
    $scope.isLoading = true;
    $scope.isUploading = false;
    $scope.currentNavItem = 'Documents';
    $scope.currentDocSelected = 'Draft';
    $scope.currentClicked = 'draft';
    $scope.currentItem = ($localStorage.currentItem == undefined)? null : $localStorage.currentItem;
    $scope.currentSubItem = {};
    $scope.currentSubIndex = {};
    $scope.myAgencies = [];
    $scope.otherAgencies = [];
    $scope.resultAccounts = [];
    $scope.agencyAccounts = [];
    $scope.filesTobeUploaded = [];
    $scope.myDrafts = ($localStorage.myDrafts == undefined)? [] : $localStorage.myDrafts;
    $scope.docTabsSelected = 0;
    $scope.n = {};
    const userId = `pcsd_${$scope.user.id}`; //id from pcsd web api , (php), that will be saved to accounts collection
    $scope.userId = userId;
    $scope.doc_user = ($localStorage.doc_user == undefined)? { id: userId } : $localStorage.doc_user; //save data to local storage to remember last user
    $scope.dateA = '';
    $scope.dateB = '';
    var func = {};

    func.updateDoc = (id,data,callBack) => {
        doc.db.collection(documents).doc(id).update(data).then(callBack);
    };

    func.getMyDrafts = async () => {
        let res = await doc.db.collection(documents).where("status","==","draft").where("publisher","==",userId).get();
        let r = res.docs.map( doc => { let o = doc.data(); o.id = doc.id; return o; });
        return r;
    }

    func.getFilesTobeUploaded = async () => {
        let res =   await doc.db.collection(acc).doc(userId).collection(offlineFiles).where("uploaded","==",false).get();
        let d = res.docs.map( doc => { 
            let o = doc.data();
            o.id = doc.id;
            return o;
        });
        return d;
    };

    func.listenToAccountChange = (id) => {
        doc.db.collection(acc).doc(id).onSnapshot( doc => {
            $scope.doc_user = $localStorage.doc_user = doc.data();
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

    func.checkDraft = async () => {
        if(userId !== undefined) {
            $scope.myDrafts = $localStorage.myDrafts = await func.getMyDrafts();
            if($scope.myDrafts.length > 0) {
                $scope.currentItem = $localStorage.currentItem = $scope.myDrafts[0];
            }else {
                $scope.currentItem = $localStorage.currentItem = null;
            }
        }
    };

    //Create a directory to "My Downloads" and make a copy of the selected file
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

    //uploads are to PCSD website , pcsd.gov.ph , with unlimited storage
    func.uploadFile = (f) => {
        if(fs.existsSync(storageFolder + f.path)){
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
    }
    
    func.refreshDocItem = (id) => {
        doc.db.collection(documents).doc(id).get().then(doc => {
            let d = doc.data();
            if(d.status !== 'archived'){
                $scope.currentItem = d;
                $scope.currentItem.id = doc.id;
                $localStorage.currentItem = $scope.currentItem;
                $scope.$apply();
            }
        });
    };

    $scope.doc_init = () => {
        //imidiate display, to prevent loading
        if($localStorage.doc_user !== undefined) {
            $scope.doc_content = 'app/doc/views/dashboard.html';
            func.checkDraft();
            $scope.isLoading = false;
        }
        //checking user if account activated
        doc.db.collection(acc).where('id','==',userId).get().then( qs => {
            $scope.isLoading = false;
            if(qs.empty) {
                $scope.doc_content = 'app/doc/views/register.html';
            } else {
                $scope.doc_content = 'app/doc/views/dashboard.html';
                qs.forEach(doc => {
                    $scope.doc_user = $localStorage.doc_user = doc.data();
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
        $scope.currentItem = $localStorage.currentItem = x;
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
        delete($scope.dateA);
        delete($scope.dateB);
        $scope.dateA = $scope.date_now();
        $scope.dateB = $scope.date_now();
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
            $scope.myDrafts.push(x);
            $scope.myDrafts = $localStorage.myDrafts = await func.getMyDrafts();
        }else {
            $scope.toast("system error, please re-boot this app.")
        }
        
    };

    $scope.upload_file = (id,files,isRefresh)=>{
        if(files !== undefined && id !== undefined){
            func.upload(files, (url,fileName) => {
                $scope.uploadFiles();
                const fileObject = {"name": fileName, "url": api_address + '/uploads/' + url,"path": url, "opened": false};
                if($scope.currentItem.files == undefined) {
                    $scope.currentItem.files = [];
                    $scope.currentItem.files.push(fileObject);
                    $scope.updateDocument(id,{'files': $scope.currentItem.files});
                }else {
                    if(!isRefresh){
                        $scope.currentItem.files.push(fileObject);
                        $scope.updateDocument(id,{'files': $scope.currentItem.files});
                    }
                }
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
            $scope.currentItem.files = $scope.currentItem.files.filter( z => (z.path !== x.path))
                                            .map( d => { delete(d['$$hashKey']); return d; });
            $scope.updateDocument(id,{'files': $scope.currentItem.files});
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

    $scope.updateCleanDocFiles = (id,cF) => {
        cF = cF.map( d => { delete(d['$$hashKey']); return d; })
        $scope.updateDocument(id,{'files': cF});
    };

    $scope.openFile = (id,path,cF) => {
        $scope.updateCleanDocFiles(id,cF);
        shell.openItem(storageFolder + path);
    };

    $scope.refreshFile = (id,x,cF) => {
        $scope.updateCleanDocFiles(id,cF);
        let newPath = {};
        newPath = Object.create(x);
        newPath.path = storageFolder + x.path;
        $scope.upload_file(id,[newPath],true);
    };

});