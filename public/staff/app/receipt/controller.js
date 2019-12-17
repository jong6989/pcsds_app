myAppModule.
    controller('receipt_controller', function ($scope, $receipt_service, $location) {
        $scope.isSaving = false;

        var addReceipt = (receipt) => {
            var account_id = localData.get('BRAIN_STAFF_ID');
            var now = new Date();

            receipt.date_entered = $scope.to_date(now);
            receipt.timestamp = now.getTime();
            receipt.publisher = account_id;
            receipt.status = 'published';
            receipt.meta = { 'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
            receipt.reference = $scope.reference;
            receipt.subject = 'Offical Receipt';
            receipt.template = {
                'view':     '/receipt/view',
                'create' : 	'/receipt/create',
			    'edit' : 	'/receipt/update',
			    'print' : 	'/receipt/print'
            }
            receipt.type = 'receipt';
            $receipt_service.keywords = receipt.keywords.filter((value) => {
                return value != undefined && value.trim() != '';
            });
            $scope.isSaving = true;
            $receipt_service.
                addReceipt(receipt).
                then(addedItem => {
                    Swal.fire(
                        'Success!',
                        '',
                        'success'
                    ).then((result) => {
                        $location.path(localData.get('previous_view'));
                        $scope.$apply();
                    });
                }).
                catch(error => {
                    $scope.isSaving = false;
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Operation failed, please try again.',
                        footer: ''
                    }).then(() => {
                    });
                });
        }

        $scope.updateReceipt = (receipt) => {
            $receipt_service.updateReceipt(receipt).
                then(success => {
                    Swal.fire(
                        'Success!',
                        '',
                        'success'
                    ).then(() => {
                        $location.path(localData.get('previous_view'));
                        $scope.$apply();
                    });
                }).
                catch(error => {
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Operation failed, please try again.',
                        footer: ''
                    }).then(() => {
                    });
                })
        }

        $scope.loadReceipt = () => {
            var receipt = localData.get('receipt');

            $scope.receipt = receipt ? JSON.parse(receipt) : {};
        }

        $scope.backToPreviousPage = () => {
            $location.path(localData.get('previous_view'));
        }

        $scope.saveReceipt = addReceipt;
        async function  main(){
            $scope.reference = JSON.parse(localData.get('reference'));
            if(!$scope.reference){
                $location.path('staff/');
                return;
            }

            var lastReceipt = await $receipt_service.getLastReceipt();
            $scope.lastReceiptNumber = lastReceipt.number;
        }
        main();
    }).
    service('$receipt_service', function ($crudService) {
        var collection = db.collection('receipt');
        this.addReceipt = (receipt) => {
            return $crudService.addItem(receipt, collection);
        }

        this.updateReceipt = (receipt) => {
            return $crudService.updateItem(receipt, collection);
        }
        this.getLastReceipt = () => {
            return new Promise((resolve, reject) => {
                collection.
                orderBy('timestamp').
                limit(1).
                onSnapshot(snapShot => {
                    let lastReceipt = snapShot.docs.length > 0 ? snapShot.docs[0].data() : '';
    
                    resolve(lastReceipt);
                });
            })
            
        }
    })