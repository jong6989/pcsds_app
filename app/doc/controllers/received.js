'use strict';

myAppModule.controller('doc_ctrl_received', function ($scope, $timeout, $utils, $mdToast,$mdDialog, func, $localStorage) {
    var download_queue = {};
    $scope.fileDivider = (os.platform() == 'win32')? '\\': '/';
    
    $scope.dl_attachment = (address,dx)=>{
        if(dx != undefined){
            let loc_array = address.split("/");
            let filename = loc_array[(loc_array.length - 1)];
            let dir = storageFolder + dx.id;
            dir += $scope.fileDivider;
            let loc = dir + filename;
            if(!fs.existsSync(storageFolder)){
                fs.mkdirSync(storageFolder);
            }
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            if(!fs.existsSync(loc)){
                if(download_queue[loc] == undefined){
                    download_queue[loc] = true;
                    download(address, loc, function(){
                        console.log("downloaded " + address);
                        delete(download_queue[loc]);
                    });
                }
            }
        }
    };

    $scope.openFolder = (id)=>{
        shell.openItem(storageFolder + id);
    }

    $scope.isFolderExist = (id)=>{
        return fs.existsSync(storageFolder + id);
    }
    
});