'use strict';

myAppModule.controller('database_permit_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    var XLSX = require('xlsx');
    $scope.xlxs_data = [];
    $scope.wsup_data = [];
    var uploading_type = '';
    $scope.is_loading = false;
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
        var u = (sp,ip,dta)=>{
            let q = { 
                data : { 
                    action : "database/permits/add",
                    sheet : sp,
                    item : ip,
                    data_name : d[sp].name,
                    data_item : JSON.stringify(d[sp].data[ip]),
                    type : t,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    if(data.data.status == 1){
                        $scope.pointer = $scope.pointer + 1;
                        if($scope.total_items == $scope.pointer){
                            $scope.is_loading = false;
                            $scope.toast("Data saved online.");
                            PERMITS_DB.push("/"+t,$scope.wsup_data);
                            $scope.empty_data.wsup = false;
                        }else {
                            sp = ( d[sp].data.length == (ip + 1) ) ? (sp + 1) : sp;
                            ip = ( d[sp].data.length == (ip + 1) ) ? 0 : (ip + 1);
                            u(sp,ip);
                        }
                    }else {
                        $scope.toast(data.data.error);
                    }
                },
                errorCallBack : ()=>{
                    $scope.toast("OFFLINE, try again later...");
                }
            };
            $utils.api(q);
        };
        u(0,0);
    }

});