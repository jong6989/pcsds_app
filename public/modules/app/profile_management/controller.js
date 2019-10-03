'use strict';
myAppModule.requires.push('ngTable');
myAppModule.
    controller('profile_management_controller',
        function ($scope, $profileService) {
            $scope.get_profile = $profileService.get_profile;
        }).
        controller('dummy_profile_management_controller', function($scope, $http, NgTableParams){
            
            $http.get("/json/profile/nationalities.json").
            then(function(data){
                $scope.nationalities = data.data.data; 
            });

            $scope.profile = {
                data: {
                    first_name: "Arlan",
                    middle_name: "Ticke",
                    last_name: "Asutilla",
                    extension_name: '',
                    birth_day: "1984-05-05",
                    current_address: "Brgy. Sta. Monica, Puerto Princesa City",
                    current_phone: "09213183376",
                    tin_no: "123456",
                    place_of_birth: "Puerto Princesa City",
                    nationality: "Philippine, Filipino",
                    gender: "male",
                    civil_status: "married",
                    spouse_name: "Gigi Hadid",
                    father: "Nelson T. Asutilla",
                    mother: "Cynthia P. Asutilla",
                    gov_id: {
                        name: "PhilHealth",
                        number: "123456",
                        date_issued: "2008-01-01",
                        place_issued: "Puerto Princesa City",
                        valid_until: "2028-01-01"
                    },
                    status: 'active'
                }
            }

            $scope.save_profile = (profile) => {
                console.log(profile);
            }

            $scope.activate_profile = (id) => {
                $scope.profile.data.status = 'active';
            }

            $scope.deactivate_profile = (id) => {
                $scope.profile.data.status = 'deactivated';
            }

            $scope.profileTable = new NgTableParams({}, {dataset: []});
        }).
        controller('testController', function($scope, $profileService){
            $scope.get_profile = () =>
            {
                $profileService.get_profile('uMef3AncF1QgITnD51MvD0pFvTD3').then(result => {
                    console.log(profile);
                })
            }
            $scope.get_profile();
        }).
        service('$profileService', function(){
            this.get_profile = async(id) => {
                let profile = await db.collection('profile').doc(id);
                return profile;
            }
        });
