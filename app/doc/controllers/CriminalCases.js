
myAppModule.
controller('CriminalCasesController', [
'dummyCriminalCrudService', 
// '$dateServie', 
// '$addressService', 
'$scope', 
'municipalityService',
function($crudService, $scope, municipalityService)  {
    var criminalCasesDocument = db.collection('database').doc('CriminalCase') ;
    var criminalCasesCollection = criminalCasesDocument.collection('databases');
    var criminalCases = [];
    var countries = [];
    var provincies = [];
    var municipalities = [];
    var barangays = [];
    
    $scope.firstNWords = {};
    $scope.row = {};
    $scope.criminalCasesTable = $scope.ngTable([]);
    $scope.criminalCasesFormData = { 
        Criminal_Case_Number: '1234456',
        Date_Filed: "2019-01-01",
        Plaintiff: "People of the Philippines",
        Accused: "Juan dela Cruz et. all",
        NPS_Number: "ABCD1234",
        Search_Warrant: "XYZ987",
        Bail_Amount: "123455.78",
        Complainant: "Batman Inc.",
        Agency_Filed: "Marvel Office",
        Court_Raffled: "Regional Trial Court",
        Respondents: [
            {
                Last_Name: "Potter",
                Middle_Initial: "I",
                First_Name: "Harry",
                Address: "Sesame St., Sta. Monica",
                Municipality: "Hogwartz",
                Province: "Gotham",
                Country: "Atlantis"
            }
        ],
        Violations: "RAPD 1234 Section 456, RAPD 987 Section 3293",
        Apprehended_Items: "3 kg peebles, 5 bakawan trees, 9 heads talking minas",
        Other_Details: "Unlawfully  entered the Philippines Waters with intent to gain and in fact when apprehended they have in their possession, custody and control fishing nets and other fishing equipments",
        Conveyances: "fishing boat with bow. No. 03011",
        Market_Value: "1000000",
        Disposition: "Banned species",
        Apprehension_Address: "Malambunga, Punta Baja Rd.",
        Apprehension_Date: "2019-02-28",
        Apprehending_Agency: "Philippine National Police",
        Apprehending_Officers: "PO1 Arlan Asutilla, PO2 Boy Langka",
        Form_of_Filing: "Inquest",
        Court_Status: "Pending before RTC",
        Prosecutor_Status: "Preliminary investigation",
        Fiscals_Resolution_Date: "2019-03-31",
        Decision_Date: "2019-03-31",
        Deciding_Agency: "Supreme Court",
        Decision: "Guilty",
        Receipt_Date: "2019-04-1",
        Penalty: "P1,000,000.00"
    };

    $scope.registrationForm = { title: "" };
    $scope.registrationForm.saveButton = {text:""}

    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $scope.refreshBarangays = () => {
        municipalityService.getBarangays($scope.criminalCasesFormData.Apprehension_Municipality).then(barangays => {
            $scope.barangays = barangays;
            $scope.criminalCasesFormData.Barangay = "";
        })
    }

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
        $scope.firstNWords[criminalCase.id] = getFirstNWords(criminalCase.Other_Details);
        $scope.row[criminalCase.id] = {
            shouldCollapse: true
        };
        
        return criminalCase;
    }

    function convertFromFormDataToCriminalCase(formData){
        var criminalCase = getValues(formData);
        var apprehensionDate = new Date(criminalCase.Apprehension_Date);
        criminalCase.Apprehension_Date = $scope.to_date(apprehensionDate);
        criminalCase.Date_Filed = $scope.to_date(criminalCase.Date_Filed);
        if(criminalCase.Fiscals_Resolution_Date)
            criminalCase.Fiscals_Resolution_Date = $scope.to_date(criminalCase.Fiscals_Resolution_Date);
        if(criminalCase.Decision_Date)
            criminalCase.Decision_Date = $scope.to_date(criminalCase.Decision_Date);
        if(criminalCase.Receipt_Date)
            criminalCase.Receipt_Date = $scope.to_date(criminalCase.Receipt_Date);
        criminalCase.Keywords = [criminalCase.Criminal_Case_Number, criminalCase.NPS_Number];
        criminalCase.Keywords = criminalCase.Keywords.concat(criminalCase.Violations.split(','));
        criminalCase.Respondents.forEach(respondent => {
            criminalCase.Keywords.push(`${respondent.First_Name} ${respondent.Middle_Initial} ${respondent.Last_Name}`);
        });

        criminalCase.Keywords = criminalCase.Keywords.filter(keyword => keyword && keyword.length > 0);
        console.log(criminalCase);
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

    $scope.shouldCollapse = true;
    $scope.collapse = (row) => {
        row.shouldCollapse = true;
    }
    $scope.expand = (row) => {
        row.shouldCollapse = false;
    }

    $scope.openForm = (event) => {
        // $scope.criminalCasesFormData = {};
        $scope.registrationForm.title = "Add New";
        $scope.registrationForm.saveButton.text = "Add";
        $scope.showPrerenderedDialog(event, 'criminalCaseRegistrationForm');
        $scope.saveCriminalCase = addCriminalCase;
    }
    
    $scope.openCriminalCaseFormForUpdating = (event, criminalCase) => {
        // $scope.criminalCasesFormData = {};
        $scope.registrationForm.title = "Update";
        $scope.registrationForm.saveButton.text = "Update";
        $crudService.getItem(criminalCase.id, criminalCasesCollection, convertFromSnapshotToCriminalCase).then(criminalCase => {
            $scope.criminalCasesFormData = criminalCase;
            $scope.refreshBarangays();
            $scope.criminalCasesFormData.Apprehension_Barangay = criminalCase.Apprehension_Barangay;
            $scope.showPrerenderedDialog(event, 'criminalCaseRegistrationForm');
        })
        $scope.saveCriminalCase = updateCriminalCase;
    }

    $scope.saveCriminalCase;

    function addCriminalCase(){
        $scope.close_dialog();
        var criminalCase = convertFromFormDataToCriminalCase($scope.criminalCasesFormData);
        
        $crudService.addItem(criminalCase, criminalCasesCollection).then(result => {
            $scope.toast("Success");
            $scope.refreshList();

            criminalCase.Month = $scope.to_month(criminalCase.Apprehension_Date);
            criminalCase.Year = $scope.to_year(criminalCase.Apprehension_Date);
            criminalCase.Municipality = criminalCase.Apprehension_Municipality;
            $crudService.updateCounterFor(criminalCase, criminalCasesDocument);
        })
    }

    $scope.closeRegistrationForm = () => {
        $crudService.getItem($scope.criminalCasesFormData.id, 
            criminalCasesCollection, 
            convertFromSnapshotToCriminalCase).then(criminalCase => {
            $scope.criminalCasesFormData = criminalCase;
        }) ;
        $scope.close_dialog();
    }

    function updateCriminalCase() {
        $scope.close_dialog();
        var criminalCase = convertFromFormDataToCriminalCase($scope.criminalCasesFormData);
        
        $crudService.updateItem(criminalCase).then(result => {
            $scope.toast("Success");
            $scope.refreshList();
        })
    }

    function getFirstNWords(text, N=5){
        if(!text) return "";
        var words = text.split(' ');
        if(words.length <= 5){
            return text;
        }

        let firstNWords = words.slice(0, N).join(' ') + "...";
        return firstNWords;
    }
    
}]);