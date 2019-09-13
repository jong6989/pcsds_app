'use strict';

myAppModule.controller('profile_controller', function ($scope, $timeout, $utils, $mdDialog, $interval, Upload, $localStorage) {
    $scope.is_uploading = false;
    $scope.is_loading = false;
    $scope.profile_uploading_rate = 0;
    $scope.picFile = null;
    $scope.is_using_camera = false;

    $scope.clear_cropping_image = ()=>{
        $scope.picFile = null;
    }

    $scope.toggle_using_camera = ()=>{
        $scope.is_using_camera = !$scope.is_using_camera;
    }

    $scope.is_croping_image = ()=>{
        return ($scope.picFile == null) ? false : true;
    };

    $scope.upload_process = ()=>{
        return Upload.isUploadInProgress();
    }

    $scope.change_profile = function(dataUrl, name){
        $scope.is_using_camera = false;
        Upload.upload({
            url: api_address,
            data: {
                action:"applicant/account/change_picture",
                user_id : $scope.user.id,
                file: Upload.dataUrltoBlob(dataUrl, name)
            }
        }).then(function (data) {
            if(data.data.status == 1){
                if($scope.user.data.profile_picture == undefined){
                    $timeout(()=>{ window.location.assign("/");  },500);
                }
                $scope.user = $localStorage.brain_app_user = data.data.data;
                $scope.picFile = null;
            }
        }, null, function (evt) {
            $scope.profile_uploading_rate = parseInt(100.0 * evt.loaded / evt.total);
        });
    };

    $scope.upload_files = (fs)=>{
        var upload_file = (idx)=>{
            $scope.uploading_file = true;
            Upload.upload({
                url: api_address,
                data: {
                    action:"applicant/account/upload_attachments",
                    file: fs[idx],
                    user_id : $scope.user.id
                }
            }).then(function (data) {
                $scope.uploading_file = false;
                if(fs.length == (idx + 1) ){
                    $scope.user = $localStorage.brain_app_user = data.data.data.user;
                }else {
                    upload_file(idx + 1);
                }
            });
        };
        if(fs.length > 0 ) upload_file(0);
    };

    $scope.update_profile = (p,d)=>{
        var q = { 
            data : {
                action : "applicant/account/update_data",
                data : d,
                path : p,
                id : $scope.user.id
            },
            callBack : function(data){
                //
            }
        };
        $utils.api(q);
    }

    $scope.edit_profile = (n,d,p)=>{
        $scope.is_loading = true;
        var q = { 
            data : {
                action : "applicant/account/edit_profile/" + n,
                data : d,
                password : p,
                id : $scope.user.id
            },
            callBack : function(data){
                $scope.is_loading = false;
                if(data.data.status == 1){
                    $scope.user.data = data.data.data;
                    $localStorage.brain_app_user.data = data.data.data;
                    $scope.close_dialog();
                    $scope.toast("Profile Updated!");
                }else {
                    $scope.toast(data.data.error);
                }
            }
        };
        $utils.api(q);
    }

    $scope.add_chainsaw = (d)=>{
        $scope.is_loading = true;
        var q = { 
            data : {
                action : "applicant/account/transaction/chainsaw/add",
                data : d,
                id : $scope.user.id
            },
            callBack : function(data){
                $scope.is_loading = false;
                if(data.data.status == 1){
                    $scope.user.data = data.data.data;
                    $localStorage.brain_app_user.data = data.data.data;
                    $scope.close_dialog();
                    $scope.toast("Chainsaw Added to Profile!");
                }else {
                    $scope.toast(data.data.error);
                }
            }
        };
        $utils.api(q);
    }

    $scope.clear_edit_pass = ()=>{
        $scope.editProfilePassword = '';
    }

    $scope.open_chainsaw = (x,event)=>{
        $scope.single_chainsaw = x;
        $scope.showPrerenderedDialog(event,'single_chainsaw_item');
    }

    $scope.remove_chainsaw = (x)=>{
        let index = $scope.user.data.chainsaws.indexOf(x);
        $scope.user.data.chainsaws.splice(index,1);
        $scope.update_profile("chainsaws",$scope.user.data.chainsaws);
        $scope.close_dialog();
    }

});
