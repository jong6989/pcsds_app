'use strict';

myAppModule.controller('profile_management_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.alert = () => {
        Swal.fire(
            'Good job!',
            'You clicked the button!',
            'success'
          )
    }
});
