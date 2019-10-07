'use strict';
myAppModule.requires.push('ngTable');
myAppModule.requires.push('camera');
myAppModule.requires.push('ngFileUpload');
myAppModule.requires.push('ngImgCrop');
myAppModule.
    controller('profile_management_controller',
        ['$scope',
            '$http',
            // 'dummyProfileService',
            '$profileService',
            'NgTableParams',
            '$location',
            function (
                $scope,
                $http,
                $profileService,
                NgTableParams
            ) {

                $scope.is_uploading = false;
                $scope.is_loading = false;
                $scope.profile_uploading_rate = 0;
                $scope.picFile = null;
                $scope.is_using_camera = false;
                $scope.profile = { data: {} };

                $scope.print = () => { 
                    window.print();

                    // setTimeout(function(){
                    // }, 3000);
                }
                $scope.currentUserShouldSee = () => {
                    return $scope.profile.data.created_by == localData.get('authUser');
                }

                $scope.clear_cropping_image = () => {
                    $scope.image_file = null;
                }

                $scope.printProfile = (event) => {
                    
                }
                $scope.toggle_using_camera = () => {
                    $scope.is_using_camera = !$scope.is_using_camera;
                }

                $scope.is_croping_image = () => {
                    return $scope.image_file != null;
                };

                // $scope.$watch('updatedProperty.first_name', function(newval, oldval, scope){
                //     console.log(newval);
                //     console.log(oldval);
                //     console.log(scope);
                // })

                $http.get("/json/profile/nationalities.json").
                    then(function (data) {
                        $scope.nationalities = data.data.data;
                    });

                $scope.onProfileLoad = () => {}
                $scope.loadProfile = async (id) => {
                    var profileID;
                    $scope.is_page_loading = true;
                    if (id == null) {
                        var url_relative_path = localData.get('current_view');
                        var url = new URL(url_relative_path, location.href);
                        var parameters = url.searchParams;
                        var profileID = parameters.get("id");
                    } else {
                        profileID = id;
                    }

                    $scope.profile.data = await $profileService.getProfile(profileID);
                    $scope.is_page_loading = false;
                    $scope.$apply();
                    
                    $scope.onProfileLoad();
                }

                $scope.loadPage = (url) => {
                    localData.set('current_view', url);
                    location.reload();
                }
                $scope.clear_edit_pass = () => {
                    $scope.editProfilePassword = '';
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

                    $scope.profileTable = new NgTableParams({ sorting: { first_name: 'asc' } }, { dataset: profileList });
                    // $scope.profileTable.$invalidate();
                    $scope.$apply();
                }

                $scope.update_profile_property = (updatedProperty) => {
                    var success = $profileService.updateProfile($scope.profile.data.id, updatedProperty);
                    
                }

                $scope.upload_profile_picture = async function (dataUrl, imageFileName) {
                    $scope.is_using_camera = false;
                    $scope.is_uploading = true;

                    try{
                        var imageUrl = await $profileService.uploadProfilePicture(
                            $scope.profile.data.id, 
                            imageFileName, 
                            dataUrl);  
                        $scope.profile.data.profile_picture = imageUrl;                      
                    }catch(error){
                        Swal.fire({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Upload Failed',
                            footer: 'Please try again'
                        });
                    }finally{
                        $scope.is_uploading = false;
                        $scope.clear_cropping_image();
                        $scope.$apply();
                    }
                };

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
                    middle_name: "",
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
                    status: 'active',
                    profile_picture: 'https://firebasestorage.googleapis.com/v0/b/pcsd-app.appspot.com/o/profile_image%2FNIofduXoq4Aar5Em88E4-?alt=media&token=ec559967-413d-4f1a-891a-93efa5033212'
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
        var collection = db.collection('profile');
        this.get_profile = async (id) => {
            let profile = await db.collection('profile').doc(id);
            return profile;
        }

        this.addProfile = async (newProfile) => {
            var promise = new Promise((resolve, reject) => {
                db.collection('profile').
                    add(newProfile).
                    then(result => {
                        resolve(true);
                    },
                        error => {
                            reject(error);
                        });
            });

            return promise;
        }

        this.getProfileList = async () => {
            var promise = new Promise((resolve, reject) => {
                collection.onSnapshot(snapshot => {
                    var profileList = snapshot.docs.map(documentSnapshot => {
                        var profile = documentSnapshot.data();
                        profile.id = documentSnapshot.id;
                        return profile;
                    });
                    resolve(profileList);
                });
            });

            return promise;
        }

        this.getProfile = (id) => {
            return new Promise((resolve, reject) => {
                collection.doc(id).onSnapshot(snapshot => {
                    var profile = snapshot.data();
                    profile.id = snapshot.id;
                    resolve(profile);
                })
            });
        }
        
        this.uploadProfilePicture = async(id, fileName, dataUrl) => {
            if (id) {
                let profileImage = storageRef.child(`profile_image/${id}-${name}`);
                var snapshot = await profileImage.putString(dataUrl, 'data_url');
                var profilePictureUrl = await snapshot.ref.getDownloadURL();
                collection.doc(id).update({'profile_picture': profilePictureUrl});
            } 

            return new Promise((resolve, reject) => { resolve(profilePictureUrl)});
        }

        this.updateProfile = async(profileID,  updatedProperty) => {
            await collection.doc(profileID).update(updatedProperty);
            return new Promise((resolve, reject) => { resolve(true); })
        }
    }).
    service('dummyProfileService', function () {
        var profileList = {          
            "NIofduXoq4Aar5Em88E4":
            {
                // data: {
                id: "NIofduXoq4Aar5Em88E4",
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
                status: 'active',
                // profile_picture: 'https://firebasestorage.googleapis.com/v0/b/pcsd-app.appspot.com/o/profile_image%2FNIofduXoq4Aar5Em88E4-?alt=media&token=ec559967-413d-4f1a-891a-93efa5033212',
                created_by: "DeTxDiJfxOOhTS94umfchr489o73"
                // created_by: "DeTxDiJfxOOhTS94umfchr489o73"
                // }
            },
            "12Ut9pTSZcgXOQPc2dkRYXYQv6t1":
            {
                // data: {
                id: "12Ut9pTSZcgXOQPc2dkRYXYQv6t1",
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
                status: 'active',
                profile_picture: '',
                created_by: "DeTxDiJfxOOhTS94umfchr489o73"
                // }
            },
            "4orLzVctIWbKgG1FrzPj4WxYIva2" :
            {
                // data: {
                id: "4orLzVctIWbKgG1FrzPj4WxYIva2",
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
                status: 'active',
                profile_picture: '',
                created_by: "DeTxDiJfxOOhTS94umfchr489o73"
            }
        }




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

        this.updateProfile = async (id, updatedProperty) => {
            var keys = Object.keys(updatedProperty);
            keys.forEach(key => {
                profileList[id][key] = updatedProperty[key];
            });

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

        this.uploadProfilePicture = async (profileID, imageFileName, data) => {
            profileList[profileID].profile_picture = imageFileName;

            return new Promise((resolve, reject) => { resolve(true); });
        }
    });

