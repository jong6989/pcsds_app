'use strict';

myAppModule.controller('login_controller', function ($scope, $timeout, $utils, $mdDialog, $interval, $http) {
    $scope.reg_view = "app/templates/modals/registration/reg_step1.html";
    $scope.i_agree = false;
    $scope.user_id = 0;
    $scope.is_loading = false;
    $scope.gov_ids = ["Passport","Drivers License","PRC","GSIS","SSS","Postal ID","Voter's ID","School ID"];

    $http.get(api_address + "json/profile/nationalities.json").then(function(data){
        $scope.nationalities = data.data.data; 
    });
    
    $http.get(api_address + "json/profile/municipality.json").then(function(data){
        $scope.municipalities = data.data.data; 
    });
    
    $scope.register = function(d){
        $scope.is_loading = true;
        var q = { 
            data : d,
            callBack : function(data){
                $scope.is_loading = false;
                if(data.data.status == 0){
                    $scope.toast(data.data.error + "  : " + data.data.hint);
                }else {
                    $scope.login_attempt({name: d.user_name, password : d.user_pass});
                }
            }
        };
        $utils.api(q);
    };

    $scope.isumbong = (sumbong)=>{
        $scope.is_loading = true;
        var q = { 
            data : {
                action : "database/intel/add",
                data : { report : sumbong, source : "online sumbong" }
            },
            callBack : function(data){
                $scope.is_loading = false;
                if(data.data.status == 0){
                    $scope.toast(data.data.error + "  : " + data.data.hint);
                }else {
                    $scope.sumbong = "";
                    $mdDialog.cancel();
                    $scope.toast("Salamat sa inyong sumbong, ito ay aming iimbestigahan agad.");
                }
            }
        };
        $utils.api(q);
    }

    $scope.myDate = new Date();

    $scope.minDate = new Date(
        $scope.myDate.getFullYear() - 90,
        $scope.myDate.getMonth(),
        $scope.myDate.getDate()
    );

    $scope.maxDate = new Date(
        $scope.myDate.getFullYear() - 18,
        $scope.myDate.getMonth(),
        $scope.myDate.getDate()
    );

});
