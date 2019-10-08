myAppModule.
controller('LTPWildlifeController', ['$scope', '$localStorage',
    function($scope, $localStorage){
        $scope.transport_date = $scope.currentItem.transport_date;
        $scope.issuance_date = $scope.currentItem.issuance_date;
        $scope.paid_date = $scope.currentItem.paid_date;
}]);