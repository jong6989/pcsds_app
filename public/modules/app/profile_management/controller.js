'use strict';
myAppModule.requires.push('ngTable');
myAppModule.
    controller('profile_management_controller',
        ['$scope', '$http', 'dummyProfileService', 'NgTableParams', '$location', function ($scope,
            $http,
            $profileService,
            NgTableParams) {

            $http.get("/json/profile/nationalities.json").
                then(function (data) {
                    $scope.nationalities = data.data.data;
                });

            $scope.loadProfile = async () => {
                var url_relative_path = localData.get('current_view');
                var url = new URL(url_relative_path, location.href);
                var parameters = url.searchParams;
                var profileID = parameters.get("id");
                $scope.profile = {};
                $scope.profile.data = await $profileService.getProfile(profileID);
            }

            $scope.loadPage = (url) => {
                localData.set('current_view', url);
                location.reload();
            }

            $scope.save_profile = async (profile) => {
                profile.created_by = localData.get('authUser');
                var success = await $profileService.addProfile(profile);
                if (success) {
                    Swal.fire(
                        'Profile Saved!',
                        'We will redirect you to ONLINE PERMITING DASHBOARD',
                        'success'
                    ).then((result) => {
                    });
                    $scope.profile.data = {};
                    $scope.bday = '';
                    $scope.dateIssued = '';
                    $scope.dateValid = '';

                }
            }

            $scope.activate_profile = (id) => {
                var success = $profileService.activateProfile(id);
                if (success)
                    $scope.profile.data.status = 'active';
            }

            $scope.deactivate_profile = (id) => {
                var success = $profileService.deactivateProfile(id);
                if (success)
                    $scope.profile.data.status = 'deactivated';
            }

            $scope.loadProfileList = async () => {
                var profileList = await $profileService.getProfileList();
                $scope.profileTable = new NgTableParams({}, { dataset: profileList });
            }

        }]).
    controller('dummy_profile_management_controller', [
        '$scope', '$http', 'NgTableParams', 'dummyProfileService', function (
            $scope,
            $http,
            NgTableParams,
            $profileService) {

            $http.get("/json/profile/nationalities.json").
                then(function (data) {
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

            $scope.save_profile = async (profile) => {
                var success = await $profileService.addProfile(profile);
                if (success) {
                    Swal.fire(
                        'Profile Saved!',
                        'We will redirect you to ONLINE PERMITING DASHBOARD',
                        'success'
                    ).then(() => {
                        // $localStorage.brain_app_user = { "user" : authUser, "data" : data };
                        // window.localStorage['current_view'] = 'app/templates/main.html';
                        // location.reload();
                    });
                }
            }

            $scope.save_profile = (profile) => {
                console.log(profile);
            }

            $scope.profileTable = new NgTableParams({}, { dataset: [] });
            $scope.loadProfileList = async () => {
                var profileList = await $profileService.getProfileList();
                $scope.profileTable = new NgTableParams({}, { dataset: profileList });
            }
        }]).
    controller('testController', function ($scope, $profileService) {
        $scope.get_profile = () => {
            $profileService.get_profile('uMef3AncF1QgITnD51MvD0pFvTD3').
                then(result => {
                    console.log(profile);
                })
        }
        $scope.get_profile();
    }).
    service('$profileService', function () {
        this.get_profile = async (id) => {
            let profile = await db.collection('profile').doc(id);
            return profile;
        }
    }).
    service('dummyProfileService', function () {
        var profileList = [
            {
                // data: {
                id: 0,
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
                // }
            },
            {
                // data: {
                id: 1,
                first_name: "John",
                middle_name: "Smith",
                last_name: "Doe",
                extension_name: 'Sr',
                birth_day: "1987-11-13",
                current_address: "Brgy. Tiniguiban, Puerto Princesa City",
                current_phone: "09213353523",
                tin_no: "654321",
                place_of_birth: "Lipa City, Batangas",
                nationality: "Philippine, Filipino",
                gender: "male",
                civil_status: "married",
                spouse_name: "Jane Doe",
                father: "Alex Doe",
                mother: "Bernadette Doe",
                gov_id: {
                    name: "GSIS",
                    number: "123456",
                    date_issued: "2008-03-31",
                    place_issued: "Puerto Princesa City",
                    valid_until: "2028-03-31"
                },
                status: 'active'
                // }
            },
            {
                // data: {
                id: 2,
                first_name: "Jong",
                middle_name: "",
                last_name: "Bautista",
                extension_name: '',
                birth_day: "1986-12-24",
                current_address: "Brgy. Tagburos, Puerto Princesa City",
                current_phone: "09213353523",
                tin_no: "654321",
                place_of_birth: "Caloocan City",
                nationality: "Philippine, Filipino",
                gender: "male",
                civil_status: "married",
                spouse_name: "Jane Doe",
                father: "Alex Bautista",
                mother: "Bernadette Bautista",
                gov_id: {
                    name: "SSS",
                    number: "93827-322",
                    date_issued: "2008-03-31",
                    place_issued: "Puerto Princesa City",
                    valid_until: "2028-03-31"
                },
                status: 'active'
                // }
            }
        ]
        this.getProfileList = async () => {

            return new Promise((resolve, reject) => {
                resolve(profileList);
            })
        }

        this.getProfile = async (id) => {
            return new Promise((resolve, reject) => {
                resolve(profileList[id]);
            });
        }

        this.search = async (keyword) => {
            var result = profileList.filter(value => value.first_name.toLocaleLowerCase() == keyword ||
                value.last_name.toLowerCase() == keyword ||
                value.current_address.includes(keyword));
            return new Promise((resolve, reject) => {
                resolve(result);
            })
        }

        this.addProfile = async (profile) => {
            profileList.push(profile);
            return new Promise((resolve, reject) => { resolve(true); });
        }

        this.updateProfile = async (id, updatedProfile) => {
            profileList[id] = updatedProfile;
            return new Promise((resolve, reject) => { resolve(true); });
        }

        this.activateProfile = async (id) => {
            profileList[id].status = 'active';
            return new Promise((resolve, reject) => { resolve(true); });
        }
        this.deactivateProfile = async (id) => {
            profileList[id].status = 'deactivated';
            return new Promise((resolve, reject) => { resolve(true); });
        }
    });
