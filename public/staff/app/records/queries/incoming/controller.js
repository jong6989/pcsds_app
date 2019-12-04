// import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from "constants";

myAppModule.
    controller('incoming_query_controller', function ($scope, $incoming_query_service, $location) {

        $scope.updateIncomingQuery = (incomingQuery) => {
            $incoming_query_service.updateIncomingQuery(incomingQuery).
                then(success => {
                    Swal.fire(
                        'Success!',
                        '',
                        'success'
                    ).then(() => {

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
        var addIncomingQuery = (incomingQuery) => {
            var account_id = localData.get('BRAIN_STAFF_ID');
            var now = new Date();

            incomingQuery.entered_by = account_id;
            incomingQuery.date_entered = $scope.to_date(now);
            $incoming_query_service.
                addIncomingQuery(incomingQuery).
                then(success => {
                    Swal.fire(
                        'Success!',
                        '',
                        'success'
                    ).then(() => {

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
                });
        }
        $scope.saveIncomingQuery = addIncomingQuery;

        $scope.incomingQueries = [];
        $scope.queriesTable = $scope.ngTable([]);

        $scope.loadIncomingQueries = () => {
            $incoming_query_service.
                getIncomingQueries().
                then(items => {
                    $scope.incomingQueries = items;
                    $scope.queriesTable = $scope.ngTable($scope.incomingQueries);
                    $scope.$apply();
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

        $scope.loadIncomingQueriesEnteredByCurrentStaff = () => {
            $incoming_query_service.
                getIncomingQueriesEnteredBy(localData.get('BRAIN_STAFF_ID')).
                then(items => {
                    $scope.incomingQueries = items;
                    $scope.queriesTable = $scope.ngTable($scope.incomingQueries);
                    $scope.$apply();
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

        $scope.update = (query) => {
            localData.set('incomingQuery', setJson(query));
            $location.path('/records/queries/incoming/update');
        }

        $scope.loadQuery = () => {
            $scope.query = JSON.parse(localData.get('incomingQuery'));
        }

        $scope.export = (incomingQueries) => {
            remove(['id', 'entered_by'], incomingQueries);
            var ws = XLSX.utils.json_to_sheet(incomingQueries);
            fixedHeader(ws);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, "communications.xlsx");
        }

        function fixedHeader(workSheet) {
            var columnTexts = [
                'Communication Status',
                'Contents',
                "Control Number",
                "Correspondence Description",
                "Date Entered",
                "Date of Correspondence",
                "Date Received",
                "OED Actions",
                "Referral Date",
                "Source of Origin",
                "Outgoing Date",
                "Status of Action"
            ]

            var currentColumn = 'A';
            columnTexts.forEach((value) => {
                var currentCell = `${currentColumn}1`; 
                if(workSheet[currentCell] == undefined)
                    workSheet[currentCell] = { t: "s" };
                workSheet[currentCell].v = value;
                currentColumn = String.fromCharCode(currentColumn.charCodeAt(0) + 1);
            })
        }

        function remove(keysToRemove, arrayOfObjects){
            arrayOfObjects.forEach((arrayItem) => {
                keysToRemove.forEach((key) => {
                    delete arrayItem[key];
                })
            });
        }

    }).
    service('$incoming_query_service', function ($crudService) {
        var collection = db.collection('communications');
        this.addIncomingQuery = (incomingQuery) => {
            return $crudService.addItem(incomingQuery, collection);
        }

        this.getIncomingQueries = () => {
            return $crudService.getItems(collection);
        }

        this.getIncomingQueriesEnteredBy = (staffID) => {
            return $crudService.getItemsEnteredBy(staffID, collection);
        }

        this.updateIncomingQuery = (incomingQuery) => {
            return $crudService.updateItem(incomingQuery, collection);
        }
    })