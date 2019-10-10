'use strict';

myAppModule.controller('menu_management_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.menu_modules = ($localStorage.brain_menu_modules)? $localStorage.brain_menu_modules : [];
    
    db.collection('module_menus').onSnapshot( qs => {
        let results = qs.docs.map( d => {
            let item = d.data();
            item.id = d.id;
            return item;
        } );
        $scope.menu_modules = results;
        $localStorage.brain_menu_modules = results;
        $scope.$apply();
    });

    $scope.add_menu_module = ()=>{
        db.collection('module_menus').add({ title : '', icon : '', path: ''});
    };

    $scope.update_user_field = (data,id)=>{
        db.collection('module_menus').doc(id).update(data);
    }

});
