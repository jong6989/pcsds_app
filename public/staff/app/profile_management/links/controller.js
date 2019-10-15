myAppModule.
    controller('profile_links_controller', [
        '$scope', 
        'dummyProfileLinksService', 
        function ($scope, $profileLinksService) {
            $scope.profiles = [];
            $scope.loadProfiles = async() => {
                $scope.profiles = await $profileLinksService.getProfileLinks();
            }

            $scope.loadProfile = async(id)=>{
                $scope.profile = await $profileLinksService.getProfile(id);
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

        this.getProfileLinks = () => {
            return new Promise((resolve, reject) =>{
                resolve(Object.keys(profileLinks).map(key => profileLinks[key]));
            })
        }

        this.getProfileLink = (id) => {
            return new Promise((resolve, reject)=>{
                resolve(profileLinks[id]);
            })
        }
    }).
    service('profileLinkService', function(){
        var profileLinksCollection = db.collection('profile_links');

        this.getProfileLinks = async(creatorID) => {
            return new Promise((resolve, reject) => {
                var profileLinks = [];
                var snapshots = profileLinksCollection.where('created_by', '==', creatorID).get();
                snapshots.forEach(snapshot => {
                    var profileLink = snapshot.data();
                    profileLink.id = snapshot.id;
                    profileLinks.push(profileLink);
                });

                resolve(profileLinks);
            })  
        }

        this.add= (profileLink) => {
            return profileLinksCollection.add(profileLink);
        }

        this.update = (updatedProfileLink) => {
            return profileLinksCollection.doc(updatedProfileLink.id).update(updatedProfileLink);
        }

        this.getProfileLink = (profileLinkID) => {
            return new Promise((resolve, reject) => {
                profileLinksCollection.doc(profileLinkID).onSnapshot(snapshot => {
                    var profileLink = snapshot.data();
                    profileLink.id = snapshot.id;
                    resolve(profileLink);
                });
            });
        }

        this.searchProfileLink = (keyword) => {
            var profileLinks = [];
            return new Promise((resove, reject) => {
                var snapshots = profileLinksCollection.where('keywords', 'array-contains', keyword).get();
                snapshots.forEach(documentSnapshot => {
                    var profile = documentSnapshot.data();
                    profile.id = documentSnapshot.id;
                    profileLinks.push(profile);
                })
                resolve(profileLinks);
            })
        }
    })








// NIofduXoq4Aar5Em88E4
// PyiimOgFqSg4aweL1b71GlVBJ6n1



