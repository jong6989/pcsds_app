myAppModule.
controller('wcp_controller', function($scope, $crudService){
    var document =  db.collection('database').doc('wcp');
    var collection = document.collection('database');
    $scope.wcpListTable = $scope.ngTable([]);

    $scope.refreshList = () => {
        $scope.wcpListTable = $scope.ngTable($scope.wcpList);
    }

    $scope.loadWCPermits = () => {
        $crudService.getItems(collection).
        then(wcpList => {
            $scope.wcpList = wcpList;
            $scope.wcpListTable = $scope.ngTable($scope.wcpList);
            $scope.$apply();
        })
    }

    $scope.openGratuitousPermitForm = (event) => {
        $scope.wcp = {
            applicant: {}
        }

        $scope.action = "Add Wildlife Collector's Permit";
        $scope.saveWCP = addWCP;
        $scope.showPrerenderedDialog(event, 'wcpForm')
    }


    $scope.openWCPFormForUpdating = (event, wcp) => {
        $scope.action = "Update Wildlife Collector's Permit";
        $scope.wcp = wcp;
        $scope.date_issued = new Date(wcp.date_issued)
        $scope.saveWCP = updateWCP;
        $scope.showPrerenderedDialog(event, 'wcpForm');
    }

    function updateWCP(wcp){
        $crudService.
        updateItem(wcp, collection).
        then(result => {
            Swal.fire(
                'Success!',
                '',
                'success'
            ).then((result) => {
                $scope.close_dialog();
                $scope.$apply();
            });
        })
    }

    function addWCP(wcp){
        $crudService.addItem(wcp, collection).
        then(result => {
            Swal.fire(
                'Success!',
                '',
                'success'
            ).then((result) => {
                $scope.wcpList.push(wcp);
                $scope.wcpListTable = $scope.ngTable($scope.wcpList);
                $scope.close_dialog();
                $scope.$apply();
                updateCounter(wcp);
            });
        })
    }

    function updateCounter(wcp){
        var dateIssued =  new Date(wcp.date_issued);
        var item = {
            Month: dateIssued.getMonth() + 1,
            Year: dateIssued.getFullYear(),
            Municipality: wcp.applicant ? wcp.applicant.municipality : ''
        }
        $crudService.updateCounterFor(item, document);
    }
})