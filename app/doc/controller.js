'use strict';

document.write(`<script src="./app/doc/settings.js"></script>`);
document.write(`<script src="./app/doc/functions.js"></script>`);

myAppModule.controller('doc_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $localStorage, func) {
    $scope.doc_content = '';
    $scope.isLoading = true;
    $scope.isUploading = false;
    $scope.currentNavItem = 'Documents';
    $scope.currentDocSelected = 'draft';
    $scope.currentClicked = 'draft';
    $scope.currentItem = ($localStorage.currentItem == undefined)? null : $localStorage.currentItem;
    $scope.currentSubItem = {};
    $scope.currentSubIndex = {};
    $scope.currentTransaction = {};
    $scope.myAgencies = [];
    $scope.otherAgencies = [];
    $scope.resultAccounts = [];
    $scope.agencyAccounts = [];
    $scope.filesTobeUploaded = [];
    $scope.myDrafts = ($localStorage.myDrafts == undefined)? [] : $localStorage.myDrafts;
    $scope.myPublished = [];
    $scope.mySent = [];
    $scope.myReceived = [];
    $scope.myPending = [];
    $scope.docTabsSelected = 0;
    $scope.n = {};
    const userId = `pcsd_${$scope.user.id}`; //id from pcsd web api , (php), that will be saved to accounts collection
    $scope.userId = userId;
    $scope.doc_user = ($localStorage.doc_user == undefined)? { id: userId } : $localStorage.doc_user; //save data to local storage to remember last user
    $scope.dateA = '';
    $scope.dateB = '';
    func.$scope = $scope;

    // draft 
    doc.db.collection(documents).where("status","==","draft").where("publisher","==",userId).onSnapshot(qs => {
        if(!qs.empty) {
            let r = qs.docs.map(d => {
                let o = d.data();
                o.id = d.id;
                return o;
            });
            $scope.myDrafts = $localStorage.myDrafts = r;
        }
    });

    //Published 
    doc.db.collection(documents).where("status","==","published").where("publisher","==",userId).orderBy('meta.published_time','desc')
    .onSnapshot(qs => {
        if(!qs.empty) {
            let r = qs.docs.map(d => {
                let o = d.data();
                o.id = d.id;
                return o;
            });
            $scope.myPublished = r;
        }
    });

    //pending
    doc.db.collection(doc_transactions).where('receiver','==',$scope.userId).orderBy('time','desc').where('status','==','pending')
    .onSnapshot( qs => {
        if(!qs.empty) {
            let a = qs.docs.map(
                dx => {
                    let b = dx.data();
                    b.id = dx.id;
                    return b;
                }
            );
            $scope.myPending = a;
        }
    });

    //received
    doc.db.collection(doc_transactions).where('receiver','==',$scope.userId).orderBy('received.time','desc').where('status','==','received')
    .onSnapshot( qs => {
        if(!qs.empty) {
            let a = qs.docs.map(
                dx => {
                    let b = dx.data();
                    b.id = dx.id;
                    return b;
                }
            );
            $scope.myReceived = a;
        }
    });

    //sent
    doc.db.collection(doc_transactions).where('sender.id','==',$scope.userId).orderBy('time','desc')
    .onSnapshot( qs => {
        if(!qs.empty) {
            let a = qs.docs.map(
                dx => {
                    let b = dx.data();
                    b.id = dx.id;
                    return b;
                }
            );
            $scope.mySent = a;
        }
    });

    $scope.getUserAccount = async (id,idx) => {
        let a = await doc.db.collection(acc).doc(id).get();
        let b = a.data();
        b.id = a.id;
        $scope.mySent[idx].sentUser = b;
    };

    $scope.doc_init = () => {
        //imidiate display, to prevent loading
        if($localStorage.doc_user !== undefined) {
            $scope.doc_content = 'app/doc/views/dashboard.html';
            func.checkDraft((a,b) => {
                $scope.myDrafts = a;
                $scope.currentItem = b;
                $scope.currentClicked = 'draft';
                $scope.currentDocSelected = 'draft';
            });
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
                    func.listenToAccountChange(doc.id, (a,b) => {
                        $scope.doc_user = a;
                        $scope.doc_user_agencies = b;
                    });
                    return null;
                });
                func.checkDraft((a,b) => {
                    $scope.myDrafts = a;
                    $scope.currentItem = b;
                    $scope.currentClicked = 'draft';
                    $scope.currentDocSelected = 'draft';
                });
            }
        } ).catch( ()=> {
            setTimeout($scope.doc_init, 3000);
        });
    };

    $scope.loadAgencies = () => {
        func.getAgencies($scope.doc_user.agencies, (a,b) => {
            $scope.myAgencies = a;
            $scope.otherAgencies = b;
        });
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
        func.checkDraft((a,b) => {
            $scope.myDrafts = a;
            $scope.currentItem = b;
        });
        if(nav == 'Agencies') func.getAgencies($scope.doc_user.agencies, (a,b) => {
            $scope.myAgencies = a;
            $scope.otherAgencies = b;
        });
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
        setTimeout(()=>{
            func.getAgencies($scope.doc_user.agencies, (a,b) => {
                $scope.myAgencies = a;
                $scope.otherAgencies = b;
            })
        },3000);
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
        let d = $scope.date_now('YYYY-MM-DD');
        $scope.dateA = d;
        $scope.dateB = d;
        $scope.n = { created : d, published : d};
        $scope.showPrerenderedDialog(evt,'addDraft');
    };

    $scope.createDraft = async (x) => {
        if($scope.doc_user.id !== undefined) {
            x.publisher = $scope.doc_user.id;
            x.created_time = Date.now();
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
            $scope.myDrafts.push(x);
            $scope.myDrafts = $localStorage.myDrafts = await func.getMyDrafts();
        }else {
            $scope.toast("system error, please re-boot this app.")
        }
        
    };



    $scope.uploadFiles = async () => {
        $scope.filesTobeUploaded = await func.getFilesTobeUploaded();
        if($scope.filesTobeUploaded.length > 0){
            func.uploadFile($scope.filesTobeUploaded[0], () => { $scope.uploadFiles(); });
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

    $scope.setCurrentItem = (x,t,c) => {
        $scope.currentItem = x;
        $scope.currentClicked = t;
        $scope.currentTransaction = c;
    }

    $scope.updateCleanDocFiles = (id,cF) => {
        cF = cF.map( d => { delete(d['$$hashKey']); return d; })
        $scope.updateDocument(id,{'files': cF});
    };


    $scope.changeCurrentDocType = (t) => {
        $scope.currentDocSelected = t;
    }

    $scope.check_pending = (evt) => {
        setTimeout( () => {
            if($scope.myPending.length > 0) {
                $scope.showPrerenderedDialog(evt,'pendingDocument');
            }
        },5000);
        
    };

});

document.write(`<script src="./app/doc/controllers/files.js"></script>`);
document.write(`<script src="./app/doc/controllers/draft.js"></script>`);
document.write(`<script src="./app/doc/controllers/published.js"></script>`);
document.write(`<script src="./app/doc/controllers/pending.js"></script>`);
document.write(`<script src="./app/doc/controllers/received.js"></script>`);