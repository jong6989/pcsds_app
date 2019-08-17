myAppModule.
controller('ApprehensionController', function($scope, $crudService, municipalityService) {
    var moment = require('moment');
    var apprehensionDocument = db.collection('database').doc('Apprehension') ;
    var apprehensionCollection = apprehensionDocument.collection('database');    
    $scope.apprehensionsTable = $scope.ngTable([]);   

    $scope.refreshList = () => {
        $crudService.getItems(apprehensionCollection).then(apprehensions => {
            $scope.apprehensionsTable = $scope.ngTable(apprehensions);
        })
    }

    $scope.refreshList();

    $scope.Months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    $scope.monthDropDownOptions = [
        {id: 1, title: "January", days: 31},
        {id: 2, title: "February", days: 28},
        {id: 3, title: "March", days: 31},
        {id: 4, title: "April", days: 30},
        {id: 5, title: "May", days: 31},
        {id: 6, title: "June", days: 30},
        {id: 7, title: "July", days: 31},
        {id: 8, title: "August", days: 31},
        {id: 9, title: "September", days: 30},
        {id: 10, title: "October", days: 31},
        {id: 11, title:"November", days: 30},
        {id: 12, title: "December", days: 31}
    ];

    $scope.apprehensionFormData = {};
    $scope.saveApprehension  = addApprehension;
    $scope.apprehensionForm = {};
    $scope.closeAppehensionForm = () => {
        $scope.close_dialog();
    }
    $scope.municipalities = [];
    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $scope.refreshAOBarangays = () => {
        municipalityService.getBarangays($scope.apprehensionFormData.AO_MUNICIPALITY).then(barangays => {
            $scope.AOBarangays = barangays;
        });
    }
    $scope.refreshPABarangays = () => {
        municipalityService.
        getBarangays($scope.apprehensionFormData.PA_MUNICIPALITY).
        then(barangays => {
            $scope.PABarangays = barangays;
        });
    }

    $scope.openApprehensionForm = (event) => {
        $scope.saveApprehension  = addApprehension;
        $scope.PABarangays = [];
        $scope.AOBarangays = [];
        $scope.apprehensionFormData = {};
        $scope.action = "Add";
        $scope.apprehensionForm.title = "Add New";
        $scope.showPrerenderedDialog(event,'apprehensionForm');
    }

    $scope.getApprehension = (id) => {
        $crudService.getItem(id, apprehensionCollection).then(apprehension => {
            $scope.apprehensionFormData = convertToFormData(apprehension);
        });
    }

    $scope.openApprehensionFormForUpdating = (event, apprehensionID) => {
        $scope.saveApprehension = updateApprehension;
        $crudService.getItem(apprehensionID, apprehensionCollection).then(apprehension => {
            $scope.apprehensionFormData = convertToFormData(apprehension);
            $scope.refreshAOBarangays();
            $scope.refreshPABarangays();
            $scope.action = "Update";
            $scope.apprehensionForm.title = "Update";
            $scope.showPrerenderedDialog(event,'apprehensionForm');
        });
    }
    function convertToFormData(apprehension){
        if(apprehension.DATE_APPREHENSION)
            apprehension.ApprehensionDate = new Date(apprehension.DATE_APPREHENSION);
        let formData = apprehension;
        return formData;
    }

    function convertToApprehensionObject(formData){
        var apprehension = {
            CONTROL_NO: $scope.apprehensionFormData.CONTROL_NO || '',
            CASE_TITLE :$scope.apprehensionFormData.CASE_TITLE || '',
            VIOLATION: $scope.apprehensionFormData.VIOLATION || '',
            MONTH: $scope.apprehensionFormData.ApprehensionDate.getMonth() + 1,
            DAY: $scope.apprehensionFormData.ApprehensionDate.getDate(),
            YEAR: $scope.apprehensionFormData.ApprehensionDate.getFullYear(),
            AO_SO : $scope.apprehensionFormData.AO_SO || '',
            AO_BARANGAY: $scope.apprehensionFormData.AO_BARANGAY || '',
            AO_MUNICIPALITY: $scope.apprehensionFormData.AO_MUNICIPALITY || '',
            PA_SO: $scope.apprehensionFormData.PA_SO || '',
            PA_BARANGAY: $scope.apprehensionFormData.PA_BARANGAY || '',
            PA_MUNICIPALITY: $scope.apprehensionFormData.PA_MUNICIPALITY || '',
            APP_AGENCY: $scope.apprehensionFormData.APP_AGENCY || '',
            REMARKS: $scope.apprehensionFormData.REMARKS || '',
            Keywords: [],
            id: $scope.apprehensionFormData.id || ''
        };
        apprehension.Keywords.push(apprehension.CASE_TITLE);
        apprehension.Keywords.push(apprehension.CONTROL_NO);
        apprehension.Keywords.push(apprehension.VIOLATION);
        apprehension.Keywords = apprehension.Keywords.filter(item => { return item.length > 0; });
        var apprehensionDate = new Date(apprehension.YEAR, apprehension.MONTH - 1, apprehension.DAY);

        apprehension.DATE_APPREHENSION = moment(apprehensionDate).format('YYYY-MM-DD');
        return apprehension;
    }

    function addApprehension(){
        var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
        $scope.close_dialog(); 
        $crudService.addItem(apprehension, apprehensionCollection).then(addOperationResult => {
            $scope.toast("Sucess");                
            clearFormData();
            apprehension.Municipality = apprehension.PA_MUNICIPALITY;
            $crudService.updateCounterFor(apprehension, apprehensionDocument);
        },
        failedOperationResult => {
            $scope.toast("Adding of new apprehension failed.");
        });
    }

    function updateApprehension() {
        var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
        $scope.close_dialog();  
        $crudService.updateItem(apprehension, apprehensionCollection).then(updateResult => {
            $scope.toast("Sucess");
        },
        failedOperationResult => {
            $scope.toast("Updating failed.");
        });
    }
     function clearFormData(){
        $scope.apprehensionFormData = {};
     }

    $scope.dateNow = new Date();
})