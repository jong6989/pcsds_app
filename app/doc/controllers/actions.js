'use strict';

myAppModule.controller('doc_ctrl_actions', function ($scope, $timeout, $utils, $mdToast,$mdDialog, func, $localStorage) {
    var download_queue = {};
    $scope.uploading_file = false;
    $scope.add_action = {};
    $scope.fileDivider = (os.platform() == 'win32')? '\\': '/';

    var actionDocId = '';

    $scope.init_doc = () => {
        if($scope.currentNavItem == 'Documents' && $scope.currentDocSelected != 'draft'){
            $scope.currentItem.actions = [];
            $scope.documentItemListener = doc.db.collection(documents).doc($localStorage.currentItem.id).onSnapshot(dx => {
                $scope.currentItem = dx.data();
                $scope.currentItem.id = dx.id;
                $localStorage.currentItem = $scope.currentItem;
                actionDocId = $scope.currentItem.id;
                $scope.$apply();
            });
        }else {
            clearInterval(actions_interval);
        };
    };

    var actions_interval = null;
    actions_interval = setInterval( ()=> {
        if($localStorage.currentItem == undefined){
            clearInterval(actions_interval);
        }else if(actionDocId !== $localStorage.currentItem.id) {
            $scope.init_doc();
        }
    }, 300 );
    
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


    $scope.uploadFiles = (files,id)=>{
        var upload_file = (idx)=>{
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data,code)=>{
                $scope.uploading_file = false;
                if(code == 200){
                    if(files.length == (idx + 1) ){
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        if($scope.add_action[id] == undefined) $scope.add_action[id] = '';
                        $scope.add_action[id] += m + "<br>\n";
                    }else {
                        upload_file(idx + 1);
                    }
                }
            });
            form.append('action', 'user/upload_file');
            form.append('file',  fs.createReadStream(f.path), {filename: f.name});
            form.append('user_id', $scope.userId);
        };
        if(files.length > 0 ) upload_file(0);
    };

    $scope.addAction = (txt) => {
        let o = {
            name : $scope.doc_user.name,
            time : Date.now(),
            date : $scope.date_now(),
            message : txt
        };
        doc.db.collection(documents).doc($localStorage.currentItem.id).update({
            'actions' : firebase.firestore.FieldValue.arrayUnion(o)
        });
    };
    
    
});