myAppModule.
controller('WildlifeExportController', function($scope){
    $scope.transportation = {};
    $scope.transportation.date = $scope.currentItem.transportation.date;
    $scope.certificate_expiration_date = $scope.currentItem.certificate_expiration_date;
    $scope.issuance_date = $scope.currentItem.issuance_date;
    $scope.paid_date = $scope.currentItem.paid_date;
    
})