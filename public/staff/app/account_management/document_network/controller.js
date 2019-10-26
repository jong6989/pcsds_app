'use strict';

myAppModule.controller('document_network_management_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.network_offices = ($localStorage.network_offices)? $localStorage.network_offices : [];
    $scope.doc_net_accounts = [];
    $scope.currentSelectedAccount;
    $scope.currentItem;

    db.collection('agencies').onSnapshot( qs => {
        let idx = 0;
        let results = qs.docs.map( d => {
            let item = d.data();
            item.id = d.id;
            $scope.get_accounts_from_group(d.id,idx);
            idx++;
            return item;
        } );
        $scope.network_offices = results;
        $localStorage.network_offices = results;
        $scope.$apply();
    });

    db.collection('accounts').onSnapshot( qs => {
        let results = qs.docs.map( d => {
            let item = d.data();
            item.id = d.id;
            return item;
        } );
        $scope.doc_net_accounts = results;
        $scope.$apply();
    });

    $scope.get_accounts_from_group = async (office_id,idx)=>{
        let qs = await db.collection('accounts').where("agencies","array-contains",office_id).get();
        $scope.network_offices[idx].accounts = qs.size;
        $scope.$apply();
    };

    $scope.get_office = (id)=>{
        if(id){
            let office;
            $scope.network_offices.map( o => {
                if(o.id == id){
                    office = o;
                }
            } );
            return office;
        }else {
            return {};
        }
    };

    $scope.is_doc_activated = (id)=>{
        if(id){
            id = 'pcsd_' + id;
            let res = false;
            $scope.doc_net_accounts.map( o => {
                if(o.id == id){
                    $scope.currentSelectedAccount = o;
                    res = true;
                } 
            } );
            return res;
        }else {
            return false;
        }
    };

    $scope.create_group = ()=>{
        let LongName,ShortName;
        Swal.fire({
            title: 'Enter Group Name (Long Name)',
            input: 'text',
            inputAttributes: {
              autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'next',
            allowOutsideClick: () => !Swal.isLoading()
          }).then((result) => {
            if (result.value) {
                LongName = result.value;
                Swal.fire({
                    title: 'Enter abbr (Short Name)',
                    input: 'text',
                    inputAttributes: {
                      autocapitalize: 'off'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'submit',
                    allowOutsideClick: () => !Swal.isLoading()
                  }).then((result) => {
                    if (result.value) {
                        ShortName = result.value;
                        db.collection('agencies').add({ name : LongName, short_name: ShortName});
                        Toast.fire({
                            type: 'success',
                            title: 'Group Created!'
                        });
                    }else {
                        Swal.showValidationMessage(`Please enter a Short Name!`);
                    }
                  })
            }else {
                Swal.showValidationMessage(`Please enter a name!`);
            }
          })
    };

    $scope.openAddOfficeModal = (item,event)=>{
        $scope.currentItem = item;
        $scope.showPrerenderedDialog(event,'addToAgency');
    };

    $scope.addToAgency = async (t) => {
        $scope.close_dialog();
        let u = $scope.currentSelectedAccount;
        let a = $scope.currentItem;
        let n = {};
        t.active = true;
        n[a.id] = t;
        n['agencies'] = firebase.firestore.FieldValue.arrayUnion(a.id);
        try {
            await db.collection('accounts').doc(u.id).update(n);
            Toast.fire({
                type: 'success',
                title: 'Office Added!'
            });
        } catch (error) {
            alert(error)
        }
    };

    $scope.removeAgency = (id, agency_id)=>{
        Swal.fire({
            title: 'Remove Office from account.',
            text: "are you sure?",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove now!'
          }).then((result) => {
            if (result.value) {
                let updatable = {};
                updatable[agency_id] = firebase.firestore.FieldValue.delete();
                updatable['agencies'] = firebase.firestore.FieldValue.arrayRemove(agency_id);
                db.collection('accounts').doc(id).update(updatable);
                Toast.fire({
                    type: 'success',
                    title: 'Office Removed!'
                });
            }
          });
    };

    $scope.activate_docnet = (user)=>{
        db.collection('accounts').doc('pcsd_' + user.id).set({
            name : user.name,
            contact : user.phone,
            email : user.data.email
        });
        Toast.fire({
            type: 'success',
            title: 'Account Activated!'
        });
    };

    $scope.check_office_if_exist = (offices,name)=>{
        let exist = false;
        if(offices){
            offices.map( o => { 
                if( name == o) exist = true;
            });
        }
        return exist;
    };

});
