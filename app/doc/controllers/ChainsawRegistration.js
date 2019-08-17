myAppModule.
controller('ChainsawRegistrationController', (
        $scope, 
        $crudService, 
        municipalityService) => {
    var chainsawDocument = db.collection('database').doc('ChainsawRegistration') ;
    var chainsawCollection = chainsawDocument.collection('Registerted Chainsaws');

    $scope.registeredChainsawsTable = $scope.ngTable([]);
    $scope.chainsawFormData = {};
    $scope.municipalities = [];
    $scope.barangays  = [];
    $scope.dateNow = new Date();
    $scope.chainsaws = [];

    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $scope.refreshList = () => {
        $crudService.getItems(chainsawCollection, convertToChainsawObjectFromSnapshot).
        then(chainsaws => {
            $scope.chainsaws = chainsaws;
            $scope.registeredChainsawsTable = $scope.ngTable(chainsaws);
        },
        error => {
            $scope.toast("Oooops something went wrong. Please try again.");
            console.log(error);
        })
    }

    $scope.refreshList();

    function addChainsaw(){
        let chainsaw = convertToChainsawObject($scope.chainsawFormData);
        $crudService.addItem(chainsaw, chainsawCollection).then(chainsaw =>{
            $scope.toast("Succes");
            $scope.close_dialog();
            $scope.chainsaws.push(chainsaw);
            refreshRegisteredChainsawsTable();
            $scope.chainsawFormData = {};
        },
        error => { 
            $scope.toast("Oooops something went wrong. Please try again.");
            console.log(error);
        });
    }

    function refreshRegisteredChainsawsTable(){
        $scope.registeredChainsawsTable = $scope.ngTable($scope.chainsaws);
    }

    function updateChainsaw() {
        let updatedChainsaw = convertToChainsawObject($scope.chainsawFormData)
        $crudService.updateItem(updatedChainsaw, chainsawCollection).then(result => {
            $scope.toast('Success');
            $scope.close_dialog();
            let index = $scope.chainsaws.findIndex(chainsaw => chainsaw.id == updatedChainsaw.id);
            $scope.chainsaws[index] = updatedChainsaw;
            refreshRegisteredChainsawsTable();
            $scope.chainsawFormData = {};
        },
        error => {
            $scope.toast('Ooooops something went wrong.');
            console.log(error);
        });     
    }

    $scope.openRegistrationForm = (event) => {
        $scope.saveChainsaw = addChainsaw;
        $scope.chainsawFormData = {};
        $scope.barangays = [];
        $scope.showPrerenderedDialog(event, 'chainsawRegistrationForm');
    }

    $scope.openRegistrationFormForUpdating = (id) => {     
        $scope.saveChainsaw = updateChainsaw;
        $crudService.
        getItem(id, chainsawCollection, convertToChainsawObjectFromSnapshot).
        then(chainsaw => {
            $scope.chainsawFormData = chainsaw;
            $scope.refreshBarangays();
            $scope.showPrerenderedDialog(event, 'chainsawRegistrationForm');
        },
        error => {
            $scope.toast('Ooooops something went wrong.');
            console.log(error);
        })
    }

    $scope.closeRegistrationForm = () => {
        $scope.close_dialog();
    }

    $scope.refreshBarangays = () =>{
        municipalityService.getBarangays($scope.chainsawFormData.Owner.Municipality).then(barangays => {
            $scope.barangays = barangays;
        })
    }
       

    function convertToChainsawObject(formData){
        let chainsaw = {
            CORNumber: formData.CORNumber || '',
            Agency: formData.Agency || '',
            Owner: {
                FirstName: formData.Owner && formData.Owner.FirstName || '',
                MiddleInitial: formData.Owner && formData.Owner.MiddleInitial || '',
                LastName: formData.Owner && formData.Owner.LastName || '',
                NameExtension: formData.Owner && formData.Owner.NameExtension || '',
                Barangay: formData.Owner && formData.Owner.Barangay || '',
                Street: formData.Owner && formData.Owner.Street || '',
                Municipality: formData.Owner && formData.Owner.Municipality || ''
            },                
            MetalSealNumber: formData.MetalSealNumber || '',
            SerialNumber: formData.SerialNumber || '',
            RegistrationDate: formData.RegistrationDate || '',
            ExpirationDate: formData.ExpirationDate || '',
            LimitationOfUse: formData.LimitationOfUse || '',
            Remarks: formData.Remarks || '',
            Keywords: [],
            id: formData.id || ''
        };
        chainsaw.Keywords = [
            chainsaw.Owner.LastName,
            chainsaw.Owner.MiddleInitial,
            chainsaw.Owner.FirstName,
            chainsaw.CORNumber
        ].filter(value => value.length > 0);
        return chainsaw;
    }

    function convertToChainsawObjectFromSnapshot(snapshot){
        let chainsaw = snapshot.data();
        chainsaw.id = snapshot.id;
        chainsaw.RegistrationDate = chainsaw.RegistrationDate ? new Date(chainsaw.RegistrationDate.seconds * 1000) : '';
        chainsaw.ExpirationDate = chainsaw.ExpirationDate ? new Date(chainsaw.ExpirationDate.seconds * 1000) : '';
        
        if(chainsaw.Owner && chainsaw.Owner.Barangay)
            chainsaw.Owner.Barangay = chainsaw.Owner.Barangay.toUpperCase();

        return chainsaw;
    }
    
});