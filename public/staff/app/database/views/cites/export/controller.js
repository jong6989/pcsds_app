myAppModule.
    controller('cites_export_controller', function ($scope, $crudService) {
        var cites_collection = db.collection('database').doc('cites').collection('database');
        $scope.citesTable = $scope.ngTable([]);
        $scope.title = 'Export'
        $scope.loadCites = () => {
            $crudService.getItems(cites_collection).
                then(citesCollection => {
                    $scope.citesCollection = citesCollection;
                    $scope.citesTable = $scope.ngTable($scope.citesCollection);
                    $scope.$apply();
                })
        }

        $scope.openCITESForm = (event) => {
            $scope.cites = {
                species: [],
                type: 'cites'
            }
            $scope.typeShouldHide = false;
            $scope.action = 'Add CITES';
            $scope.saveCITES = addCITES;

            $scope.showPrerenderedDialog(event, 'citesFormWindow');
        }

        $scope.refreshList = () => {
            $scope.citesTable = $scope.ngTable($scope.citesCollection);
        }

        $scope.openCITESFormForUpdating = (event, cites) => {
            $scope.action = 'Update CITES';
            $scope.date_issued = $scope.to_date(cites.date_issued);
            $scope.cites = cites;
            $scope.saveCITES = updateCITES;
            $scope.showPrerenderedDialog(event, 'citesFormWindow');
        }


        function addCITES(cites) {
            $crudService.
                addItem(cites, cites_collection).
                then(result => {
                    Swal.fire(
                        'Success!',
                        '',
                        'success'
                    ).then((result) => {
                        $scope.citesCollection.push(cites);
                        $scope.citesTable = $scope.ngTable($scope.citesCollection);
                        $scope.close_dialog();
                        $scope.$apply();
                    });
                })
        }

        function updateCITES(cites) {
            $crudService.
                updateItem(cites, cites_collection).
                then(result => {
                    Swal.fire(
                        'Success!',
                        '',
                        'success'
                    ).then((result) => {
                        $scope.citesTable = $scope.ngTable($scope.citesCollection);

                        $scope.close_dialog();
                        $scope.$apply();
                    });
                })
        }

        $scope.closeForm = () => {
            $scope.close_dialog();
        }

        $scope.viewSpecies = (cites) => {
            $scope.speciesToExport = $scope.ngTable(cites.species);
            $scope.showPrerenderedDialog(null, 'speciesWindow');
        }

        $scope.loadMunicipalities = (province) => {
            if($scope.Province)
                $addressService.
                getMunicipalities('Philippines', province).
                then(municipalities => {
                    $scope.municipalities = municipalities;
                });
            else
            {
                $scope.municipalities = [];
                $scope.barangays = [];
            }
        }
    })