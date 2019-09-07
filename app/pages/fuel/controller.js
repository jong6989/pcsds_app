'use strict';
myAppModule.controller('fuel_log_controller', function ($scope, $timeout, $utils, $mdDialog,$localStorage, $interval,$filter) {

    $scope.update_trip_ticket_form = false;
        $scope.ticket_clear = function(){
        $scope.new_ticket = {"data":{"passengers":[],"places":[]}};
        //document.getElementById("ngForm").reset();

        //$scope.form_new_document.$setPristine();
        };

        
    $scope.ticket_add = function(d){// write to Database
        console.log(d);
        
        console.log("month");
        //$scope.is_single_account_selected = true;
        var q = { 
            
            data : { 
                action : "fuel/add",
                trip_ticket_id : d.ticket_number,
                data : d.data

            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  //$scope.ticket_clear();
                  
                    
                  }
              }
            };
        $utils.api(q);

    }

    $scope.get_ticket_data = function(){
        //$scope.selected_account = s;
        var q = { 
            data : { 
                action : "fuel/get",

            },
            callBack : function(data){
                        $scope.ticket_data =  $scope.ngTable(data.data.data);
                        console.log($scope.ticket_data);
                }   
            };
            
            $utils.api(q);
    };


    $scope.update_trip_ticket_data = function(trip_ticket_data){
        $scope.update_trip_ticket_form = true;
        $scope.trip_ticket_ID = trip_ticket_data.trip_ticket_id;
        $scope.new_ticket = trip_ticket_data;
    }

    $scope.to_time = function(d){
        return $filter('date')(d, "hh:mm:ss a");
      };

    $scope.ticket_update = function(new_data){
        console.log(new_data);
        var q = { 
            
            data : { 
                action : "fuel/update_ticket",
                trip_ticket_id : new_data.trip_ticket_id,
                data : new_data.data

            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  //$scope.ticket_clear();
                  
                    
                  }
              }
            };
        $utils.api(q);

    }


    $scope.update_selected_user = function(d){
        
      };
});