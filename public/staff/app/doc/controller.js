'use strict';

document.write(`<script src="./app/doc/settings.js"></script>`);
document.write(`<script src="./app/doc/functions.js"></script>`);

myAppModule.controller('doc_controller', function ($scope, $timeout, $interval, $mdDialog, $mdSidenav, $localStorage, func, $http) {
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
    $scope.doc_user_agencies = [];
    $scope.docTabsSelected = 0;
    $scope.n = {};
    const userId = `pcsd_${$scope.user.id}`; //id from pcsd web api , (php), that will be saved to accounts collection
    $scope.userId = userId;
    $scope.doc_user = ($localStorage.doc_user == undefined)? { id: userId } : $localStorage.doc_user; //save data to local storage to remember last user
    
    //Download Document Templates
    $scope.document_templates = [];//($localStorage.document_templates == undefined)? [] : $localStorage.document_templates;
    //https://document-network.web.app/pcsd/templates/items8.json
    $http.get('./app/templates/templates/items.json').then((data)=>{
        $localStorage.document_templates = data.data.data;
        $scope.document_templates = data.data.data;
    }, ()=>{});

    $scope.request_types = [
        'service','man power', 'data or e-file', 'report', 'file', 'information'
    ];
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
        }else {
            $localStorage.currentItem = undefined;
            $localStorage.myDrafts = [];
            $scope.myDrafts = [];
            if($scope.currentClicked == 'draft')
                $scope.currentItem = null;
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
    $scope.removeFromPending = (id) => {
        $scope.myPending = $scope.myPending.filter( i => (i.id != id) );
    };

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

    $scope.getCurrentClicked = (c) => {
        return ($scope.currentClicked == c);
    };

    $scope.setLocal = (key,value) => {
        $localStorage[key] = value;
        initN();
    };

    $scope.getLocal = (key) => {
        return $localStorage[key];
    };

    $scope.doc_init = () => {
        //imidiate display, to prevent loading
        if($localStorage.doc_user !== undefined) {
            $scope.doc_content = 'app/doc/views/dashboard.html';
            // func.checkDraft((a,b) => {
            //     $scope.myDrafts = a;
            //     $scope.currentItem = b;
            //     $scope.currentClicked = 'draft';
            //     $scope.currentDocSelected = 'draft';
            // });
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
                        if($scope.currentClicked == 'draft' && $scope.currentItem != undefined)
                            $scope.currentItem.agency = b[0];
                    });
                    return null;
                });
                // func.checkDraft((a,b) => {
                //     $scope.myDrafts = a;
                //     $scope.currentItem = b;
                //     $scope.currentClicked = 'draft';
                //     $scope.currentDocSelected = 'draft';
                // });
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
        $scope.n = { created : d, published : d, keywords : [], category : 'none', 
            template : ($localStorage.currentDocTemplate) ? $localStorage.currentDocTemplate: {} };
        
        $scope.showPrerenderedDialog(evt,'addDraft');
        
    };

    function initN(){
        let d = $scope.date_now('YYYY-MM-DD');
        $scope.dateA = d;
        $scope.dateB = d;
        $scope.n = { created : d, published : d, keywords : [], category : 'none', 
            template : ($localStorage.currentDocTemplate) ? $localStorage.currentDocTemplate: {} };
        console.log($scope.n)
    }

    $scope.onDraftCreated = (draft) => {
        
    }
    $scope.createDraft = async (x) => {
        console.log(x);
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
            if($scope.doc_user_agencies.length > 0 ){
                $scope.currentItem.agency = $scope.doc_user_agencies[0];
            }
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
        if($scope.currentNavItem == 'Documents'){
            setTimeout(()=>{func.refreshDocItem(x.id, (a) => {
                $scope.currentItem = a;
                $scope.$apply();
            });},300);
        }
        $scope.currentItem = x;
        $scope.currentClicked = t;
        $scope.currentTransaction = c;
        $localStorage.currentItem = x;
    }


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


    $scope.print_document = (id)=>{
        // console.log('to print: ', id);
        func.refreshDocItem(id, (a) => {
            $scope.render_params = { data: $scope.currentItem };
            $scope.setCurrentItem($scope.currentItem, 'print');
            // $scope.open_window_view(a.template.print, a);
            // var view = { view: a.template.print };
            // window.open('app/templates/print/index.html?'+ $.param(view));
        });
        
    };

    // for application sync
    $scope.getApplicationDocuments = async ()=>{
        let applicationNumber = $scope.application.date;
        let qs = await doc.db.collection(documents)
        .where("application_no","==",applicationNumber)
        .get();
        
        if(!qs.empty) {
            let r = qs.docs.map(d => {
                let o = d.data();
                o.id = d.id;
                return o;
            });
            $scope.application_documents = r;
            $scope.$apply();
        }else {
            $scope.application_documents = [];
        }
        
        $timeout(()=>{
            $scope.getApplicationDocuments();
        },1500);
    };

    $scope.application_view_modal = '';
    $scope.select_document_for_application = (ev,x)=>{
        $scope.setCurrentItem(x,'draft');
        console.log('selected item: ',x);
        if(x.status == 'draft'){
            $scope.application_view_modal = './app/templates/modal/edit_document.html';
            $timeout(()=>{
                $scope.showPrerenderedDialog(ev,'editDocument');
            },300);
        }else if(x.status == 'published'){
            $scope.application_view_modal = './app/templates/modal/view_document.html';
            $timeout(()=>{
                $scope.showPrerenderedDialog(ev,'viewDocument');
            },300);
        }
    };

    $scope.name_spliter = (name)=>{
        let s = name.split(' ');
        s.reduce(o => o != "" || " ");
        return s;
    };

    $scope.applicant_name = [];
    $scope.no_pending_case_data = {};
    $scope.certificate_of_inspection_data = {};
    $scope.transport_date = '';
    $scope.issuance_date = '';
    $scope.day = $scope.date_now('DD');
    $scope.month = $scope.date_now('MMMM');
    $scope.year = $scope.date_now('YYYY');

    $scope.format_specimen = (species)=>{
        let newArray = [];
        if(species != undefined){
            species.map( o => {
                let item = {
                    name : o.species_name,
                    quantity : o.species_qty,
                    description : o.species_des
                };
                if(o.species_boxes)
                    item.remarks = `${o.species_boxes} box` + ((o.species_boxes.length > 1) ? `'es`:``);
                newArray.push(item);
            } );
        }
        return newArray;
    };

    $interval(()=>{ 
        $localStorage.loaded_data_requirements = false;
    },1500); // loop

    $scope.load_data_requirements = async()=>{
        var  requirements_loaded = await $localStorage.loaded_data_requirements;
        if(!requirements_loaded){
            $scope.applicant_name = $scope.name_spliter($scope.application.data.application.applicant);
            //start no pending case
            $scope.no_pending_case_data = {
                template : {
                    'name' : 'Certificate of no-pending Case',
                    'type' : 'certificate_of_no_pending_case',
                    'create' : './app/templates/templates/certificate_npc/create.html',
                    'edit' : './app/templates/templates/certificate_npc/edit.html',
                    'view' : './app/templates/templates/certificate_npc/view.html',
                    'print' : './app/templates/templates/certificate_npc/print.html'
                },
                created : $scope.date_now('YYYY-MM-DD'),
                published : $scope.date_now('YYYY-MM-DD'),
                category : 'certificate_of_no_pending_case',
                keywords : $scope.applicant_name,
                application_no : $scope.application.date,
                applicant_f_name : $scope.applicant_name[0],
                applicant_m_name : ($scope.applicant_name.length > 2)? $scope.applicant_name[1] : '',
                applicant_l_name : ($scope.applicant_name.length >= 3)? $scope.applicant_name[2] : '',
                address : $scope.application.data.application.applicant_address
            };
            
            // end

            // start certificate of inspection
            if($scope.application.name == 'Application for Local Transport Permit RFF' || $scope.application.name == 'Application for Local Transport Permit AO12'){
                $scope.certificate_of_inspection_data = {
                    template : {
                        'name' : 'Certificate of Inspection (LTP)',
                        'type' : 'certificate_of_inspection_ltp_ao12',
                        'permit' : true,
                        'create' : './app/templates/templates/ltp_wildlife/certificate/create.html',
                        'edit' : './app/templates/templates/ltp_wildlife/certificate/edit.html',
                        'view' : './app/templates/templates/ltp_wildlife/certificate/view.html',
                        'print' : './app/templates/templates/ltp_wildlife/certificate/print.html'
                    },
                    created : $scope.date_now('YYYY-MM-DD'),
                    published : $scope.date_now('YYYY-MM-DD'),
                    category : 'certificate_of_inspection_ltp_ao12',
                    keywords : $scope.applicant_name,
                    application_no : $scope.application.date,
                    applicant_f_name : $scope.applicant_name[0],
                    applicant_m_name : ($scope.applicant_name.length > 2)? $scope.applicant_name[1] : '',
                    applicant_l_name : ($scope.applicant_name.length > 3)? $scope.applicant_name[2] : '',
                    applicant_name : $scope.application.data.application.applicant,
                    species : $scope.format_specimen($scope.application.data.application.specimen),
                    origin : $scope.application.data.application.place_of_origin.barangay + ', ' + $scope.application.data.application.place_of_origin.municipality,
                    recipient_name : $scope.application.data.application.recipient.name,
                    transportation_vessel : ($scope.application.data.application.via.aircraft)? 'aircraft': 'vessel'
                };
                $scope.transport_date = $scope.application.data.application.date_of_transport;
                $scope.issuance_date = $scope.date_now();
            }else {
                $scope.certificate_of_inspection_data = {};
            }
            //end
            $localStorage.loaded_data_requirements = true;
        }
        
        $timeout(()=>{ 
            $scope.load_data_requirements();
        },(Math.random() * 5000) ); // loop
    };

    // end for application sync
    $scope.setCurrentItem($scope.currentItem, 'published')
    $scope.toggleLeft();

}).
controller('print_controller', function($scope) {
    $scope.printTemplate = () => {
        var header = "<html>";
        header += "<head>";
        header += "<title>";
        header += "Print";
        header += "</title>";
        header += '<script src="/js/angular.min.js"></script>';
        header += '<link href="/css/angular-material.min.css" rel="stylesheet">';
        header += '<link href="/css/theme.css" rel="stylesheet" />';
        header += '<link href="/css/angular-material.min.css" rel="stylesheet">';
        header += '<link href="/css/ng-table.min.css" rel="stylesheet">';
        header += '<link href="/plugins/bootstrap/4.1.1/bootstrap.min.css" rel="stylesheet"></link>';
        header += '<script src="/plugins/ckeditor/ckeditor.js"></script>';
        header += "</head>";
        var body = "<body>";
        var template = document.getElementById('printBody');
        body += template.innerHTML;
        body += "</body>";
        var footer = "</html>";
        var html = `${header} ${body} ${footer}`;
        var printWindow = window.open();
        printWindow.document.write(html);
        // printWindow.print();
        // printWindow.close();
    }
    
    angular.element(document).ready(function(){
        setTimeout(function(){
            $scope.printTemplate();
        }, 1000);
    })
});

document.write(`<script src="./app/doc/controllers/files.js"></script>`);
document.write(`<script src="./app/doc/controllers/draft.js"></script>`);
document.write(`<script src="./app/doc/controllers/published.js"></script>`);
document.write(`<script src="./app/doc/controllers/pending.js"></script>`);
document.write(`<script src="./app/doc/controllers/actions.js"></script>`);
document.write(`<script src="./app/doc/controllers/gratuitous.js"></script>`);

