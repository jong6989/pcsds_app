'use strict';
myAppModule.
    controller('profile_management_controller',
        [
            '$scope',
            '$http',
            // 'dummyProfileService',
            '$profileService',
            'NgTableParams',
            '$location',
            function (
                $scope,
                $http,
                $profileService,
                NgTableParams,
                $location
            ) {

                $scope.is_uploading = false;
                $scope.is_loading = false;
                $scope.profile_uploading_rate = 0;
                $scope.picFile = null;
                $scope.is_using_camera = false;
                $scope.profile = { data: {} };
                $scope.gov_ids = ["Passport", "Drivers License", "PRC", "GSIS", "SSS", "Postal ID", "Voter's ID", "School ID"];

                $scope.search = async (keyword) => {
                    if (keyword.trim() == '') return;
                    var results = await $profileService.search(keyword, localData.get('BRAIN_STAFF_ID'));
                    if (results.length > 0) {
                        $scope.profileTable = new NgTableParams({ sorting: { first_name: 'asc' } }, { dataset: results });
                        $scope.$apply();
                    }
                    else
                        Swal.fire({
                            title: 'Not found',
                            text: `Sorry, we didn\' found "${keyword}"`,
                            type: 'error',
                            confirmButtonColor: '#3085d6',
                            confirmButtonText: 'OK',
                        });
                }

                $scope.refreshList = () => {
                    $scope.loadProfileList();
                }

                $scope.backToList = () => {
                    Swal.fire({
                        title: 'Go back to list?',
                        text: 'Are you sure you want to go back to profile list?',
                        type: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No'
                    }).then(result => {
                        if (result.value)
                            $scope.loadPage('/profile_management/list');
                    })
                }

                $scope.currentUserShouldSee = () => {
                    return !$scope.profile.data.read_only;
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

                $http.get("/json/profile/nationalities.json").
                    then(function (data) {
                        $scope.nationalities = data.data.data;
                    });

                $scope.onProfileLoad = () => { }
                $scope.loadProfile = async (id) => {
                    var profileID;
                    $scope.is_page_loading = true;
                    profileID = id || localData.get('profileID');
                    $scope.profile.data = await $profileService.getProfile(profileID, localData.get('BRAIN_STAFF_ID'));
                    $profileService.getProfileLinks(profileID).
                    then(profileLinks => {
                        $scope.profileLinks = profileLinks;
                        $scope.$apply();
                    })

                    $scope.is_page_loading = false;
                    $scope.$apply();
                    $scope.onProfileLoad();
                }

                $scope.loadProfileLink = (profileLinkID) => {
                    localData.set('profileLinkID', profileLinkID);
                    $location.path('/profile_management/links/view');
                }

                $scope.init = () => {
                    $scope.updatedProperty = {
                        first_name: $scope.profile.data.first_name,
                        middle_name: $scope.profile.data.middle_name,
                        last_name: $scope.profile.data.last_name
                    }
                }
                $scope.initUpdatePropertyCallbacks = {
                    'id': () => { },
                    'full_name': () => {
                        $scope.updatedProperty = {
                            first_name: $scope.profile.data.first_name,
                            middle_name: $scope.profile.data.middle_name,
                            last_name: $scope.profile.data.last_name
                        }
                    },
                    'current_address': () => {
                        $scope.updatedProperty = {
                            current_address: $scope.profile.data.current_address
                        }
                    },
                    'current_phone': () => {
                        $scope.updatedProperty = {
                            current_phone: $scope.profile.data.current_phone
                        }
                    },
                    'personal_information': () => {
                        $scope.updatedProperty = {
                            place_of_birth: $scope.profile.data.place_of_birth,
                            nationality: $scope.profile.data.nationality,
                            gender: $scope.profile.data.gender,
                            civil_status: $scope.profile.data.civil_status,
                            spouse_name: (($scope.profile.data.spouse_name) ? $scope.profile.data.spouse_name : ''),
                            father: $scope.profile.data.father,
                            mother: $scope.profile.data.mother,
                            birth_day: $scope.profile.data.birth_day
                        }
                    },
                    'government_id': () => {
                        $scope.updatedProperty = {
                            tin_no: $scope.profile.data.tin_no,
                            gov_id: {
                                name: $scope.profile.data.gov_id.name,
                                number: $scope.profile.data.gov_id.number,
                                date_issued: $scope.profile.data.gov_id.date_issued,
                                place_issued: $scope.profile.data.gov_id.place_issued,
                                valid_until: $scope.profile.data.gov_id.valid_until
                            }
                        }
                    }
                }

                $scope.save_profile = async (profile) => {
                    profile.created_by = localData.get('BRAIN_STAFF_ID');
                    var success = await $profileService.addProfile(profile);
                    if (success) {
                        Swal.fire(
                            'Profile Saved!',
                            '',
                            'success'
                        ).then((result) => {
                            $scope.profile.data = {};
                            $scope.bday = '';
                            $scope.dateIssued = '';
                            $scope.dateValid = '';
                            try {
                                $scope.$apply();
                            } catch (error) { }
                        });


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
                    var profileList = await $profileService.getProfileList(localData.get('BRAIN_STAFF_ID'));

                    $scope.profileTable = new NgTableParams({ sorting: { first_name: 'asc' } }, { dataset: profileList });
                    // $scope.profileTable.$invalidate();
                    $scope.$apply();
                }

                $scope.update_profile_property = (updatedProperty) => {
                    var success = $profileService.updateProfile($scope.profile.data.id, updatedProperty);
                    if (success) {
                        refreshProfileWith(updatedProperty);
                    }
                }

                function refreshProfileWith(updatedProperty) {
                    var keys = Object.keys(updatedProperty);
                    keys.forEach(key => {
                        $scope.profile.data[key] = updatedProperty[key];
                    })
                }

                $scope.loadPage = (url, profileID) => {
                    // localData.set('current_view', url);
                    // location.reload();
                    if (profileID)
                        localData.set('profileID', profileID);
                    $location.path(url);
                }

                $scope.loadViewPage = (profileID) => {
                    localData.set('profileID', profileID);
                    $scope.loadPage('/profile_management/view');
                }
                $scope.upload_profile_picture = async function (dataUrl, imageFileName) {
                    $scope.is_using_camera = false;
                    $scope.is_uploading = true;

                    try {
                        var imageUrl = await $profileService.uploadProfilePicture(
                            $scope.profile.data.id,
                            imageFileName,
                            dataUrl);
                        $scope.profile.data.profile_picture = imageUrl;
                    } catch (error) {
                        Swal.fire({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Upload Failed',
                            footer: 'Please try again'
                        });
                    } finally {
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
                        // $localStorage.brain_app_user = { "user" : BRAIN_STAFF_ID, "data" : data };
                        // window.localStorage['current_view'] = 'app/templates/main.html';
                        // location.reload();
                    });
                }
            }

            // $scope.save_profile = (profile) => {
            //     console.log(profile);
            // }

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
    service('$profileServiceDefault', function () {
        var collection = db.collection('profile');
        this.get_profile = async (id) => {
            let profile = await db.collection('profile').doc(id);
            return profile;
        }

        this.search = async (keyword, created_by) => {
            var result = [];
            var promise = new Promise((resolve, reject) => {
                collection.where('keywords', 'array-contains', keyword).get().
                    then(snapshot => {
                        snapshot.forEach(doc => {
                            var profile = doc.data();
                            profile.id = doc.id;
                            profile.read_only = created_by && profile.created_by != created_by;
                            result.push(profile);
                        })
                        resolve(result);
                    });

            })

            return promise;
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

        this.getProfileList = async (created_by) => {
            var promise = new Promise((resolve, reject) => {
                collection.onSnapshot(snapshot => {
                    var profileList = snapshot.docs.map(documentSnapshot => {
                        var profile = documentSnapshot.data();
                        profile.id = documentSnapshot.id;
                        profile.read_only = created_by && profile.created_by != created_by;
                        return profile;
                    });
                    resolve(profileList);
                });
            });

            return promise;
        }

        this.getProfile = (id, created_by) => {
            return new Promise((resolve, reject) => {
                collection.doc(id).onSnapshot(snapshot => {
                    var profile = snapshot.data();
                    profile.id = snapshot.id;
                    profile.read_only =created_by && profile.created_by != created_by
                    resolve(profile);
                })
            });
        }
        function convertToProfileObject(snapshotData) {
            var keys = Object.keys(snapshotData);
            keys.forEach(key => {
                profile[key] = snapshotData[key];
            })

            return profile;
        }
        this.uploadProfilePicture = async (id, fileName, dataUrl) => {
            if (id) {
                let profileImage = storageRef.child(`profile_image/${id}-${name}`);
                var snapshot = await profileImage.putString(dataUrl, 'data_url');
                var profilePictureUrl = await snapshot.ref.getDownloadURL();
                collection.doc(id).update({ 'profile_picture': profilePictureUrl });
            }

            return new Promise((resolve, reject) => { resolve(profilePictureUrl) });
        }

        this.updateProfile = async (profileID, updatedProperty) => {
            await collection.doc(profileID).update(updatedProperty);
            // .then(success => {console.log('success')}, error => {console.log(error);});
            return new Promise((resolve, reject) => { resolve(true); })
        }

        this.getProfileLinks = (profileID) => {
            var profileLinksCollection = db.collection('profile_links');
            var profileLinks = [];
            return new Promise((resolve, reject) => {
                profileLinksCollection.
                    where('profiles', 'array-contains', profileID).get()
                    .then(snapshot => {
                        snapshot.docs.forEach(documentSnapshot => {
                            var profileLink = documentSnapshot.data();
                            profileLink.id = documentSnapshot.id;
                            if (profileLink.disabled)
                                return;
                            profileLinks.push(profileLink);
                        })
                        resolve(profileLinks);
                    });


            })
        }
    }).
    service('$profileServiceForAdmin', function($profileServiceDefault){
        var collection = db.collection('profile');
        this.get_profile = $profileServiceDefault.get_profile;

        this.search = async (keyword, created_by) => {
            var result = [];
            var promise = new Promise((resolve, reject) => {
                collection.where('keywords', 'array-contains', keyword).get().
                    then(snapshot => {
                        snapshot.forEach(doc => {
                            var profile = doc.data();
                            profile.id = doc.id;
                            result.push(profile);
                        })
                        resolve(result);
                    });

            })

            return promise;
        }

        this.addProfile = $profileServiceDefault.addProfile;

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

        this.getProfile = async(id, created_by) => {
            var profile = await $profileServiceDefault.getProfile(id, created_by);
            profile.read_only = false;
            return new Promise((resolve, reject) => { resolve(profile)})
        }

        function convertToProfileObject(snapshotData) {
            var keys = Object.keys(snapshotData);
            keys.forEach(key => {
                profile[key] = snapshotData[key];
            })

            return profile;
        }

        this.uploadProfilePicture = $profileServiceDefault.uploadProfilePicture;

        this.updateProfile = $profileServiceDefault.updateProfile;

        this.getProfileLinks = $profileServiceDefault.getProfileLinks;
    }).
    factory('$profileService', function($profileServiceDefault, $profileServiceForAdmin){
        var currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        var profileService = currentUser.designation == 'admin' ? $profileServiceForAdmin : $profileServiceDefault;
        return profileService;
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
                last_name: "Asutilla",
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
            "4orLzVctIWbKgG1FrzPj4WxYIva2":
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
            var profileListInArray = [];
            var keys = Object.keys(profileList);
            keys.forEach(key => {
                profileListInArray.push(profileList[key]);

            })
            return new Promise((resolve, reject) => {
                resolve(profileListInArray);
            })
        }

        this.getProfile = async (id) => {

            return new Promise((resolve, reject) => {
                // resolve(profileList[id]);

                setTimeout(function () {
                    resolve(profileList[id]);
                }, 3000);
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
            // profileList.push(profile);
            profileList['fknfgdj3099fnkgnsdlj'] = profile;
            profile.id = 'fknfgdj3099fnkgnsdlj';
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
    document.write('<script src="app/profile_management/links/controller.js"></script>')

