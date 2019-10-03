'use strict';

myAppModule.controller('complete_profile_controller', function ($scope, $timeout, $utils, $mdDialog, $interval, $http, $localStorage) {
    $scope.i_agree = false;
    $scope.user_id = 0;
    $scope.is_loading = false;
    $scope.gov_ids = ["Passport","Drivers License","PRC","GSIS","SSS","Postal ID","Voter's ID","School ID"];

    $http.get("/json/profile/nationalities.json").then(function(data){
        $scope.nationalities = data.data.data; 
    });
    
    $http.get("/json/profile/municipality.json").then(function(data){
        $scope.municipalities = data.data.data; 
    });

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

    $scope.save_profile = async (data)=>{
        $scope.is_loading = true;
        let authUser = window.localStorage['authUser'];
        if(authUser != undefined){
            data.profile_source = 'online permitting';
            data.user_level = 0;
            await db.collection('profile').doc(authUser).set(data);
            $scope.is_loading = false;
            Swal.fire(
                'Profile Saved!',
                'We will redirect you to ONLINE PERMITING DASHBOARD',
                'success'
              ).then(()=>{
                $localStorage.brain_app_user = { "user" : authUser, "data" : data };
                window.localStorage['current_view'] = 'app/templates/main.html';
                location.reload();
              });
        }else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Authentication failed, please try again.',
                footer: ''
              }).then(()=>{
                location.reload();
              });
            
        }
    };
});
