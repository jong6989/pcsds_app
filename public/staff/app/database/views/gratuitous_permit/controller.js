myAppModule.
controller('gratuitous_permit_controller', function($scope, $crudService){
    var document =  db.collection('database').doc('gratuitous_permit');
    var collection = document.collection('database');
    $scope.gratuitousPermitTable = $scope.ngTable([]);

    $scope.refreshList = () => {
        $scope.gratuitousPermitTable = $scope.ngTable($scope.gratuitous_permits);
    }
    $scope.loadGratuitousPermits = () => {
        $crudService.getItems(collection).
        then(gratuitous_permits => {
            $scope.gratuitous_permits = gratuitous_permits;
            $scope.gratuitousPermitTable = $scope.ngTable($scope.gratuitous_permits);
            $scope.$apply();
        })
    }

    $scope.openGratuitousPermitForm = () => {
        $scope.gratuitousPermit = {
            grantees: [{}]
        }
        $scope.action = 'Add Gratuitous Permit';
        $scope.saveGratuitousPermit = addGratuitousPermit;
        $scope.showPrerenderedDialog(null, 'gratuitousPermitForm')
    }

    $scope.granteesTable = $scope.ngTable([]);
    $scope.viewGrantees = (gratuitousPermit) => {
        $scope.granteesTable = $scope.ngTable(gratuitousPermit.grantees);
        $scope.showPrerenderedDialog(null, 'granteesWindow');
    }

    $scope.openGratuitousPermitFormForUpdating = (event, gratuitousPermit) => {
        $scope.action = 'Update Gratuitous Permit';
        $scope.gratuitousPermit = gratuitousPermit;
        $scope.date_issued = new Date(gratuitousPermit.date_issued)
        $scope.saveGratuitousPermit = updateGratuitousPermit;
        $scope.showPrerenderedDialog(event, 'gratuitousPermitForm');
    }

    function updateGratuitousPermit(gratuitousPermit){
        $crudService.
        updateItem(gratuitousPermit, collection).
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

    function addGratuitousPermit(gratuitous_permit){
        $crudService.addItem(gratuitous_permit, collection).
        then(result => {
            Swal.fire(
                'Success!',
                '',
                'success'
            ).then((result) => {
                $scope.gratuitous_permits.push(gratuitous_permit);
                $scope.gratuitousPermitTable = $scope.ngTable($scope.gratuitous_permits);
                $scope.close_dialog();
                $scope.$apply();
                updateCounter(gratuitous_permit);
            });
        })
    }

    function updateCounter(gratuitous_permit){
        var dateIssued =  new Date(gratuitous_permit.date_issued);
        var item = {
            Month: dateIssued.getMonth() + 1,
            Year: dateIssued.getFullYear()
        }
        $crudService.updateCounterFor(item, document);
    }
}).
service('gratuitous_permit_service', function($scope){
    
})