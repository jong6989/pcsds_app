'use strict';

myAppModule.controller('operations_category_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.categories = ($localStorage.operations_categories)? $localStorage.operations_categories : [];

    db.collection('meta').where('key','==','operations_category').onSnapshot( qs => {
        let results = qs.docs.map( d => {
            let item = d.data();
            item.id = d.id;
            return item;
        } );
        $scope.categories = results;
        $localStorage.operations_categories = results;
        $scope.$apply();
    });

    $scope.add_category = ()=>{
        Swal.fire({
            title: 'Enter Category Name',
            input: 'text',
            inputAttributes: {
              autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Add',
            allowOutsideClick: () => !Swal.isLoading()
          }).then((result) => {
            if (result.value) {
                db.collection('meta').add({ key : 'operations_category', value: result.value});
                Toast.fire({
                    type: 'success',
                    title: 'Category Added!'
                });
            }else {
                Swal.showValidationMessage(`Please enter a category name!`);
            }
          })
    };

    $scope.delete_category = (item)=>{
        Swal.fire({
            title: 'Delete ' + item.value + '?',
            text: "Attached documents will be detached",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then((result) => {
            if (result.value) {
                db.collection('meta').doc(item.id).delete();
                Toast.fire({
                    type: 'error',
                    title: 'Category Deleted!'
                });
            }
        });
    };

    $scope.update_category = (item)=>{
        db.collection('meta').doc(item.id).update({"value": item.value});
    };

});
