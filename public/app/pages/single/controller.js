'use strict';

myAppModule.controller('single_controller', function ($scope, $http,$location, $timeout, $utils, $mdDialog, $interval, Upload, $localStorage) {
    $scope.is_loading = true;
    $scope.application = {};
    $scope.location = $location;
    $scope.params = $location.search();
    
    $scope.get_single_notif = (event)=>{
        var itemId = $location.search().id;
        $scope.notif_seen(itemId);
        $scope.notif = $scope.notifs[itemId];
        fire.db.transactions.get($scope.notif.transaction_id, (data)=>{
            $scope.is_loading = false;
            $scope.application = data;
        });
    }
    

});
