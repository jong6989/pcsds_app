'use strict';


myAppModule.controller('manual_controller', function ($scope, $timeout, $utils, $mdToast,$mdDialog) {
    $scope.selectedManualTabIndex = 0;

    $scope.setTab = (t) => {
        $scope.selectedManualTabIndex = t;
    }
});