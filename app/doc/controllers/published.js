'use strict';

myAppModule.controller('doc_ctrl_published', function ($scope, $timeout, $utils, $mdToast,$mdDialog, func, $localStorage) {
    $scope.receipients = ($localStorage.doc_receipients)? $localStorage.doc_receipients : [];
    $scope.filtered_receipients = [];
    $scope.reciepientList = [];
    $scope.sendingRemarks = '';
    $scope.send_as = $localStorage.doc_send_as;
    let reciepientRules = {

    };
    func.$scope = $scope;
    
    $scope.loadReciepients = (a,b) => {
        doc.db.collection(acc).where(`${b}.active`,"==",true).onSnapshot(qs => {
            if(!qs.empty) {
                let r = qs.docs.map(d => {
                    let o = d.data();
                    o.id = d.id;
                    return o;
                });
                $scope.receipients = r;
                $localStorage.doc_receipients = r;
                $scope.$apply();
            }
        });
        for (const k in a) {
            if($localStorage.doc_send_as == undefined) {
                $localStorage.doc_send_as = k;
                $scope.send_as = k;
            }
        }
    };

    $scope.openSendDocument = (item,evt) =>{
        $scope.showPrerenderedDialog(evt,'sendDocument');
    };

    $scope.filterReciepient = () => {
        let currentItem = $scope.currentItem;
        $scope.filtered_receipients = [];
        $scope.filtered_receipients = $scope.receipients.filter( a => {
            if(!a[currentItem.agency.id]['active']) {
                return false;
            }
            if($scope.send_as == 'front_office' || $scope.send_as == 'registry'){
                return ( a[currentItem.agency.id]['staff'] || a[currentItem.agency.id]['office_head'] || a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['division_head'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['registry'] );
            } else if($scope.send_as == 'division_head'){
                return ( a[currentItem.agency.id]['staff'] || a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['division_head'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['registry'] );
            } else if($scope.send_as == 'office_head'){
                return ( a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['office_head'] || a[currentItem.agency.id]['registry'] );
            } else if($scope.send_as == 'department_head'){
                return ( a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['office_head'] || a[currentItem.agency.id]['division_head'] || a[currentItem.agency.id]['registry'] );
            } else if($scope.send_as == 'admin'){
                return true;
            } else if($scope.send_as == 'staff'){
                return ( a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['staff'] || a[currentItem.agency.id]['division_head'] );
            }
            return false;
        } );
    };

    $scope.sendAsSelected = (a) => {
        $scope.reciepientList = [];
        $localStorage.doc_send_as = a;
        setTimeout($scope.filterReciepient, 200);
    };

    $scope.backToDraft = (item,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Pulling Back to Draft.`)
          .textContent('All data and connections will be reset to DRAFT state.')
          .ariaLabel('backt to draft')
          .targetEvent(ev)
          .ok('I understand the risk, pull back now!')
          .cancel('Cancel');
        $mdDialog.show(confirm).then( async () => {
            let u = {'status':'draft', 'meta': {} };
            doc.db.collection(documents).doc(item.id).update(u);
            item.status = 'draft';
            $scope.setCurrentItem($scope.currentItem,'draft');
            console.log($scope.currentClicked,$scope.currentDocSelected);
        },()=>{});
    };

    $scope.previewFile = (path) => {
        shell.openItem(storageFolder + path);
    };

    $scope.sendThisDocument = (item, reciepients, r) => {
        let remarks = r;
        //create transactions
        reciepients.map( a => {
            let accessTypes = [];
            for (const k in $scope.doc_user[item.agency.id]) {
                accessTypes.push(k);
            }
            doc.db.collection(doc_transactions).add({
                document : item,
                status : 'pending',
                sender : {
                    id : $scope.doc_user.id,
                    contact : ($scope.doc_user.contact == undefined)? '':$scope.doc_user.contact,
                    email : ($scope.doc_user.email == undefined)? '':$scope.doc_user.email,
                    info : ($scope.doc_user.info == undefined)? '': $scope.doc_user.info,
                    access : accessTypes,
                    name : $scope.doc_user.name
                },
                receiver : a,
                'remarks' : remarks,
                time : Date.now(),
                date : $scope.date_now()
            });
            //update document for current receipients
            doc.db.collection(documents).doc(item.id).update({
                last_sent_time : Date.now(),
                receipients : firebase.firestore.FieldValue.arrayUnion(a)
            });
            return a;
        } );

        setTimeout( () => {
            $scope.toast(`Sent to ${reciepients.length} receipients.`);
        }, 1000 );

        //close and reset variables
        $scope.reciepientList = [];
        $scope.sendingRemarks = '';
        $scope.close_dialog();
    };

});