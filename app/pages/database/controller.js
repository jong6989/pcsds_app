'use strict';

document.write(`<script src="./plugins/chartjs/Chart.min.js"></script>`);
var graphOption = {
    responsive: true,
    title: {
        display: true,
        text: ''
    },
    tooltips: {
        mode: 'index',
        intersect: false,
    },
    hover: {
        mode: 'nearest',
        intersect: true
    },
    scales: {
        xAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Year'
            }
        }],
        yAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Count'
            }
        }]
    }
};
myAppModule.controller('pcsd_database_controller', function ($scope, 
    $timeout, $utils, $mdToast,$localStorage) {
    var XLSX = require('xlsx');
    $scope.wsup_db = { data : [], summary : {} };
    $scope.wsup_db.data = ($localStorage.wsup_db_data)?  $localStorage.wsup_db_data : [];
    $scope.wsup_db.summary = ($localStorage.wsup_db_summary)?  $localStorage.wsup_db_summary : {};
    $scope.database_view = './app/pages/database/views/graphs.html';
    $scope.currentNavItem = 'Status';
    $scope.dropDownSelect = {};
    $scope.selectItems = {};
    $scope.n = {};

    //WSUP
    fire.db.database.query.doc('WSUP').collection("database").onSnapshot(qs => {
        let res = qs.docs.map( dx => {
            let b = dx.data();
            b.id = dx.id;
            return b;
        });
        $scope.wsup_db.data = $localStorage.wsup_db_data = res;
        $scope.invalidate_data_table($scope.wsup_db.data);
    });
    fire.db.database.when("WSUP",(d) => {
        $scope.wsup_db.summary = $localStorage.wsup_db_summary = d;
        setTimeout($scope.loadGraph, 100);
    });

    $scope.invalidate_data_table = (d)=>{
        $scope.data_table = $scope.ngTable(d);
    };

    $scope.getKeys = (data,key) => {
        let f = {};
        data.map( d => { 
            if(d[key]) f[d[key]] = true; 
            return d[key]; 
        } );
        let r = [];
        let c = [];
        for (const key in f) {
            r.push({id: key, title: key});
            c.push(key);
        }
        $scope.selectItems[key] = c;
        $scope.dropDownSelect[key] = r;
    };

    $scope.changeView = (v) => { $scope.database_view = v; };

    $scope.loadGraph = () => {
        let labels = [];
        let datas = [];
        if($scope.wsup_db.summary){
            //Yearly Count
            if($scope.wsup_db.summary.count){
                for (const key in $scope.wsup_db.summary.count) {
                    if ($scope.wsup_db.summary.count.hasOwnProperty(key)) {
                        const e = $scope.wsup_db.summary.count[key];
                        if(key != 'all'){
                            labels.push(key);
                            datas.push(e.total);
                        }
                    }
                }
                graphOption.title.text = 'Yearly Permit Status';
                var graph_config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'WSUP',
                            fill: false,
                            backgroundColor: '#f67019',
                            borderColor: '#f67019',
                            data: datas,
                        }]
                    },
                    options: graphOption
                };
                new Chart(document.getElementById('canvas1').getContext('2d'), graph_config);
            }
            
            //Per Municipality
            if($scope.wsup_db.summary.per_municipality){
                labels = [];
                datas = [];
                for (const key in $scope.wsup_db.summary.per_municipality) {
                    if ($scope.wsup_db.summary.per_municipality.hasOwnProperty(key)) {
                        const e = $scope.wsup_db.summary.per_municipality[key];
                        if(e > 50) {
                            labels.push(key);
                            datas.push(e);
                        }
                    }
                }
                graphOption.title.text = 'Total Permit Per Municipality';
                graphOption.scales.xAxes[0].scaleLabel.labelString = 'Municipality/City';
                var graph_config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'WSUP',
                            fill: false,
                            backgroundColor: '#f67019',
                            borderColor: '#f67019',
                            data: datas,
                        }]
                    },
                    options: graphOption
                };
                new Chart(document.getElementById('canvas2').getContext('2d'), graph_config);
            }
        }else {
            setTimeout($scope.loadGraph, 3000);
        };
    };

    $scope.openAddWSUPModal = (evt) => {
        $scope.n = {};
        $scope.showPrerenderedDialog(evt,'addWSUP');
    };

    $scope.addWSUPData = async (e) => {
        $scope.close_dialog();
        let i = {};
        for (const key in e) {
            if (e.hasOwnProperty(key)) {
                const element = (e[key] != undefined)? e[key] : '';
                i[key] = element;
            }
        }
        i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
        i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
        if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
            i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
        }
        if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
            i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
        }
        i.keywords = i.name.split(' ').filter( d => d.length > 1);
        await fire.db.database.query.doc("WSUP").collection("database").add(i);
        let u = {};
        u["count.all"] = firebase.firestore.FieldValue.increment(1);
        if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
        if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
        if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
        await fire.db.database.query.doc("WSUP").update(u);
        $scope.toast('New WSUP data added!');
    };


    $scope.upload_excel = (files, permitType)=>{
        if(uploading_type != '') return;
        if(typeof(files) == typeof([])){
            uploading_type = t;
            var file = files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = new Uint8Array(e.target.result);
                let wb = XLSX.read(data, {type: 'array'});
                wb.SheetNames.forEach(element => {
                    let jsonData = XLSX.utils.sheet_to_json(wb.Sheets[element]);
                });
            };
            reader.readAsArrayBuffer(file);
        }else {
            $scope.toast("file error");
        }

    }

    $scope.save_database = (json, databaseName)=>{

        async function createDatabase ()  {
            await fire.db.database.query.doc("WSUP").set({"id":"WSUP"});
            //console.log("DB Created");
            json[0].data.forEach( async (e) => {
                let i = {};
                for (const key in e) {
                    if (e.hasOwnProperty(key)) {
                        const element = (e[key] != undefined)? e[key] : '';
                        i[key] = element;
                    }
                }
                i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
                i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
                if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
                    i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
                }
                if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
                    i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
                }
                i.keywords = i.name.split(' ').filter( d => d.length > 1);
                await fire.db.database.query.doc("WSUP").collection("database").add(i);
                let u = {};//statisticss
                u["count.all"] = firebase.firestore.FieldValue.increment(1);
                if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
                if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
                if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
                await fire.db.database.query.doc("WSUP").update(u);
            });
        };
        createDatabase();
        

        // let vv = [ 'Corporation ', 'Last_Name'];

        // vv.forEach(v => {
        //     let mun = {};
        //     d[0].data.forEach(e => {
        //         if(e[v] != undefined)
        //             mun[e[v]] = (mun[e[v]] == undefined)? 1 : mun[e[v]] + 1;
        //     });
        //     console.log(mun);
        // });

        
    }
}).
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
        if(apprehension.APPREHENSION_DATE)
            apprehension.ApprehensionDate = new Date(apprehension.APPREHENSION_DATE);
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

        apprehension.APPREHENSION_DATE = moment(apprehensionDate).format('YYYY-MM-DD');
        return apprehension;
    }

    function addApprehension(){
        var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
        $crudService.addItem(apprehension, apprehensionCollection).then(addOperationResult => {
            $scope.toast("Sucess");
            $scope.close_dialog();     
            clearFormData();
            apprehension.Municipality = apprehension.PA_MUNICIPALITY;
            $crudService.updateCounterFor(apprehension, apprehensionDocument);
        },
        failedOperationResult => {
            console.log(failedOperationResult);
        });
    }

    function updateApprehension() {
        var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
        $crudService.updateItem(apprehension, apprehensionCollection).then(updateResult => {
            $scope.toast("Sucess");
            $scope.close_dialog();  
        });
    }
     function clearFormData(){
        $scope.apprehensionFormData = {};
     }

    $scope.dateNow = new Date();
}).
service("municipalityService", function(){
    this.getMunicipalities = () =>{
        var palawanMunicipalities = Object.keys(
                require('./json/palawanMunicipalities.json').municipality_list
                );

        return new Promise((resolve, reject)=>{
            resolve(palawanMunicipalities);
        })
    }

    this.addMunicipality = (municipality) => {

    }

    this.getBarangays = (municipalityName) => {
        return new Promise((resolve, reject) => {  
            var palawanMunicipalities = require('./json/profile/municipality.json');
            var barangays = [];
            var index = palawanMunicipalities["data"].findIndex(municipality => 
                    municipality.name == municipalityName);
            console.log(index);
            if(index >= 0){
                barangays = palawanMunicipalities["data"][index]["brgy"].
                    map(barangay => barangay.name);
            }
            
            resolve(barangays)
        })
    }
}).
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
    
}).
controller('PermitController', function($crudService, municipalityService, $scope){
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

}).
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
}).
service('$crudService', function(){

    this.getItems = (collection, objectConverter) => {
        // var items = []
        if(!objectConverter)
            objectConverter = defaultObjectConverter;
        
        let promise = new Promise((resolve, reject) => {
            collection.onSnapshot(snapShot => {
                let items = snapShot.docs.map(documentSnapshot =>{
                    let item = objectConverter(documentSnapshot);

                    return item;
                });

                resolve(items);
            });
        });

        return promise;
    }

    this.getItem = (id, collection, objectConverter) => {
        if(!objectConverter)
            objectConverter = defaultObjectConverter;
        
        let promise = new Promise((resolve, reject) => {
            collection.doc(id).onSnapshot(documentSnapshot => {
                let item = objectConverter(documentSnapshot);
                resolve(item);
            });
        },
        error => {
            reject(error);
        });

        return promise;
    }

    function defaultObjectConverter(documentSnapshot){
        let item =  documentSnapshot.data();
        item.id = documentSnapshot.id;

        return item;
    }

    this.addItem = (itemToAdd, collection) => {
        let promise = new Promise((resolve, reject) => {
            collection.add(itemToAdd).then(result => {
                resolve();
            },
            error => {
                reject(error);
            });
        })
        return promise;
    }

    this.updateItem = (item, collection) => {
        let promise = new Promise((resolve, reject) => {
            collection.doc(item.id).update(item).then(result =>{
                resolve();
            },
            error => { reject(error); });
        })

        return promise;
    }

    this.updateCounterFor = (item, document) => {
        let promise = new Promise((resolve, reject) => {
        
        var counter = {};
            if(item.Year && item.Month) {
                counter["yearlyCount.total"] = firebase.firestore.FieldValue.increment(1);
                counter[`yearlyCount.${item.Year}.total`] = firebase.firestore.FieldValue.increment(1);
                counter[`yearlyCount.${item.Year}.${item.Month}`] = firebase.firestore.FieldValue.increment(1); 
            }

            if(item.Municipality)
            {
                counter[`municipalityCount.${item.Municipality}`] = firebase.firestore.FieldValue.increment(1);                
            }

            if(Object.keys(counter).length)
            {
                document.update(counter).
                then(result => {

                },
                error => {
                    console.log(error);
                });
            }

        });

        return promise;
    }
}).
service('$dateService', function(){
    $this.convertToJSDate = (firebaseDate) => {
        return new Date(firebaseDate.seconds * 1000);
    }
}).
service('$addressService', function(){
    var countries = require('./json/coutries.json');
    var philippineProvinces = require('./json/philippineProvinces.json');

    this.getCountries = () =>{
        return new Promise((resolve, reject) => {
            resolve(countries);
        });
    }

    this.getProvinces = (country) => {
        return new Promise((resolve, reject) => {
            resolve(philippineProvinces);
        });
    }

    this.getMunicipalities = (country, province) => {
        return new Promise((resolve, reject) => {
            var municipalities = [];
            if(country.toUpperCase() == 'PHILIPPINES')
                municipalities =  philippineProvinces[province];
            
            resolve(municipalities);
        })
    }

    this.getBarangays = (country, province, municipality) => {
        return new Promise((resolve, reject) => {
            var barangays = [];
            if(country.toUpperCase() == 'PHILIPPINES')
                barangays = philippineProvinces[province][municipality];
            resolve(barangays);
        })
    }
});
