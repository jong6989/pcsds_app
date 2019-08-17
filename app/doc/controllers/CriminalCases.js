myAppModule.
controller('CriminalCasesController', function($crudService, $dateService, $addressService, $scope)  {
    var criminalCasesDocument = db.collection('database').doc('CriminalCase') ;
    var criminalCasesCollection = criminalCasesDocument.collection('CriminalCases');
    var criminalCases = [];
    var countries = [];
    var provincies = [];
    var municipalities = [];
    var barangays = [];
    
    $scope.criminalCasesTable = new ngTable([]);
    $scope.criminalCasesFormData = {};

    $scope.refreshList = () => {
        $crudService.getItems(criminalCasesCollection, convertFromSnapshotToCriminalCase).then(cases => {
            criminalCases = cases;
            $scope.criminalCasesTable = new ngTable(criminalCases);
        })
    }

    function convertFromSnapshotToCriminalCase(snapshot){
        var criminalCase = snapshot.data();
        criminalCase.id = snapshot.id;

        if(criminalCase.Date_Filed)
            criminalCase.Date_Filed = $dateService.convertToJSDate(criminalCase.Date_Filed);
        if(criminalCase.Fiscals_Resolution_Date)
            criminalCase.Fiscals_Resolution_Date = $dateService.convertToJSDate(criminalCase.Fiscals_Resolution_Date);
        if(criminalCase.Decision_Date)
            criminalCase.Decision_Date = $dateService.convertToJSDate(criminalCase.Decision_Date);
        if(criminalCase.Receipt_Date)
            criminalCase.Receipt_Date = $dateService.convertToJSDate(criminalCase.Receipt_Date);
        
        return criminalCase;
    }
});