'use strict';

myAppModule.controller('WSUPController', function ($scope, 
    $timeout, $mdToast,$localStorage, $crudService, municipalityService) {
    // var XLSX = require('xlsx'); //no need for web
    $scope.wsup_db = { data : [], summary : {} };
    $scope.wsup_db.data = ($localStorage.wsup_db_data)?  $localStorage.wsup_db_data : [];
    $scope.wsup_db.summary = ($localStorage.wsup_db_summary)?  $localStorage.wsup_db_summary : {};
    $scope.database_view = './app/pages/database/views/graphs.html';
    $scope.currentNavItem = 'respondents';
    $scope.dropDownSelect = {};
    $scope.selectItems = {};
    $scope.n = {};

    //WSUP
    $scope.loadWSUP = () => {
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
        });
    }
    
    $scope.loadWSUP();

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
    }
    
});

