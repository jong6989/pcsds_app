'use strict';

myAppModule.controller('doc_ctrl_draft', function ($scope, $timeout, $utils, $mdToast,$mdDialog, func, $localStorage) {
    $scope.doc_user_agencies = ($localStorage.doc_user_agencies == undefined)? [] : $localStorage.doc_user_agencies;
    func.$scope = $scope;
    $scope.createdDate = undefined;
    $scope.pdate = undefined;
    
    $scope.upload_file = (id,files,isRefresh)=>{
        if(files !== undefined && id !== undefined){
            func.upload(files, (url,fileName) => {
                $scope.uploadFiles();
                const fileObject = {"name": fileName, "url": api_address + '/uploads/' + url,"path": url, "opened": false};
                if($scope.currentItem.files == undefined) {
                    $scope.currentItem.files = [];
                    $scope.currentItem.files.push(fileObject);
                    $scope.updateDocument(id,{'files': $scope.currentItem.files});
                }else {
                    if(!isRefresh){
                        $scope.currentItem.files.push(fileObject);
                        $scope.updateDocument(id,{'files': $scope.currentItem.files});
                    }
                }
            }, $scope.userId);
        }
    };

    $scope.updateDocument = async (id,data) => {
        if(id !== undefined) {
            doc.db.collection(documents).doc(id).update(data).then(() => {
                func.refreshDocItem(id, (a) => {
                    $scope.currentItem = a;
                    console.log($scop.currentItem);
                });
            });
            setTimeout(()=>{func.refreshDocItem(id, (a) => {
                $scope.currentItem = a;
                console.log($scop.currentItem);

                $scope.$apply();
            });},300);
            $scope.myDrafts = await func.getMyDrafts();
        }
    };


    $scope.updateCleanDocFiles = (id,cF) => {
        cF = cF.map( d => { delete(d['$$hashKey']); return d; })
        $scope.updateDocument(id,{'files': cF});
    };

    $scope.deleteDocFile = (id,x,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Remove File ${x.name}`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(ev)
          .ok('Yes, Remove now')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.currentItem.files = $scope.currentItem.files.filter( z => (z.path !== x.path))
                                            .map( d => { delete(d['$$hashKey']); return d; });
            $scope.updateDocument(id,{'files': $scope.currentItem.files});
        },()=>{});
    };

    $scope.deleteDraft = (id,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Delete this Draft Document?`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(ev)
          .ok('Yes, Delete now')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.currentItem = null;
            $scope.updateDocument(id,{'status':'archived'});
        },()=>{});
    };

    $scope.publishDraft = (item,ev) => {
        var confirm = $mdDialog.confirm()
          .title(`Publish this Draft Document?`)
          .textContent('are you sure?')
          .ariaLabel('sure')
          .targetEvent(ev)
          .ok('Yes, Publish now')
          .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            let meta = {'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
            let u = {'status':'published', 'meta': meta, 'agency': item.agency };
            doc.db.collection(documents).doc(item.id).update(u);
            $scope.currentItem.status = 'publish';
            $scope.currentItem.meta = meta;
            $scope.setCurrentItem($scope.currentItem,'published');
        },()=>{});
    };

    $scope.openFile = (id,path,cF) => {
        $scope.updateCleanDocFiles(id,cF);
        shell.openItem(storageFolder + path);
    };

    $scope.refreshFile = (id,x,cF) => {
        $scope.updateCleanDocFiles(id,cF);
        let newPath = {};
        newPath = Object.create(x);
        newPath.path = storageFolder + x.path;
        $scope.upload_file(id,[newPath],true);
    };

});