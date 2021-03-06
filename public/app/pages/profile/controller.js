'use strict';

myAppModule.controller('profile_controller', function ($scope, $timeout, $utils, 
    $mdDialog, $interval, Upload, $localStorage, $http) {
    $scope.is_uploading = false;
    $scope.is_loading = false;
    $scope.profile_uploading_rate = 0;
    $scope.picFile = null;
    $scope.is_using_camera = false;

    $scope.gov_ids = ["Passport","Drivers License","PRC","GSIS","SSS","Postal ID","Voter's ID","School ID"];

    $http.get("/json/profile/nationalities.json").then(function(data){
        $scope.nationalities = data.data.data; 
    });
    
    $http.get("/json/profile/municipality.json").then(function(data){
        $scope.municipalities = data.data.data; 
    });

    $scope.myDate = new Date();

    $scope.minDate = new Date(
        $scope.myDate.getFullYear() - 90,
        $scope.myDate.getMonth(),
        $scope.myDate.getDate()
    );

    $scope.maxDate = new Date(
        $scope.myDate.getFullYear() - 18,
        $scope.myDate.getMonth(),
        $scope.myDate.getDate()
    );

    $scope.clear_cropping_image = ()=>{
        $scope.picFile = null;
    }

    $scope.toggle_using_camera = ()=>{
        $scope.is_using_camera = !$scope.is_using_camera;
    }

    $scope.is_croping_image = ()=>{
        return ($scope.picFile == null) ? false : true;
    };

    // $scope.upload_process = ()=>{
    //     return Upload.isUploadInProgress();
    // }

    $scope.change_profile = function(dataUrl, name){
        $scope.is_using_camera = false;
        //check auth
        let profileId = localData.get('profileId');
        if(profileId){
            $scope.is_uploading = true;
            let profileImage = storageRef.child(`profile_image/${profileId}-${name}`);
            profileImage.putString(dataUrl, 'data_url').then(function(snapshot) {
                snapshot.ref.getDownloadURL().then(function(downloadURL) {
                db.collection('profile').doc(profileId).update({"profile_picture":downloadURL});
                $scope.picFile = null;
                $scope.is_uploading =false;
                $scope.$apply();
                });
            }).catch(()=>{
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Upload Failed',
                    footer: 'Please try again'
                  });
                  $scope.is_uploading = false;
                  $scope.$apply();
            });
        }else {
            location.reload();
        }
        
    };

    $scope.upload_files = (fs)=>{
        var upload_file = (idx)=>{
            $scope.uploading_file = true;
            let profileId = localData.get('profileId');
            if(profileId){
                let dateStamp = Date.now();
                let uploadRef = storageRef.child(`uploads/${profileId}/attachments/${dateStamp}-${fs[idx].name}`);
                uploadRef.put(fs[idx]).then(function(snapshot) {
                    snapshot.ref.getDownloadURL().then(function(downloadURL) {
                        db.collection('profile').doc(profileId).update({"uploads": 
                            firebase.firestore.FieldValue.arrayUnion({
                                name : fs[idx].name,
                                url : downloadURL
                            })
                        });
                        $scope.uploading_file = false;
                        if(fs.length !== (idx + 1) ){
                            upload_file(idx + 1);
                        }
                        $scope.$apply();
                    });
                }).catch(()=>{
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Upload Failed',
                        footer: 'Please try again'
                    });
                    $scope.uploading_file = false;
                    $scope.$apply();
                });
            }else {
                location.reload();
            }

        };
        if(fs.length > 0 ) upload_file(0);
    };


    $scope.remove_array_from_profile = (key,item)=>{ 
        delete(item['$$hashKey']);
        let updatable = {};
        updatable[key] = firebase.firestore.FieldValue.arrayRemove(item);
        let profileId = localData.get('profileId');
        if(profileId){
            db.collection('profile').doc(profileId).update(updatable);
        }else {
            location.reload();
        }
    };

    $scope.add_array_to_profile = (key,item)=>{
        delete(item['$$hashKey']);
        let updatable = {};
        updatable[key] = firebase.firestore.FieldValue.arrayUnion(item);
        let profileId = localData.get('profileId');
        if(profileId){
            db.collection('profile').doc(profileId).update(updatable);
        }else {
            location.reload();
        }
    };

    $scope.update_data_to_profile = (updatable)=>{
        delete(updatable['$$hashKey']);
        let profileId = localData.get('profileId');
        if(profileId){
            db.collection('profile').doc(profileId).update(updatable);
        }else {
            location.reload();
        }
    };


    $scope.clear_edit_pass = ()=>{
        $scope.editProfilePassword = '';
    }

    $scope.open_chainsaw = (x,event)=>{
        $scope.single_chainsaw = x;
        $scope.showPrerenderedDialog(event,'single_chainsaw_item');
    }


});
