'use strict';

myAppModule.
    controller('profile_management_controller',
        function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
            $scope.is_loading = false;
            $scope.alert = () => {
                Swal.fire(
                    'Good job!',
                    'You clicked the button!',
                    'success'
                )
            }
        }).
        controller('dumm_profile_management_controller', function($scope, $http){
            $http.get("/json/profile/nationalities.json").
            then(function(data){
                $scope.nationalities = data.data.data; 
            });

            $scope.account = {
                data: {
                    first_name: "Arlan",
                    middle_name: "Ticke",
                    last_name: "Asutilla",
                    extension_name: '',
                    bday: "1984-05-05",
                    current_address: "Brgy. Sta. Monica, Puerto Princesa City",
                    current_phone: "09213183376",
                    tin_no: "123456",
                    place_of_birth: "Puerto Princesa City",
                    nationality: "Philippines - Philippine, Filipino",
                    gender: "Male",
                    civil_status: "Married",
                    spouse_name: "Gigi Hadid",
                    father: "Nelson T. Asutilla",
                    mother: "Cynthia P. Asutilla",
                    gov_id: {
                        name: "PhilHealth",
                        number: "123456",
                        date_issued: "2008-01-01",
                        place_issued: "Puerto Princesa City",
                        date_value: ""
                    }
                }
            }
        });
