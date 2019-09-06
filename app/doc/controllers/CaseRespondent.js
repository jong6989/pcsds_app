
myAppModule.
controller('CaseRespondentController',  (
    $scope,
    $addressService) => {
    $scope.respondentForm = {};
    $scope.respondentForm.respondentTable = $scope.ngTable([]);
    $scope.respondentForm.formData = {}
    $scope.respondentForm.saveButton = {};
    $scope.respondentForm.saveRespondent;
    $scope.respondentForm.countries = ["Philippines"];
    $scope.respondentForm.provinces = [];


    $addressService.getProvinces().then(provinces => {
        $scope.respondentForm.provinces = provinces;
    });

    $scope.respondentForm.refreshMunicipalities = () => {
        if($scope.respondentForm.formData.Province)
            $addressService.getMunicipalities($scope.respondentForm.formData.Country, $scope.respondentForm.formData.Province).
            then(municipalities => {
                $scope.respondentForm.municipalities = municipalities;
            });
        else
        {
            $scope.municipalities = [];
            $scope.barangays = [];
        }
    }

    $scope.respondentForm.dummyRespondent = {
        First_Name: "Arlan",
        Middle_Initial: "T",
        Last_Name: "Asutilla",
        Extension: "",
        Street: "Sesame",
        Barangay: "Santa Monica",
        Municipality: "Puerto Princesa City",
        Province: "Palawan",
        Country: "Philippines"   
    }

    $scope.openRespondentForm = (event) =>{
        $scope.respondentForm.saveRespondent = add;
        $scope.respondentForm.title = "Add";
        $scope.respondentForm.saveButton.text = "Add";
        $scope.respondentForm.formData = {};
        $scope.showPrerenderedDialog(event, "respondentFormWindow");
    }

    $scope.openRespondentFormForUpdating = (event, respondent) =>{
        $scope.respondentForm.saveRespondent = update;
        $scope.respondentForm.title = "Update";
        $scope.respondentForm.saveButton.text = "Update";
        $scope.respondentForm.formData = respondent;
        $scope.showPrerenderedDialog(event, "respondentFormWindow");
    }

    $scope.closeRespondentForm = () =>{
        $scope.close_dialog();
    }

    function add(respondent){
        
    }    

    function update(updatedRespondent){
        console.log(updatedRespondent);
    }

    $scope.respondentForm.refreshBarangays = () => {
        if($scope.respondentForm.formData.Province &&
            $scope.respondentForm.formData.Municipality)
            $addressService.getBarangays(
                $scope.respondentForm.formData.Country || 'PHILIPPINES', 
                $scope.respondentForm.formData.Province, 
                $scope.respondentForm.formData.Municipality).then(barangays => {
                $scope.respondentForm.barangays = barangays;
            });
        else
            $scope.barangays = [];
    }

});