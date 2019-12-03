myAppModule.
controller('records_controller', function($scope, $records_service){
    $scope.addRe
}).
service('$records_service', function($crudService){
    var collection = db.collection('records');
    this.addRecord = (record) => {
        return $crudService.addItem(record, collection);
    }
})