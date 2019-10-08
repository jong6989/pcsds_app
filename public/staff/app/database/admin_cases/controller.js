'use strict';
myAppModule.controller('database_admin_cases_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    $scope.list_admin_cases = [
        { name : "Admin Order 5, Series 2014", value : "AO-5-2014" },
        { name : "Admin Order 6, Series 2014", value : "AO-6-2014" }
    ];

});