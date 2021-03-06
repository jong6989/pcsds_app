'use strict';

myAppModule.controller('operation_controller', function ($scope, operation_service, account_service, $location, NgTableParams) {
    $scope.isBusy = false;
    $scope.operation = {
        template: {
            "name": "Operation",
            "type": "operation",
            "permit": false,
            "create": "./app/templates/templates/operation/create.html",
            "edit": "./app/templates/templates/operation/edit.html",
            "print": "./app/templates/templates/operation/print.html",
            "view": "./app/templates/templates/operation/view.html"
        },
        // map_reference: "1577252888390",
        keywords: []
    }

    $scope.toMilliseconds = (date) => {
        $scope.operation.date = date.getTime();
    }

    $scope.load_registered_users = () => {
        account_service.getAccounts().
            then(registered_users => {
                $scope.registered_users = registered_users;
            })
    }

    $scope.load_operation_number = () => {
        operation_service.
            getNextSequence().
            then(nextSequence => {
                var dateNow = new Date();
                $scope.operation.operation_no = moment(dateNow).format('YYYYMMDD') + '-' + nextSequence;
                $scope.$apply();
            })
    }


    $scope.add = (operation) => {
        $scope.isBusy = true;
        var currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        operation.publisher = currentUser;
        operation.created = new Date().getTime();
        operation.category = 'operation';
        // operation.created_time = Date.now();
        operation.status = 'published';
        operation.meta = {
            'published_date': $scope.date_now('YYYY-MM-DD'),
            'published_time': Date.now()
        };
        operation.agency = $scope.global.ops;
        // operation.keywords = operation.keywords.filter((value) => { return value != null && value.trim() != '' });
        operation_service.
            addOperation(operation).
            then(operation => {
                send(operation).
                    then(result => {
                        // operation_service.updateMapOperation(operation.map_reference, { 'operation_no': operation.id })
                        localData.set('operation', JSON.stringify(operation));
                        $location.path('/operations/mapping/map/operations');
                        $scope.$apply();
                    })
            })
    }

    $scope.loadOperation = (operation) => {
        $scope.operation = operation;
        $scope.remarks = getRemarksforCurrentUser(operation);
    }

    $scope.refreshList = () => {
        $scope.loadOperations();
    }

    $scope.loadViewPage = (operation) => {
        localData.set('operation', JSON.stringify(operation));
        $location.path('operations/operation/view');
    }

    $scope.loadOperations = () => {
        operation_service.getOperations(null).
            then(operations => {
                $scope.operations = operations;
                $scope.operationsTable = new NgTableParams({ sorting: { first_name: 'asc' } }, { dataset: operations });
                $scope.$apply();
            })
    }

    $scope.loadOperationsCreatedByCurrentUser = () => {
        let currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        operation_service.getOperations(currentUser).
        then(operations => {
            $scope.operations = operations;
            $scope.operationsTable = new NgTableParams({ sorting: { first_name: 'asc' } }, { dataset: operations });
            $scope.$apply();
        })
    }

    function getRemarksforCurrentUser(operation) {
        var currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        var index = operation.personnels.findIndex(personnel => personnel.id == currentUser.id);
        return index > -1 ? operation.personnels[index].operation_remarks : "";
    }

    $scope.gotoOperationMap = (operation) => {
        localData.set('operation', JSON.stringify(operation));
        $location.path('operations/operation/map');
    }

    var send = (operation) => {
        var promises = [];
        operation.personnels.forEach(personnel => {
            var promise = new Promise((resolve, reject) => {
                // let accessTypes = [];
                // for (const k in $scope.doc_user[item.agency.id]) {
                //     accessTypes.push(k);
                // }
                doc.db.collection(doc_transactions).add({
                    document: operation,
                    status: 'pending',
                    sender: {
                        id: operation.publisher.id,
                        contact: (operation.publisher.contact == undefined) ? '' : operation.publisher.contact,
                        email: (operation.publisher.email == undefined) ? '' : operation.publisher.email,
                        info: (operation.publisher.info == undefined) ? '' : operation.publisher.info,
                        // access: accessTypes,
                        name: operation.publisher.name
                    },
                    receiver: personnel,
                    time: Date.now(),
                    date: $scope.date_now()
                }).
                    then(result => {
                        resolve(result);
                    });
            });
            promises.push(promise);
        })

        return Promise.all(promises);
    }

    $scope.operation.personnels = [];
    $scope.addToPersonnel = (personnel) => {
        $scope.operation.personnels.push(personnel);
        $scope.close_dialog();
    }

    $scope.personnel = {};
    $scope.addRemarksFor = (personnel) => {
        $scope.personnel = personnel;
        $scope.personnel.operation_remarks = '';
    }

    $scope.removeFromOperation = (personnel) => {
        var index = $scope.operation.personnels.findIndex(p => p.id == personnel.id);
        $scope.operation.personnels.splice(index, 1);
    }

    if (localData.get('operation')) {
        var operation = JSON.parse(localData.get('operation'));
        $scope.date_time = operation.date;
        $scope.currentItem = operation;
        localData.remove('operation');
    }
}).
controller('map_view_controller', function($scope){
    var object = localData.get('operation');
    var operation = JSON.parse(object);
    $scope.currentItem = operation;
    localData.remove('operation');
    $scope.onMapBoxLoad = () => {
        $scope.loadOperation(operation.id);
    }
}).
    service('operation_service', function () {
        var operationCollection = db.collection('ecan_app_operation_plans');

        this.addOperation = (operation) => {
            return new Promise((resolve, reject) => {
                operation.id = new Date().getTime().toString();
                operationCollection.
                    doc(operation.id).
                    set(operation).
                    then(result => {
                        updateCounter().
                            then(counter => {
                                resolve(operation);
                            })
                    })
            })
        }

        function updateCounter() {
            return new Promise((resolve, reject) => {
                var counter = {};
                counter['last_sequence'] = firebase.firestore.FieldValue.increment(1);
                counter['stored_operation_count'] = firebase.firestore.FieldValue.increment(1);
                operationCollection.
                    doc('counter').
                    update(counter).
                    then(result => {
                        resolve(counter);
                    })
            })
        }

        this.getNextSequence = () => {
            return new Promise((resolve, reject) => {
                operationCollection.
                    doc('counter').
                    onSnapshot(snapshot => {
                        var counter = snapshot.data();
                        var lastSequence = counter.last_sequence;

                        resolve(lastSequence + 1)
                    })
            })
        }

        this.updateMapOperation = (operationMapID, updatedData) => {
            return new Promise((resolve, reject) => {
                db.collection('ecan_app_operation_plans').
                    doc(operationMapID).
                    update(updatedData).
                    then(result => { resolve(result) })
            })
        }

        this.getOperation = (operationID) => {
            return new Promise((resolve, reject) => {
                operationCollection.
                    doc(operationID).
                    onSnapshot(snapshot => {
                        var operation = snapshot.data();
                        resolve(operation);
                    })
            })
        }

        this.getOperations = (currentUser) => {
            return new Promise((resolve, reject) => {
                var query =
                    operationCollection;

                if (currentUser != null)
                    query = query.where('publisher.uid', '==', currentUser.uid);

                query.onSnapshot(snapshot => {
                    var operations = snapshot.docs.map(document => {
                        var operation = document.data();
                        operation.id = document.id;
                        return operation;
                    })
                    resolve(operations)
                })
            })
        }
    });

