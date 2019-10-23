'use strict';

myAppModule.controller('account_management_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.users = ($localStorage.brain_app_users)? $localStorage.brain_app_users : [];
    $scope.selected_user;
    $scope.is_user_selected = false;
    $scope.editable_user;

    db.collection('staffs').onSnapshot( qs => {
        let results = qs.docs.map( d => {
            let item = d.data();
            item.id = d.id;
            return item;
        } );
        $scope.users = results;
        $localStorage.brain_app_users = results;
        $scope.$apply();
    });

    $scope.select_user = (user)=>{
        $scope.selected_user = user;
        $scope.selected_user.menu = (user.menu)? user.menu : [];
        $scope.is_user_selected = true;
    };

    $scope.clear_selected_user = ()=>{
        delete($scope.selected_user);
        $scope.is_user_selected = false;
    };

    $scope.delete_user = (user)=>{
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then((result) => {
            if (result.value) {
                db.collection('staffs').doc(user.id).delete().then( ()=>{
                    Toast.fire({
                        type: 'success',
                        title: 'Account deleted!.'
                    });
                } );
                $scope.clear_selected_user();
            }
          });
    };

    $scope.open_edit_modal = (ev,user)=>{
        $scope.editable_user = user;
        $scope.showPrerenderedDialog(ev,'editUser');
    };

    $scope.update_user_field = (data,id)=>{
        db.collection('staffs').doc(id).update(data);
    }

    $scope.edit_phone_number = (id)=> {
        Swal.fire({
            title: 'Enter a new Mobile Number',
            input: 'text',
            inputValue: '+63',
            inputAttributes: {
              autocapitalize: 'off',
              maxlength: 13,
            },
            inputValidator: (value) => {
                if (value.length < 13) {
                  return 'Invalid Mobile Number'
                }
              },
            showCancelButton: true,
            confirmButtonText: 'Update',
            showLoaderOnConfirm: true,
            preConfirm: async (newNumber) => {
                let qs = await db.collection('staffs').where("phone","==",newNumber).get().catch(
                    (error)=>{
                        Swal.showValidationMessage(
                            `Connection error. Try Again later.`
                          )
                        return false;
                    }
                );
                if(qs.empty){
                    db.collection('staffs').doc(id).update({"phone": newNumber });
                    return undefined;
                }else {
                    Swal.showValidationMessage(
                        `This number is already in use.`
                      )
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
          }).then((result) => {
            if (result.value) {
                Toast.fire({
                    type: 'success',
                    title: 'Mobile Number Updated!'
                });
            }
          })

    };

    $scope.add_new_account = (ev)=> {
        Swal.fire({
            title: 'Enter a Mobile Number',
            input: 'text',
            inputValue: '+63',
            inputAttributes: {
              autocapitalize: 'off',
              maxlength: 13,
            },
            inputValidator: (value) => {
                if (value.length < 13) {
                  return 'Invalid Mobile Number'
                }
              },
            showCancelButton: true,
            confirmButtonText: 'Add',
            showLoaderOnConfirm: true,
            preConfirm: async (newNumber) => {
                let qs = await db.collection('staffs').where("phone","==",newNumber).get().catch(
                    (error)=>{
                        Swal.showValidationMessage(
                            `Connection error. Try Again later.`
                          )
                        return false;
                    }
                );
                if(qs.empty){
                    await db.collection('staffs').doc(newNumber).set({"phone": newNumber });
                    let d = {id: newNumber, phone: newNumber};
                    $scope.select_user(d);
                    $scope.open_edit_modal(ev,d);
                    return undefined;
                }else {
                    Swal.showValidationMessage(
                        `This number is already in use.`
                      )
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
          });
    };

    $scope.remove_array_from_user = (key,item,id)=>{ 
        delete(item['$$hashKey']);
        let updatable = {};
        updatable[key] = firebase.firestore.FieldValue.arrayRemove(item);
        db.collection('staffs').doc(id).update(updatable);
    };

    $scope.add_array_to_user = (key,item,id)=>{
        delete(item['$$hashKey']);
        let updatable = {};
        updatable[key] = firebase.firestore.FieldValue.arrayUnion(item);
        db.collection('staffs').doc(id).update(updatable);
    };

    $scope.adding_access_menu = (name,key,item,id)=>{
        Swal.fire({
            title: `Are you sure?`,
            text: `Giving access to ${name}`,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, give Access!'
          }).then( async (result) => {
            if (result.value) {
              if(item.menu){
                let cb = '';
                let i = 1;
                item.menu.map( o => {
                    cb += `<input id="xx_${i}" type="checkbox" checked> ${o.title} <br> `;
                    i++;
                } );
                const { value: formValues } = await Swal.fire({
                    title: 'Select Access',
                    html: cb,
                    focusConfirm: false,
                    preConfirm: () => {
                        let ii = 1;
                        let selectedAccess = [];
                        item.menu.map( o => {
                            if(document.getElementById('xx_'+ii).checked){
                                selectedAccess.push(o);
                            }
                            ii++;
                        } );
                        return selectedAccess;
                    }
                  })
                  
                  if (formValues) {
                    item.menu = formValues;
                    $scope.add_array_to_user(key,item,id);
                    $scope.selected_user.menu.push(item);
                  }
              }else {
                $scope.add_array_to_user(key,item,id);
                $scope.selected_user.menu.push(item);
              }
            }
          });
    };

    $scope.removing_access = (name,key,item,id,index)=>{
        Swal.fire({
            title: `Are you sure?`,
            text: `Removing access of ${name}`,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove Access!'
          }).then( async (result) => {
            if (result.value) {
                $scope.remove_array_from_user(key,item,id);
                $scope.selected_user.menu.splice(index,1);
            }
          });
    };

    $scope.check_menu_if_exist = (menu,title)=>{
        let exist = false;
        if(menu){
          menu.map( o => { 
            if( title == o.title) exist = true;
          });
        }
        return exist;
    };

});
