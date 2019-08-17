myAppModule.controller('PermitController', function($crudService, municipalityService, $scope){
    var chainsawDocument;
    var purchasePermitCollection;
    
    $scope.setDocumentName = (documentName) => {
        chainsawDocument = db.collection('database').doc(documentName) ;
        purchasePermitCollection = chainsawDocument.collection('permits');
    }

    $scope.permits = [];
    $scope.permitsTable = $scope.ngTable([]);
    $scope.chainsawPermitFormData = {};
    $scope.municipalities = [];
    $scope.barangays  = [];
    $scope.dateNow = new Date();

    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $scope.refreshList = () => {
        $crudService.getItems(purchasePermitCollection, converFromSnapshotToPermitObject).then(permits =>{
            $scope.permits = permits;
            $scope.permitsTable = $scope.ngTable($scope.permits);
        })
    }

    let addPermit = () => {
        let permit = convertFromFormDataToPermitObject($scope.chainsawPermitFormData);
        $crudService.addItem(permit, purchasePermitCollection).then(permit => {
            $scope.toast("Success");
            $scope.close_dialog();
            $scope.permits.push(permit);
            $crudService.updateCounterFor(permit, chainsawDocument);
        },
        error => {
            console.log(error);
            $scope.toast("Oooops something went wrong. Please try again.");
        })
    }

    let updatePermit = () => {
        let updatedPermit = convertFromFormDataToPermitObject($scope.chainsawPermitFormData);
        $crudService.updateItem(updatedPermit, purchasePermitCollection).then(result => {
            $scope.toast("Success");
            $scope.close_dialog();
            let index = $scope.permits.findIndex(permit => permit.id == updatedPermit.id);
            $scope.permits[index] = updatePermit;
            $scope.permitsTable = $scope.ngTable($scope.permits);
        },
        error => {
            $scope.toast("Oooops something went wrong. Please try again.");
        });
    }

    $scope.refreshBarangays = () => {
        municipalityService.getBarangays($scope.chainsawPermitFormData.Municipality).then(barangays => {
            $scope.barangays = barangays;
        })
    }

    $scope.openPermitForm = (event, formName) => {
        $scope.chainsawPermitFormData = {};
        $scope.savePermit = addPermit;
        $scope.barangays = [];
        $scope.showPrerenderedDialog(event, formName);
    }

    $scope.openPermitFormForUpdating = (event, formName,permitToUpate) =>{
        $crudService.getItem(permitToUpate.id, purchasePermitCollection, converFromSnapshotToPermitObject).
        then(permit => {
            $scope.chainsawPermitFormData = permit;
            $scope.refreshBarangays();
            $scope.savePermit = updatePermit;
            $scope.showPrerenderedDialog(event, formName);
        })
    }

    $scope.closeRegistrationForm = () => {
        $scope.close_dialog();
    }

    function convertFromFormDataToPermitObject(formData){
        let permit = { 
            First_Name: formData.First_Name || '',
            Middle_Initial: formData.Middle_Initial || '',
            Last_Name: formData.Last_Name || '',
            Extension: formData.Extension || '',
            Barangay: formData.Barangay || '',
            Municipality: formData.Municipality || '',
            Street: formData.Street || '',
            Purpose: formData.Purpose || '',
            Date_Issued: formData.Date_Issued || '',
            COR_Number: formData.COR_Number || '',
            id: formData.id || ''
        };

        return permit;
    }

    function converFromSnapshotToPermitObject(snapshot){
        let permit = snapshot.data();
        permit.id = snapshot.id;

        permit.Barangay = permit.Barangay && permit.Barangay.toUpperCase() || '';

        if(permit.Date_Issued)
            permit.Date_Issued = new Date(permit.Date_Issued.seconds * 1000);
        return permit;
    }

});