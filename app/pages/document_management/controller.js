'use strict';

myAppModule.controller('document_management_controller', function ($scope, $timeout, $utils, $mdDialog, $interval) {
    var INCOMING_DB = new JsonDB("./DB/INCOMING_DOCUMENTS", true, false);
    const documents_string = "/documents";
    const categ_string = "/categories";
    const assignee_string = "/assignee";
    const online_server_folder = "https://pcsd.gov.ph/igov/wp-admin/";

    try {
        INCOMING_DB.getData(documents_string + "[0]");
    } catch(error) {
        INCOMING_DB.push(documents_string,[]);
    };

    $scope.user = $scope.user || {};
    $scope.image_download_queue = [];
    $scope.attachment_download_queue = [];
    $scope.categ = [];
    $scope.user.wp_id = 32;
    $scope.update_queue = 0;

    $scope.PrintImage = (source)=>{
        let x = {
            img_url : source,
            view: "app/pages/document_management/single/image.html"
        };
        window.open('index.html?'+ $.param(x), 'modal');
    };

    $scope.categories = (v)=>{
        v = (v == undefined) ? 0 : v;
        let c = [];
        INCOMING_DB.getData(categ_string).forEach(element => {
            if(element.documents > v){
                c.push({id:element.id,title:element.value});
            }
        });
        return c;
    }

    $scope.document = (v)=>{
        return INCOMING_DB.getData(documents_string).filter(d => d.id == v )[0];
    }

    $scope.update_single_doc = (x)=>{
        if($scope.update_queue == 0){
            $scope.update_queue = 1;
            let q = { 
                data : { 
                    action : "document_management/document/get",
                    doc_id : x.id
                },
                callBack : function(data){
                    $scope.update_queue = 0;
                    if(data.data.status == 1){
                        var index = 0;
                        INCOMING_DB.getData(documents_string).forEach(element => {
                            if(element.id == x.id){
                                INCOMING_DB.push(documents_string + "["+index+"]",data.data.data);
                                x = data.data.data;
                                return;
                            }else {
                                index++;
                            }
                        });
                    }
                }
            };
            $utils.api(q);
        }
    }

    $scope.wp_user = (v)=>{
        let c = {};
        INCOMING_DB.getData(assignee_string).forEach(element => {
            if(element.wp_id == v)
                c = element;
        });
        return c;
    }

    $scope.assignee = (v)=>{
        let c = {};
        INCOMING_DB.getData(assignee_string).forEach(element => {
            if(element.id == v){
                c = element;
                return c;
            }
        });
        return c;
    }

    $scope.has_user = (meta)=>{
        let s = meta.value.split(",");
        return (s.length > 1) ? true : false;
    }

    $scope.get_assignee_from_action = (meta)=>{
        let s = meta.value.split(",");
        return (s.length > 1) ? $scope.assignee(s[1]) : null;
    }

    $scope.get_receipient_from_action = (meta)=>{
        let s = meta.value.split(",");
        return (s.length > 2) ? $scope.assignee(s[2]) : null;
    }

    $scope.open_document = (d)=>{
        let x = {doc_id : d.id,view: "app/pages/document_management/single/document.html"};
        window.open('index.html?'+ $.param(x), 'modal');
        // ipcRenderer.send('open_child_window','index.html?'+ $.param(x));
    };


    $scope.load_categories = ()=>{
        let q = { 
            data : { 
                action : "document_management/categories/get"
            },
            callBack : function(data){
                if(data.data.status == 1){
                    INCOMING_DB.push(categ_string,data.data.data);
                    $scope.categ = $scope.categories(0);
                }
            }
        };
        $utils.api(q);
    };

    $scope.load_assignee = ()=>{
        let q = { 
            data : { 
                action : "document_management/assignee/get"
            },
            callBack : function(data){
                if(data.data.status == 1){
                    INCOMING_DB.push(assignee_string,data.data.data);
                }
            }
        };
        $utils.api(q);
    };

    $scope.load_documents = ()=>{
        $scope.load_categories();
        $scope.load_assignee();
        let q = { 
            data : { 
                action : "document_management/document/count"
            },
            callBack : function(data){
                if(data.data.status == 1){
                    $scope.max_docs = data.data.data;
                    $timeout($scope.get_documents,50);
                }
            }
        };
        $utils.api(q);
    };

    $scope.invalidate_table = ()=>{
        let xx = INCOMING_DB.getData(documents_string);
        let d = [];
        for (let i = (xx.length - 1) ; i != 0; i--) {
            d.push(xx[i]);
        }
        $scope.tbl_documents =  $scope.ngTable(d);
        $scope.categ = $scope.categories();
    };

    $scope.get_documents = ()=>{
        var d = INCOMING_DB.getData(documents_string);
        var l = (d.length > 0)? d[d.length - 1].id : 0;
        var current_length = d.length;
        let q = { 
            data : { 
                action : "document_management/document/load",
                offset : current_length,
                last_id : l
            },
            callBack : function(data){
                if(data.data.status == 1){
                    INCOMING_DB.push(documents_string,data.data.data,false);
                    $scope.loading_value = ( (current_length + data.data.data.length) / $scope.max_docs ) * 100;
                    $timeout($scope.get_documents,50);
                }else {
                    $timeout($scope.invalidate_table,50);
                    $scope.is_loading = false;
                }
            },
            errorCallBack : ()=>{
                $timeout($scope.invalidate_table,50);
                $scope.is_loading = false;
            }
        };
        $utils.api(q);
    };

    $scope.is_downloading_image = (id)=>{
        return ($scope.image_download_queue[id] == true) ? true : false;
    }

    $scope.is_downloading_attachment = (id)=>{
        return ($scope.attachment_download_queue[id] == true) ? true : false;
    }

    $scope.download_single_image = function(img){
        let loc = './downloads/' + img.address;
        let loc_array = loc.split("/");
        
        for (let i = 0; i < (loc_array.length - 1); i++) {
            let folder = "";
            for (let v = 0; v < (i + 1); v++) {
                folder += loc_array[v] + "/";
            }
            let dir = "./" + folder;
            if(!fs.existsSync(dir))
                fs.mkdirSync(dir);
        }
        
        $scope.image_download_queue[img.id] = true;
        download(online_server_folder + img.address, loc, function(){
            delete $scope.image_download_queue[img.id];
            $scope.$apply();
        });
    };

    $scope.download_single_attachment = (f)=>{
        let loc = app.getPath('downloads') + f.address;
        let loc_array = loc.split("/");
        
        for (let i = 0; i < (loc_array.length - 1); i++) {
            let folder = "";
            for (let v = 0; v < (i + 1); v++) {
                folder += loc_array[v] + "/";
            }
            let dir = folder;
            if(!fs.existsSync(dir))
                fs.mkdirSync(dir);
        }
        
        $scope.attachment_download_queue[f.id] = true;
        download(online_server_folder + f.address, loc, function(){
            delete $scope.attachment_download_queue[f.id];
            $scope.$apply();
        });
    };

    $scope.reload_all_data = ()=>{
        INCOMING_DB.push(documents_string,[]);
        $scope.is_loading = true;
        $scope.loading_value = 0
        $scope.load_documents();
    }

});
