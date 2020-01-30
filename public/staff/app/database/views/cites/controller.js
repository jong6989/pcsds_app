myAppModule.
controller('cites_controller', function($scope, $crudService){
    var cites_collection = db.collection('database').doc('cites').collection('database');
    $scope.citesTable = $scope.ngTable([]);   

    $scope.loadCites = () => {
        $crudService.getItems(cites_collection).
        then(cites => {
            $scope.cites = cites;
            $scope.citesTable = $scope.ngTable($scope.cites);
            $scope.$apply();
        })
    }
})