'use strict';

myAppModule.controller('operations_map_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {

    $scope.init_enforcer_map = ()=>{
        $scope.gpsItems = [];
        $scope.get_gps_query().onSnapshot( qs => {
            if(!qs.empty){
                let results = qs.docs.map( d => {
                    return d.data();
                } );
                $scope.gpsItems = results;
                $scope.$apply();
            }
        } );
        // if($scope.url.has('ID')){
        //     //$scope.url.get('ID')
            
        // }else {
        //     $scope.set_path('/');
        // }
    };

    $scope.get_gps_query = ()=> {
        return db.collection("staffs").doc("+639123456789").collection("gps").orderBy("time");
    };

});

document.write(`<script src='app/operations/mapping/map/controller.js'></script>`);