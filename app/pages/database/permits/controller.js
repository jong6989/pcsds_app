'use strict';

myAppModule.controller('database_permit_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    var XLSX = require('xlsx');
    $scope.xlxs_data = [];
    $scope.wsup_data = [];
    var uploading_type = '';
    $scope.is_loading = false;
    $scope.is_deleting = false;
    var PERMITS_DB = new JsonDB("DB/PERMITS", true, false);
    try {
        PERMITS_DB.getData("/wsup");
    } catch(error) {
        PERMITS_DB.push("/wsup",[]);
    };

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
                });
                uploading_type = '';
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
        $scope.is_deleting = true;
        let q = { 
            data : { 
                action : "database/permits/delete",
                type : t,
                user_id : $scope.user.id
            },
            callBack : (data)=>{
                $scope.is_deleting = false;
                if(t=='wsup') {$scope.wsup_data.splice(0,$scope.wsup_data.length);}
                PERMITS_DB.push("/"+t,[]);
                let toast = (data.data.status == 0)? data.data.error : data.data.data;
                $scope.toast(toast);
            },
            errorCallBack : ()=>{
                $scope.toast("Offline, internet connection is needed for this function.");
            }
        };
        $utils.api(q);
    }

    $scope.cancel_excel = (t)=>{
        if(t=='wsup') $scope.wsup_data.splice(0,$scope.wsup_data.length);
    }

    var calculate_items = (d)=>{
        let i = 0;
        d.forEach(j => {
            i = i + j.data.length;
        });
        return i;
    }

    $scope.save_database = (d,t)=>{
        $scope.is_loading = true;
        $scope.total_items = calculate_items(d);
        $scope.pointer = 0;
        $scope.toast("Data saved");
        PERMITS_DB.push("/"+t,$scope.wsup_data);
        var u = (sp,ip)=>{
            let q = { 
                data : { 
                    action : "database/permits/add",
                    data_name : d[sp].name,
                    data_item : d[sp].data[ip],//JSON.stringify(),
                    type : t,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    if(data.data.status == 1){
                        PERMITS_DB.push("/"+t+"["+sp+"]/data["+ip+"]",{uploaded:true});
                    }
                    $scope.pointer = $scope.pointer + 1;
                    if($scope.total_items == $scope.pointer){
                        $scope.is_loading = false;
                        $scope.empty_data.wsup = false;
                    }else {
                        try {
                            sp = ( d[sp].data.length == (ip + 1) ) ? (sp + 1) : sp;
                            ip = ( d[sp].data.length == (ip + 1) ) ? 0 : (ip + 1);
                        } catch (error) {
                            console.log(error);
                            sp = sp + 1;
                            ip = 0;
                        }
                        u(sp,ip);
                    }
                },
                errorCallBack : ()=>{
                    u(sp,ip);
                }
            };
            $utils.api(q);
        };
        u(0,0);
    }

    $scope.export_database_to_excel = (d,t)=>{
        ipcRenderer.send('save_workbook_as_excel',d);
    }

    $scope.open_database = (t)=>{
        $scope.open_window_view("app/pages/database/permits/single/sheets.html",t);
    };

});