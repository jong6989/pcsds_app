myAppModule.requires.push('thatisuday.ng-image-gallery');
myAppModule.
    controller('profile_links_controller', [
        '$scope',
        '$profileService',
        'profileLinkService',
        '$location',
        'Upload',
        function ($scope, $profileService, $profileLinksService, $location, Upload) {
            $scope.profileLinks = [];
            $scope.profileLink = {
                profiles: [],
                keywords: []
            };
            $scope.profileLinkViewModel = []

            $scope.viewProfileLink = (profileLink, profileLinkIndex) => {
                $scope.profileLinkViewModel[profileLinkIndex] = profileLink;
            }

            $scope.dataIsLoading = false;
            $scope.isSearching = false;
            $scope.loadProfileLinks = async () => {
                $scope.dataIsLoading = true;
                $scope.profileLinks = await $profileLinksService.getProfileLinks(localData.get('BRAIN_STAFF_ID'));
                $scope.dataIsLoading = false;
                $scope.$apply();
            }

            $scope.loadProfileLink = async () => {
                var profileLinkID = localData.get('profileLinkID');
                $scope.profileLink = await $profileLinksService.getProfileLink(profileLinkID);
                if(!$scope.profileLink.images)
                    $scope.profileLink.images = [];
                imageID = $scope.profileLink.images.length;
                $scope.$apply();
            }

            $scope.updateProfileLink = async (profileLinkID) => {
                localData.set('profileLinkID', profileLinkID);
                $location.path('/profile_management/links/edit');
            }

            $scope.addProfileLink = () => {
                $location.path('/profile_management/links/create');
            }
            $scope.searchProfileLinks = async (keyword) => {
                if (keyword == '') {
                    $scope.loadProfileLinks(localData.get('BRAIN_STAFF_ID')); return;
                }
                $scope.dataIsLoading = true;

                var profileLinks = await $profileLinksService.searchProfileLinks(keyword);
                if (profileLinks.length == 0) {
                    showNotFoundAlert(keyword);
                } else {
                    $scope.profileLinks = profileLinks;
                }
                $scope.dataIsLoading = false;
                $scope.$apply();
            }

            $scope.loadProfile = async (id) => {
                $scope.profile = await $profileLinksService.getProfile(id);
            }

            $scope.profiles = [];

            var imageID = 0;
            $scope.profileLink.images = [];
            $scope.addToGallery = (files) => {
                // files.forEach(file => {
                //     
                // });
                Upload.
                    base64DataUrl(files).
                    then(urls => {
                        urls.forEach(url => {
                            var image = {
                                id: imageID,
                                url: url,
                                deletable: true
                            }

                            $scope.profileLink.images.push(image);
                            imageID++;
                        })
                    })
            }

            $scope.removeFromGallery = (imageToRemove, onDelete) => {
                var index = $scope.profileLink.images.findIndex(image => image.id == imageToRemove.id);
                if(index > -1){
                    $scope.profileLink.images.splice(index, 0);
                    onDelete();
                }
            }

            $scope.searchProfile = async (keyword) => {
                $scope.isSearching = true;
                $scope.profiles = await $profileService.search(keyword);

                if ($scope.profiles.length == 0) {
                    showNotFoundAlert(keyword);
                } else {
                }
                $scope.isSearching = false;
                $scope.$apply();
            }

            function showNotFoundAlert(searchText) {
                Swal.fire({
                    title: 'Not found',
                    text: `Sorry, we didn\'t found ${searchText}`,
                    type: 'error',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                })
            }

            $scope.addToProfileGroup = (profile) => {
                if (isAlreadyAdded(profile)) {
                    return;
                }

                $scope.profileLink.profiles.push(profile);
                removeFromProfiles(profile);
            }

            function isAlreadyAdded(profile) {
                return $scope.profileLink.profiles.findIndex(p => p.id == profile.id) > -1;
            }

            $scope.removeFromProfileGroup = (profile) => {
                var index = $scope.profileLink.profiles.findIndex(p => p.id == profile.id);
                $scope.profileLink.profiles.splice(index, 1);
                $scope.profiles.push(profile);
                $scope.$apply();

            }

            $scope.saveProfileLink = () => {
                $scope.isDataLoading = true;
                $scope.profileLink.created_by = localData.get('BRAIN_STAFF_ID');
                $profileLinksService.add($scope.profileLink).
                    then(result => {
                        Swal.fire(
                            'Profile Link Saved!',
                            '',
                            'success'
                        ).then(userResponse => {
                            $scope.saveProfileLink = $scope.update;
                            $scope.updateProfileLink(result.id)
                            $scope.$apply();
                        })
                    });

            }

            $scope.update = () => {
                $scope.isDataLoading = true;
                $scope.profileLink.modified_by = localData.get('BRAIN_STAFF_ID');
                $profileLinksService.update($scope.profileLink).
                    then(result => {
                        Swal.fire(
                            'Profile link updated!',
                            '',
                            'success'
                        ).then(result => {
                            $scope.isDataLoading = false;
                            $scope.$apply();
                        })
                    });
            }

            $scope.removeProfileLink = (profileLinkID) => {
                Swal.fire({
                    title: 'Remove link',
                    text: "Are you sure you want to delete this link? You won't be able to revert this!",
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, delete it!'
                }).then((result) => {
                    $scope.isDataLoading = true;

                    $profileLinksService.remove(profileLinkID).then(result => {
                        Swal.fire(
                            'Profile link removed!',
                            '',
                            'success'
                        ).then(result => {
                            $scope.isDataLoading = false;

                            $location.path('/profile_management/links');
                        })
                    })
                });


            }

            $scope.backToList = () => {
                Swal.fire({
                    title: 'Go back to list?',
                    text: 'Are you sure you want to go back?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    confirmButtonColor: '#3085d6',

                }).
                    then(result => {
                        if (result.value) {
                            $location.path('/profile_management/links');
                            $scope.$apply();
                        }
                    });
            }

            var removeFromProfiles = (profile) => {
                var index = $scope.profiles.findIndex(p => p.id == profile.id);
                $scope.profiles.splice(index, 1);
            }
        }
    ]).
    service('dummyProfileLinksService', function () {
        var hashes = [
            '0Q91Z0cZFGsM87BszlFg',
            '13uKRgKSMy0DxOATlX8e',
            '13uKRgKSMy0DxOATlX8e',
            '1XTUrP9zn56xdnJS6TA1',
            '1bZa3tC432pqgXPyX4iG'
        ];
        var profileLinks = {};

        hashes.forEach(hash => {
            profileLinks[hash] = {
                group_name: "ABC Inc",
                description: "The quick brown fox jumps over the lazy dog",
                relationship: "Business Partners",
                keywords: [""],
                profiles: [
                    {
                        '12Ut9pTSZcgXOQPc2dkRYXYQv6t1': {
                            first_name: 'Arlan',
                            middle_name: 'Ticke',
                            last_name: 'Asutilla'
                        }
                    },
                    {
                        '4orLzVctIWbKgG1FrzPj4WxYIva2': {
                            first_name: 'John',
                            middle_name: 'Smith',
                            last_name: 'Doe'
                        }
                    },
                    {
                        'BI4OjCp0BDQQl8CYhVtsVtNKmG03': {
                            first_name: 'Juan',
                            middle_name: 'Ekis',
                            last_name: 'dela Cruz'
                        }
                    },
                    {
                        'Gnoc8pohwVfB1lQXOdDYSTI9igF2': {
                            first_name: 'Annie',
                            middle_name: '',
                            last_name: 'Batongbakal'
                        }
                    }, {
                        'N8eIxSwjfSeZViGs6JySWq42AzX2':
                        {
                            first_name: 'Harry',
                            middle_name: 'Williams',
                            last_name: 'Potter'
                        }
                    }
                ]
            }
        });

        this.searchProfileLinks = async (keyword) => {
            var profileLinks = await this.getProfileLinks();
            return profileLinks.slice(0, 2);
        }

        this.getProfileLinks = async () => {
            return new Promise((resolve, reject) => {
                resolve(Object.keys(profileLinks).map(key => profileLinks[key]));
            })
        }

        this.getProfileLink = (id) => {
            return new Promise((resolve, reject) => {
                resolve(profileLinks[id]);
            })
        }

        this.add = () => {
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    resolve(true);
                }, 3000)

            })
        }
    }).
    service('profileLinkServiceDefault', function () {
        var profileLinksCollection = db.collection('profile_links');

        this.remove = (profileLinkID) => {
            return profileLinksCollection.doc(profileLinkID).update({ disabled: true });
        }

        this.getProfileLinks = async (current_user_id) => {
            return new Promise((resolve, reject) => {
                profileLinksCollection.
                    // where('created_by', '==', creatorID).
                    onSnapshot(snapshot => {

                        var profileLinks = snapshot.docs.filter(document => !document.data().disabled).
                            map(document => {
                                var profileLink = document.data();
                                profileLink.id = document.id;
                                profileLink.read_only = profileLink.created_by != current_user_id;
                                // if(profileLink.disabled) return ;
                                return profileLink;
                            });

                        resolve(profileLinks);
                    });
            })
        }

        this.add = (profileLink) => {
            return profileLinksCollection.add(profileLink);
        }

        this.update = (updatedProfileLink) => {
            return profileLinksCollection.doc(updatedProfileLink.id).update(updatedProfileLink);
        }

        this.getProfileLink = (profileLinkID, current_user_id) => {
            return new Promise((resolve, reject) => {
                profileLinksCollection.doc(profileLinkID).onSnapshot(snapshot => {
                    var profileLink = snapshot.data();
                    if (profileLink.disabled) {
                        resolve(null); return;
                    }
                    profileLink.id = snapshot.id;
                    profileLink.read_only = profileLink.created_by != current_user_id;
                    resolve(profileLink);
                });
            });
        }

        this.searchProfileLinks = (keyword, current_user_id) => {
            var profileLinks = [];
            return new Promise((resolve, reject) => {
                profileLinksCollection.
                    where('keywords', 'array-contains', keyword).get()
                    .then(snapshot => {
                        snapshot.docs.forEach(documentSnapshot => {
                            var profileLink = documentSnapshot.data();
                            profileLink.id = documentSnapshot.id;
                            if (profileLink.disabled)
                                return;

                            profileLink.read_only = profileLink.created_by != current_user_id;
                            profileLinks.push(profileLink);
                        })
                        resolve(profileLinks);
                    });


            })
        }
    }).
    service('profileLinkServiceForAdmin', function (profileLinkServiceDefault) {
        var profileLinksCollection = db.collection('profile_links');

        this.remove = profileLinkServiceDefault.remove;

        this.getProfileLinks = async (current_user_id) => {
            var profileLinks = await profileLinkServiceDefault.getProfileLinks(current_user_id);
            profileLinks.forEach(profileLink => {
                profileLink.read_only = false;
            });

            return new Promise((resolve, reject) => { resolve(profileLinks) })
        }

        this.add = profileLinkServiceDefault.add;

        this.update = profileLinkServiceDefault.update;

        this.getProfileLink = async (profileLinkID, current_user_id) => {
            var profileLink = await profileLinkServiceDefault.getProfileLink(profileLinkID, current_user_id);
            profileLink.read_only = false;

            return new Promise((resolve, reject) => { resolve(profileLink) });
        }

        this.searchProfileLinks = async (keyword, current_user_id) => {
            var profileLinks = await profileLinkServiceDefault.searchProfileLinks(keyword, current_user_id);
            profileLinks.forEach(profileLink => {
                profileLink.read_only = false;
            })

            return new Promise((resolve, reject) => { resolve(profileLinks) });
        }
    }).
    factory('profileLinkService', function (profileLinkServiceDefault, profileLinkServiceForAdmin) {
        var currentUser = JSON.parse(localData.get('STAFF_ACCOUNT'));
        var profileService = currentUser.designation == 'admin' ? profileLinkServiceForAdmin : profileLinkServiceDefault;
        return profileService;
    })
