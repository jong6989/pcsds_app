'use strict';


myAppModule.controller('dashboard_controller', function ($scope, $timeout, $utils, $mdToast,$mdDialog,NgTableParams) {
    
    var NOTIFICATION_DB = new JsonDB("DB/NOTIFICATIONS", true, false);
    const notif_string = "/notifications";
    

    try {
        NOTIFICATION_DB.getData(notif_string + "[0]");
    } catch(error) {
        NOTIFICATION_DB.push(notif_string,[]);
    };

    $scope.get_my_notifications = ()=>{
        return NOTIFICATION_DB.getData(notif_string).reverse();
    };

    $scope.my_transactions = $scope.get_my_notifications();

    

});