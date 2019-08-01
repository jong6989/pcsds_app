'use strict';

myAppModule.controller('database_permit_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    var XLSX = require('xlsx');
    $scope.wsup_data = [];
    $scope.sep_data = [];
    $scope.apprehension_data = [];
    $scope.admin_cases_data = [];
    var uploading_type = '';
    $scope.is_loading = false;
    $scope.is_deleting = {value : false,type:''};
    var PERMITS_DB = new JsonDB( dbFolder + "PERMITS", true, false);

    $scope.permit_types = [
        {code:"wsup",name:"Wildlife Special Use Permit"},
        {code:"sep",name:"Strategic Environmental Plan (SEP) Permit"},
        {code:"apprehension",name:"PCSD Apprehension"},
        {code:"admin_cases",name:"PAB Admin Cases"}
                        ];
    $scope.permit_types.forEach(pt => {
        let zx = ()=>{
            if(pt.code=='wsup') $scope.wsup_data = PERMITS_DB.getData("/"+pt.code);
            if(pt.code=='sep') $scope.sep_data = PERMITS_DB.getData("/"+pt.code);
            if(pt.code=='apprehension') $scope.apprehension_data = PERMITS_DB.getData("/"+pt.code);
            if(pt.code=='admin_cases') $scope.admin_cases_data = PERMITS_DB.getData("/"+pt.code);
        };
        try {
            zx();
        } catch(error) {
            PERMITS_DB.push("/"+pt.code,[]);
        };
        //firebase
        fire.db.datasets.get(pt.code,(z)=>{
            if(z == undefined){
                fire.db.datasets.set(pt.code,{data:[]});
            }else {
                PERMITS_DB.push("/"+pt.code,z.data);
                zx();
            }
            //realtime updates
            fire.db.datasets.when(pt.code,(c)=>{
                PERMITS_DB.push("/"+pt.code,c.data);
                zx();
            });
        });
    });

    $scope.get_data_scope = (t)=>{
        if(t=='wsup') return $scope.wsup_data;
        if(t=='sep') return $scope.sep_data;
        if(t=='apprehension') return $scope.apprehension_data;
        if(t=='admin_cases') return $scope.admin_cases_data;
    }

    $scope.initialize_data = (t)=>{
        let x = PERMITS_DB.getData("/"+t);
        return ( x.length > 0 ) ? x : [];
    }

    $scope.search_from_db = (q,t)=>{
        let x = PERMITS_DB.getData("/"+t);
        var results = [];
        x.forEach(element => {
            element.data.forEach(item => {
                let p = false;
                for (const key in item) {
                    if(item[key]==q) p = true;
                }
                if(p) results.push(item);
            });
        });
        return results;
    }

    $scope.check_empty = (t)=>{ return ( PERMITS_DB.getData("/"+t).length > 0 ) ? false : true }

    $scope.upload_excel = (f,t)=>{
        if(uploading_type != '') return null;
        if(typeof(f) == typeof([])){
            uploading_type = t;
            var f = f[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = e.target.result;
                data = new Uint8Array(data);
                let wb = XLSX.read(data, {type: 'array'});
                wb.SheetNames.forEach(element => {
                    if(t=='wsup') $scope.wsup_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if(t=='sep') $scope.sep_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if(t=='apprehension') $scope.apprehension_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if(t=='admin_cases') $scope.admin_cases_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                });
                uploading_type = '';
                PERMITS_DB.push("/"+t,[]);
            };
            reader.readAsArrayBuffer(f);
        }else {
            $scope.toast("file error");
        }
    }

    $scope.uploading_excel = (t)=>{
        return (uploading_type == t) ? true : false;
    }
    
    $scope.delete_excel = (t)=>{
        fire.db.datasets.update(t,{data:[]});
        if(t=='wsup') {$scope.wsup_data.splice(0,$scope.wsup_data.length);}
        if(t=='sep') {$scope.sep_data.splice(0,$scope.sep_data.length);}
        if(t=='apprehension') {$scope.apprehension_data.splice(0,$scope.apprehension_data.length);}
        if(t=='admin_cases') {$scope.admin_cases_data.splice(0,$scope.admin_cases_data.length);}
        PERMITS_DB.push("/"+t,[]);

    }

    $scope.cancel_excel = (t)=>{
        if(t=='wsup') $scope.wsup_data.splice(0,$scope.wsup_data.length);
        if(t=='sep') $scope.sep_data.splice(0,$scope.sep_data.length);
        if(t=='apprehension') $scope.apprehension_data.splice(0,$scope.apprehension_data.length);
        if(t=='admin_cases') $scope.admin_cases_data.splice(0,$scope.admin_cases_data.length);
    }

    var calculate_items = (d)=>{
        let i = 0;
        d.forEach(j => {
            i = i + j.data.length;
        });
        return i;
    }

    $scope.save_database = (d,t)=>{
        $scope.toast("Data saved");
        PERMITS_DB.push("/"+t,d);
        fire.db.datasets.update(t,{data:d});

        // async function createDatabase ()  {
        //     await fire.db.database.query.doc("WSUP").set({"id":"WSUP"});
        //     console.log("DB Created");
        //     d[0].data.forEach( async (e) => {
        //         let i = {};
        //         for (const key in e) {
        //             if (e.hasOwnProperty(key)) {
        //                 const element = (e[key] != undefined)? e[key] : '';
        //                 i[key] = element;
        //             }
        //         }
        //         i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
        //         i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
        //         if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
        //             i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
        //         }
        //         if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
        //             i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
        //         }
        //         i.keywords = i.name.split(' ').filter( d => d.length > 1);
        //         await fire.db.database.query.doc("WSUP").collection("database").add(i);
        //         let u = {};
        //         u["count.all"] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
        //         await fire.db.database.query.doc("WSUP").update(u);
        //     });
        // };
        // createDatabase();
        

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

    $scope.export_database_to_excel = (d,t)=>{
        ipcRenderer.send('save_workbook_as_excel',d);
    }

    $scope.open_database = (t)=>{
        $scope.open_window_view("app/pages/database/permits/single/sheets.html",t);
    };

    $scope.set_changed = (x)=>{
        $scope.changed = x;
    }

    $scope.check_loading = (t)=>{
        return ($scope.is_loading.value == true && $scope.is_loading.type == t);
    }

    $scope.check_deleting = (t)=>{
        return ($scope.is_deleting.value == true && $scope.is_deleting.type == t);
    }

});