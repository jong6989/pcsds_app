'use strict';

myAppModule.controller('fireDbCrtl', function ($scope, $timeout, $utils, $mdToast,$localStorage, $mdDialog) {
    var XLSX = require('xlsx');
    var user = $scope.user;
    $scope.db = {};
    var selectedDb = "";

    $scope.setDb = (s)=>{
        selectedDb = s;
    }
    
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
            };
            
            reader.readAsArrayBuffer(f);
        }else {
            $scope.toast("file error");
        }
    }

    $scope.export_database_to_excel = (d,t)=>{
        ipcRenderer.send('save_workbook_as_excel',d);
    }

    $scope.open_database = (t)=>{
        $scope.open_window_view("app/pages/database/permits/single/sheets.html",t);
    };

    function newCtrl($scope, $mdDialog) {
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.createDB = (name)=>{
            fire.db.datasets.query.add({
                "staff_id" : user.id,
                "name" : name,
                "date" : Date.now()
            });
            $mdDialog.cancel();
        }
        $scope.createSheet = (name)=>{
            let g = {
                "staff_id" : user.id,
                "name" : name,
                "date" : Date.now()
            };
            fire.db.datasets.query.doc(selectedDb).collection("datasets").add(g);
            $mdDialog.cancel();
        }
    }

    var listener = {};
    listener["main"] = fire.db.datasets.query.where("staff_id","==",user.id).onSnapshot(qs=>{
        qs.forEach(doc=>{
            $scope.db[doc.id] = {data:doc.data()};
            listener[doc.id] = fire.db.datasets.query.doc(doc.id).collection("datasets").onSnapshot(qs=>{
                let x = {};
                let c = true;
                qs.forEach(doc=>{
                    c =false;
                    x[doc.id] = doc.data();
                });
                $scope.db[doc.id].sheets = (c)? null : x;
            });
        })
    });

    $scope.open_modal = (ev,template)=>{
        $mdDialog.show({
            controller: newCtrl,
            templateUrl: template,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: true
          });
    }

});