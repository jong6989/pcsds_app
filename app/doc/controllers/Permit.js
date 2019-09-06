myAppModule.controller('PermitController', 
['$crudService', 'municipalityService', '$scope',
 ($crudService, municipalityService, $scope) => {
    var permitDocument;
    var permitCollection;
    
    $scope.setDocumentName = (documentName) => {
        permitDocument = db.collection('database').doc(documentName) ;
        permitCollection = permitDocument.collection('database');
    }

    $scope.permits = [];
    $scope.permitsTable = $scope.ngTable([]);
    $scope.chainsawPermitFormData = {};
    $scope.municipalities = [];
    $scope.barangays  = [];
    $scope.dateNow = new Date();
    $scope.registrationForm = {};
    $scope.registrationForm.saveButton = {};
    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $scope.refreshList = () => {
        $crudService.getItems(permitCollection, converFromSnapshotToPermitObject).then(permits =>{
            $scope.permits = permits;
            $scope.permitsTable = $scope.ngTable($scope.permits);
        })
    }

    let addPermit = () => {
        let permit = convertFromFormDataToPermitObject($scope.chainsawPermitFormData);
        $scope.toast("Success");

        $crudService.addItem(permit, permitCollection).then(result => {
            $scope.close_dialog();
            $scope.permits.push(permit);
            permit.Month = permit.Month_Issued;
            permit.Year = permit.Year_Issued;

            $crudService.updateCounterFor(permit, permitDocument);
        },
        error => {
            console.log(error);
            $scope.toast("Oooops something went wrong. Please try again.");
        })
    }

    let updatePermit = () => {
        let updatedPermit = convertFromFormDataToPermitObject($scope.chainsawPermitFormData);
        $scope.toast("Success");

        $crudService.updateItem(updatedPermit, permitCollection).then(result => {
            $scope.close_dialog();
            let index = $scope.permits.findIndex(permit => permit.id == updatedPermit.id);
            $scope.permits[index] = updatedPermit;
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
        $scope.registrationForm.title = "Add New";
        $scope.registrationForm.saveButton.text = "Add";
        $scope.showPrerenderedDialog(event, formName);
    }

    $scope.openPermitFormForUpdating = (event, formName,permitToUpate) =>{
        $scope.registrationForm.title = "Update";
        $scope.registrationForm.saveButton.text = "Update";
        $crudService.getItem(permitToUpate.id, permitCollection, converFromSnapshotToPermitObject).
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
            Date_Issued: $scope.to_date(formData.Date_Issued),
            COR_Number: formData.COR_Number || '',
            id: formData.id || ''
        };
        
        let date_issued = new Date(formData.Date_Issued);
        permit.Month_Issued = date_issued.getMonth() + 1;
        permit.Day_Issued = date_issued.getDate();
        permit.Year_Issued = date_issued.getFullYear();

        return permit;
    }

    function converFromSnapshotToPermitObject(snapshot){
        let permit = snapshot.data();
        permit.id = snapshot.id;
        permit.Address = permit.Street ? `${permit.Street}, ${permit.Barangay}` : `${permit.Barangay}`;
        
        // if(permit.Date_Issued)
        //     permit.Date_Issued = new Date(permit.Date_Issued);
        return permit;
    }

}]);