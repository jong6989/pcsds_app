'use strict';

myAppModule.controller('operation_controller', function ($scope, operation_service) {
    $scope.isBusy = false;

    $scope.add = (operation) => {

    }
}).
service('operation_service', function(){
    var collection = db.collection('operation');

    this.addOperation = (operation) => {
        return new Promise((resolve, reject) => {
            collection.add(operation).
            then(result => {
                resolve(operation);
            })
        })
    }
});

document.write(`<script src='app/operations/intel_report/create/controller.js'></script>`);
document.write(`<script src='app/operations/intel_report/list/single/controller.js'></script>`);
