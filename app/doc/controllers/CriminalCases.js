myAppModule.
controller('CriminalCasesController', ['$crudService', 
// '$dateServie', 
// '$addressService', 
'$scope', 
function($crudService, $scope)  {
    var criminalCasesDocument = db.collection('database').doc('CriminalCase') ;
    var criminalCasesCollection = criminalCasesDocument.collection('CriminalCases');
    var criminalCases = [];
    var countries = [];
    var provincies = [];
    var municipalities = [];
    var barangays = [];
    
    $scope.criminalCasesTable = $scope.ngTable([]);
    $scope.criminalCasesFormData = {};

    $scope.refreshList = () => {
        $crudService.getItems(criminalCasesCollection, convertFromSnapshotToCriminalCase).then(cases => {
            criminalCases = cases;
            $scope.criminalCasesTable = $scope.ngTable(criminalCases);
        })
    }
    $scope.refreshList();
    function convertFromSnapshotToCriminalCase(snapshot){
        
        var criminalCase = snapshot.data();
        criminalCase.id = snapshot.id;

        if(criminalCase.Date_Filed)
            criminalCase.Date_Filed = $scope.to_date(criminalCase.Date_Filed);
        if(criminalCase.Fiscals_Resolution_Date)
            criminalCase.Fiscals_Resolution_Date = $scope.to_date(criminalCase.Fiscals_Resolution_Date);
        if(criminalCase.Decision_Date)
            criminalCase.Decision_Date = $scope.to_date(criminalCase.Decision_Date);
        if(criminalCase.Receipt_Date)
            criminalCase.Receipt_Date = $scope.to_date(criminalCase.Receipt_Date);
        // criminalCase.firstNWords = getFirstNWords(criminalCase.Other_Details);
        criminalCase.firstNWords = getFirstNWords(criminalCase.Other_Details);
        console.log(criminalCase);
        return criminalCase;
    }

    function convertFromFormDataToCriminalCase(formData){
        var criminalCase = getValues(formData);

        return criminalCase;
    }

    function getValues(object){
        var keys = Object.keys(object);
        var returnValue = {};
        keys.forEach(key => {
            returnValue[key] = object[key] || '';
        })

        return returnValue;
    }

    $scope.viewRepondents = (event, respondents) => {
        event.preventDefault();
        $scope.respondentsTable = $scope.ngTable(respondents);
        $scope.showPrerenderedDialog(event, 'respondentsForm')
        
    }

    $scope.closeRegistrationForm = () => {
        $scope.close_dialog();
    }

    function getFirstNWords(text, N=5){
        console.log(text);

        if(!text) return "";
        var words = text.split(' ');
        if(words.length <= 5){
            return text;
        }

        let firstNWords = words.slice(0, N).join(' ') + "...";
        return firstNWords;
    }
}]);