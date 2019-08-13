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
    $scope.currentNavItem = 'Statistics';
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
        $scope.toast('new WSUP data added!');
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
controller('ApprehensionController', function($scope, $apprehesionService, municipalityService) {
    $scope.apprehensionsTable = $scope.ngTable([]);
    $apprehesionService.getApprehensions().then(apprehensions => {
        $scope.apprehensionsTable = $scope.ngTable(apprehensions);
    });

    $scope.Months = [
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

    $scope.closeAppehensionForm = () => {
        $scope.close_dialog();
    }
    $scope.municipalities = [];
    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $scope.refreshAOBarangays = () => {
        municipalityService.getBarangays($scope.apprehensionFormData.AO_Municipality).then(barangays => {
            $scope.AOBarangays = barangays;
        });
    }
    $scope.refreshPABarangays = () => {
        municipalityService.
        getBarangays($scope.apprehensionFormData.PA_Municipality).
        then(barangays => {
            $scope.PABarangays = barangays;
        });
    }

    $scope.openApprehensionForm = (event) => {
        $scope.saveApprehension  = addApprehension;
        $scope.showPrerenderedDialog(event,'apprehensionForm');
    }

    $scope.getApprehension = (id) => {
        $apprehesionService.getApprehension(id).then(apprehension => {
            $scope.apprehensionFormData = convertToFormData(apprehension);
        })
    }

    $scope.openApprehensionFormForUpdating = (event, apprehensionID) => {
        $scope.saveApprehension = updateApprehension;
        $apprehesionService.getApprehension(apprehensionID).then(apprehension => {
            $scope.apprehensionFormData = convertToFormData(apprehension);
            $scope.refreshAOBarangays();
            $scope.refreshPABarangays();
            $scope.showPrerenderedDialog(event,'apprehensionForm');
        })
    }
    function convertToFormData(apprehension){
        let formData = apprehension;
        formData.Violations = apprehension.Violations.join(',');
        formData.ApprehensionDate =  new Date( apprehension.Year, apprehension.Month - 1, apprehension.Day);
        formData.PA_Barangay = apprehension.PA_Barangay.toUpperCase();
        formData.AO_Barangay = apprehension.AO_Barangay.toUpperCase();
        return formData;
    }

    function convertToApprehensionObject(formData){
        var apprehension = {
            Control_Number: $scope.apprehensionFormData.Control_Number || '',
            Case_ID :$scope.apprehensionFormData.Case_ID || '',
            Violations: $scope.apprehensionFormData.Violations && $scope.apprehensionFormData.Violations.split(',') || '',
            Month: $scope.apprehensionFormData.ApprehensionDate.getMonth() + 1,
            Day: $scope.apprehensionFormData.ApprehensionDate.getDate(),
            Year: $scope.apprehensionFormData.ApprehensionDate.getFullYear(),
            AO_Sitio : $scope.apprehensionFormData.AO_Sitio || '',
            AO_Barangay: $scope.apprehensionFormData.AO_Barangay || '',
            AO_Municipality: $scope.apprehensionFormData.AO_Municipality || '',
            PA_Sitio: $scope.apprehensionFormData.PA_Sitio || '',
            PA_Barangay: $scope.apprehensionFormData.PA_Barangay || '',
            PA_Municipality: $scope.apprehensionFormData.PA_Municipality || '',
            Apprehending_Agency: $scope.apprehensionFormData.Apprehending_Agency || '',
            Remarks: $scope.apprehensionFormData.Remarks || '',
            Keywords: [$scope.apprehensionFormData.Control_Number],
            id: $scope.apprehensionFormData.id || ''
        };
        apprehension.Keywords = apprehension.Keywords.concat(apprehension.Violations);
        
        return apprehension;
    }

    function addApprehension(){
        var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
         
        $apprehesionService.
        addApprehension(apprehension).
        then(addOperationResult => {
            $scope.toast("Sucess");
            $scope.close_dialog();     
            clearFormData();
        },
        failedOperationResult => {

        });
    }

    function updateApprehension() {
        var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
        $apprehesionService.
        updateApprehension(apprehension).
        then(updateResult => {
            $scope.toast("Sucess");
            $scope.close_dialog();  
        });
    }
     function clearFormData(){
        $scope.apprehensionFormData = {};
     }

    $scope.dateNow = new Date();
}).
service('$apprehesionService', function() {
    var apprehensionDocument = db.collection('database').doc('Apprehension') ;
    var apprehensionCollection = apprehensionDocument.collection('apprehensions');

    this.getApprehensions = () => {
        var promise = new Promise((resolve, reject) => {
            db.collection('database').
                doc('Apprehension').
                collection('apprehensions').
                onSnapshot(snapShot => {
                    let apprehensions = snapShot.docs.map( documentSnapshot => {
                        let apprehension = documentSnapshot.data();
                        apprehension.id = documentSnapshot.id;
                        
                        return apprehension;
                    });
        
                    resolve(apprehensions);
                }); 
        });
        return promise;
    };

    this.addApprehension = (apprehension) => {
        var promise = new Promise((resolve, reject) =>{       
            apprehensionCollection
            add(apprehension).
            then(addApprehensionResult => {
                this.updateCounterFor(apprehension).
                then(updateCounterResult =>{
                    resolve(addApprehensionResult);
                });
            },
            failedOperationResult => {
                reject(failedOperationResult);
            })
        });
        return promise;
    }

    this.updateApprehension = (apprehension) => {
        let promise = new Promise((resolve, reject) => {
            apprehensionCollection.
            doc(apprehension.id).
            update(apprehension).
            then(updateResult => {
                resolve(updateResult);
            });
        })
        
        return promise;
    }

    this.getApprehension = (id) => {
        let promise = new Promise((resolve, reject) => {
            apprehensionCollection.
            doc(id).
            onSnapshot(documentSnapshot => {
                let apprehension = documentSnapshot.data();
                apprehension.id = documentSnapshot.id;
                resolve(apprehension);
            });
        })
        
        return promise;
    }
    this.updateCounterFor = (apprehension) => {
        var counter = {};
        counter["yearlyCount.total"] =firebase.firestore.FieldValue.increment(1);
        if(apprehension.Year) 
            counter[`yearlyCount.${apprehension.Year}.total`] = 
                firebase.firestore.FieldValue.increment(1);
        if(apprehension.Month) 
            counter[`yearlyCount.${apprehension.Year}.${apprehension.Month}`] = 
                firebase.firestore.FieldValue.increment(1);
        if(apprehension.PA_Municipality && apprehension.PA_Municipality !== 'N/A') 
            counter[`municipalityCount.${apprehension.PA_Municipality}`] = 
                firebase.firestore.FieldValue.increment(1);
        
        return db.
        collection('database').
        doc('Apprehension').
        update(counter);
    }
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

    this.getBarangays = (municipality) => {
        return new Promise((resolve, reject) => {  
            var palawanMunicipalities = require('./json/palawanMunicipalities.json');
            var barangays = palawanMunicipalities["municipality_list"][municipality] ?
                palawanMunicipalities["municipality_list"][municipality]["barangay_list"] :
                [];

            resolve(barangays)
        })
    }
}).
controller('ChainsawRegistrationController', ($scope, $chainsawService, municipalityService) => {
    $scope.registeredChainsawsTable = $scope.ngTable([]);
    $scope.chainsawFormData = {};
    $scope.municipalities = [];
    $scope.barangays  = [];
    $scope.dateNow = new Date();
    $scope.chainsaws = [];

    municipalityService.getMunicipalities().then(municipalities => {
        $scope.municipalities = municipalities;
    });

    $chainsawService.getRegisteredChainsaws().then(chainsaws => {
        $scope.chainsaws = chainsaws;
        $scope.registeredChainsawsTable = $scope.ngTable(chainsaws);
    });

    function addChainsaw(){
        let chainsaw = convertToChainsawObject($scope.chainsawFormData)
        $chainsawService.addChainsaw(chainsaw).
        then(result => {
            $scope.toast('Success');
            $scope.close_dialog();
            $scope.chainsaws.push(chainsaw);
            refreshRegisteredChainsawsTable();
            $scope.chainsawFormData = {};
        },
        error => { 
            console.log(error);
        });
    }

    function refreshRegisteredChainsawsTable(){
        $scope.registeredChainsawsTable = $scope.ngTable($scope.chainsaws);
    }

    function updateChainsaw() {
        let updatedChainsaw = convertToChainsawObject($scope.chainsawFormData)
        $chainsawService.updateChainsaw(updatedChainsaw).then(chainsaw => {
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
        $scope.showPrerenderedDialog(event, 'chainsawRegistrationForm');
    }

    $scope.openRegistrationFormForUpdating = (event, id) => {     
        $scope.saveChainsaw = updateChainsaw;
        $chainsawService.
        getChainsaw(id).
        then(chainsaw => {
            $scope.chainsawFormData = chainsaw;
            $scope.refreshBarangays();
        })
        $scope.showPrerenderedDialog(event, 'chainsawRegistrationForm');
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
            CurrentCORNumber: formData.CurrentCORNumber || '',
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
            chainsaw.CurrentCORNumber
        ].filter(value => value.length > 0);
        return chainsaw;
    }
}).
service('$chainsawService', function(){
    var chainsawDocument = db.collection('database').doc('ChainsawRegistration') ;
    var chainsawCollection = chainsawDocument.collection('Registerted Chainsaws');

    this.getRegisteredChainsaws = () => {
        let promise = new Promise((resolve, reject) => {
            chainsawCollection.onSnapshot(snapShot => {
                let chainsaws = snapShot.docs.map(documentSnapshot => {
                    let chainsaw =  documentSnapshot.data();
                    chainsaw.id = documentSnapshot.id;
                    return chainsaw;
                });

                resolve(chainsaws);
            });
        });

        return promise;
    }

    this.getChainsaw = (id) => {
        let promise = new Promise((resolve, reject) => {
            chainsawCollection.doc(id).
            onSnapshot(snapshot => {
                let chainsaw = snapshot.data();
                chainsaw.id = id;
                chainsaw.RegistrationDate = chainsaw.RegistrationDate ? new Date(chainsaw.RegistrationDate.seconds * 1000) : '';
                chainsaw.ExpirationDate = chainsaw.ExpirationDate ? new Date(chainsaw.ExpirationDate.seconds * 1000) : '';
                resolve(chainsaw);
            });
        });
        
        return promise;
    }
    this.addChainsaw = (chainsaw) => {
        let promise = new Promise((resolve, reject) => {
            chainsawCollection.add(chainsaw).then(documentRef => {
                this.updateCounterFor(chainsaw).then(result => {
                },
                error => {
                
                });
                resolve(chainsaw);
            },
            error => {
                reject(error);
            });
        });
        return promise;
    }

    this.updateChainsaw = (chainsaw) => {
        
        let promise = new Promise((resolve, reject) => {
            chainsawCollection.doc(chainsaw.id).update(chainsaw).
            then(result => {
                resolve(chainsaw);
            },
            error => {
                reject(error);
            })
        })
        return promise;
    }

    this.updateCounterFor = (chainsaw) => {
        let promise = new Promise((resolve, reject) => {
        
        var counter = {};
            if(chainsaw.RegistrationDate) {
                // counter.yearlyCount = {};
                // counter.yearlyCount.total = firebase.firestore.FieldValue.increment(1);
                // counter.yearlyCount[chainsaw.RegistrationDate.getFullYear()] = {};
                // counter.yearlyCount[chainsaw.RegistrationDate.getFullYear()].total = firebase.firestore.FieldValue.increment(1);
                // counter.yearlyCount[chainsaw.RegistrationDate.getFullYear()][chainsaw.RegistrationDate.getMonth() + 1] = firebase.firestore.FieldValue.increment(1);
                counter["yearlyCount.total"] = firebase.firestore.FieldValue.increment(1);
                counter[`yearlyCount.${chainsaw.RegistrationDate.getFullYear()}.total`] = firebase.firestore.FieldValue.increment(1);
                counter[`yearlyCount.${chainsaw.RegistrationDate.getFullYear()}.${chainsaw.RegistrationDate.getMonth() + 1}`] = firebase.firestore.FieldValue.increment(1); 
            }

            if(chainsaw.Municipality)
            {
                counter[`municipalityCount.${chainsaw.Municipality}`] = firebase.firestore.FieldValue.increment(1);
                // counter.municipalityCount = {};
                // counter.municipalityCount[chainsaw.Municipality] = firebase.firestore.FieldValue.increment(1);
            }

            if(Object.keys(counter).length)
            {
                chainsawDocument.set(counter).
                then(result => {

                },
                error => {
                    console.log(error);
                });
            }

        });

        return promise;
    }
});
// service('$chainsawService', function(){
//     this.getRegisteredChainsaws = () => {
//         var chainsaws = require('./json/chainsaw.json')
//         let promise = new Promise((resolve, reject) => {
//             resolve(chainsaws);
//         });

//         return promise;
//     }

//     this.addChainsaw = (chainsaw) => {
//         
//         let promise = new Promise((resolve, reject) => {
//             this.getRegisteredChainsaws().then(chainsaws => {
//                 chainsaws.push(chainsaw);
//                 resolve(chainsaw);
//             })
//         })
//         return promise;
//     }
// });
