
myAppModule.
    controller('profile_links_controller', [
        '$scope',
        '$profileService',
        'profileLinkService',
        // 'dummyProfileLinksService',
        '$location',
        function ($scope, $profileService, $profileLinksService, $location) {
            $scope.profileLinks = [];
            $scope.profileLink = {
                profiles: [],
                keywords: []
            };
            $scope.profileLinkViewModel = []

            $scope.viewProfileLink = (profileLink, profileLinkIndex) =>{
                $scope.profileLinkViewModel[profileLinkIndex] = profileLink;
            }

            $scope.dataIsLoading = false;
            $scope.loadProfileLinks = async () => {
                $scope.dataIsLoading = true;
                let authUser = localData.get('authUser');
                if(authUser){
                    $scope.profileLinks = await $profileLinksService.getProfileLinks(authUser);
                    $scope.dataIsLoading = false;
                    $scope.$apply();
                }else {
                    Toast.fire({
                        type: 'error',
                        title: 'Auth User Not found!'
                    });
                }
            }

            $scope.loadProfileLink = async () => {
                var profileLinkID = localData.get('profileLinkID');
                $scope.profileLink = await $profileLinksService.getProfileLink(profileLinkID);
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
                    $scope.loadProfileLinks(localData.get('authUser')); return;
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
            $scope.searchProfile = async (keyword) => {
                $scope.profiles = await $profileService.search(keyword);
                if ($scope.profiles.length == 0) {
                    showNotFoundAlert(keyword);
                } else {
                    $scope.$apply();
                }
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
                $scope.profileLink.created_by = localData.get('authUser');
                $profileLinksService.add($scope.profileLink).
                    then(result => {
                        Swal.fire(
                            'Profile Link Saved!',
                            '',
                            'success'
                        ).then(result => {
                            $scope.profileLink = {};
                            $scope.profileLink.profiles = [];
                            $scope.isDataLoading = false;
                            $scope.$apply();
                        })
                    });
                
            }

            $scope.update = () => {
                $scope.isDataLoading = true;
                $scope.profileLink.modified_by = localData.get('authUser');
                $profileLinksService.update($scope.profileLink).
                    then(result => {
                        Swal.fire(
                            'Profile link updated!',
                            '',
                            'success'
                        ).then(result => {
                            $scope.isDataLoading = false;
                            $scope.$apply();
                            $location.path('/profile_management/links');
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
                setTimeout(function(){
                    resolve(true);
                }, 3000)

            })
        }
    }).
    service('profileLinkService', function () {
        var profileLinksCollection = db.collection('profile_links');

        this.remove = (profileLinkID) => {
            return profileLinksCollection.doc(profileLinkID).update({ disabled: true });
        }

        this.getProfileLinks = async (creatorID) => {
            return new Promise((resolve, reject) => {
                profileLinksCollection.
                    where('created_by', '==', creatorID).
                    onSnapshot(snapshot => {

                        var profileLinks = snapshot.docs.filter(document => !document.data().disabled).
                            map(document => {
                                var profileLink = document.data();
                                profileLink.id = document.id;
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

        this.getProfileLink = (profileLinkID) => {
            return new Promise((resolve, reject) => {
                profileLinksCollection.doc(profileLinkID).onSnapshot(snapshot => {
                    var profileLink = snapshot.data();
                    if (profileLink.disabled) {
                        resolve(null); return;
                    }
                    profileLink.id = snapshot.id;
                    resolve(profileLink);
                });
            });
        }

        this.searchProfileLinks = (keyword) => {
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

                            profileLinks.push(profileLink);
                        })
                        resolve(profileLinks);
                    });


            })
        }
    })








// NIofduXoq4Aar5Em88E4
// PyiimOgFqSg4aweL1b71GlVBJ6n1



