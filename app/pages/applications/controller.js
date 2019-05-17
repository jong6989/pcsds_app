'use strict';

myAppModule.controller('applications_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $http) {
    $scope.application_list = [];
    $scope.pending_list = [];
    $scope.api_address = api_address;
    $scope.selectedTab = 0;
    $scope.tabs = {};
    $scope.chatNav = {};
    $scope.version_2 = true;

    $scope.toggleChatNav = (n,title)=>{
        $scope.chatNav.title = title;
        $scope.chatNav.idx = n;
        $mdSidenav('chats_nav')
            .toggle();
    };

    $scope.isOpenChatNav = function(){
        return $mdSidenav('chats_nav').isOpen();
      };

    $scope.closeChatNav = function () {
        $mdSidenav('chats_nav').close()
            .then(function () {
                //
            });
    };

    //load json data
    $http.get("./json/permitting/templates.json").then(function(data){
        $scope.application_templates = data.data.data; 
    });
    
    $scope.load_db = (status)=>{
        let s = `${status}`;
        fire.db.transactions.query.where("status", "==", s)
        .onSnapshot(function(querySnapshot) {
            var d = [];
            querySnapshot.forEach(function(doc) {
                let z = doc.data();
                d.push(z);
                for (const key in $scope.tabs) {
                    if ($scope.tabs.hasOwnProperty(key)) {
                        const element = $scope.tabs[key];
                        if($scope.tabs[key].application.id == z.id){
                            $scope.tabs[key].application = z;
                        }
                    }
                }
            });
            $scope.application_list = d;
            $scope.$apply();
        });
    }
    
    $scope.load_pending = ()=>{
        fire.db.transactions.query.where("level", "==", `${$scope.user.user_level}`)
        .onSnapshot(function(querySnapshot) {
            delete($scope.tabs.pending);
            var d = [];
            querySnapshot.forEach(function(doc) {
                d.push(doc.data());
            });
            $scope.pending_list = d;
            $scope.$apply();
        });
    }

    $scope.add_tread = function(app_id,data){
        let t = {
            staff: $scope.user.data.first_name + " " + $scope.user.data.last_name,
            message : data,
            date : $scope.date_now()
        };
        fire.db.transactions.update(`${app_id}`,{"actions": firebase.firestore.FieldValue.arrayUnion(t) });
    };

    $scope.upload_attachments = (files,app_id)=>{
        var upload_file = (idx)=>{
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data,code)=>{
                $scope.uploading_file = false;
                if(code == 200){
                    if(files.length == (idx + 1) ){
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        $scope.add_tread(app_id,m);
                    }else {
                        upload_file(idx + 1);
                    }
                }
            });
            form.append('action', 'user/upload_file');
            form.append('file',  fs.createReadStream(f.path), {filename: f.name});
            form.append('user_id', $scope.user.id);
        };
        if(files.length > 0 ) upload_file(0);
    };

    $scope.load_html = (text,i)=>{
        $timeout(
            ()=>{
                $(".convo_"+i).html( text );
            },50
        )
    }

    $scope.receive_single = (application)=>{
        fire.db.transactions.update(application.id,{
            "level":"5",
            "status":"1",
            "data.received" : {
                "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                "date" : $scope.date_now(),
                "staff_id" : $scope.user.id
            }
        });
        fire.db.notifications.get(`web_${application.user.id}`,(d)=>{
            let notif = {
                "transaction_id" : application.id,
                "message" : "Your Application Was Received and being processed by : " + $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                "status" : "0",
                "date" : $scope.date_now()
            };
            if(d == undefined){
                fire.db.notifications.set(`web_${application.user.id}`,{"applications" : [notif]})
            }else {
                fire.db.notifications.update(`web_${application.user.id}`,{"applications" : firebase.firestore.FieldValue.arrayUnion(notif)})
            }
        })
        delete($scope.tabs.application);
    }

    $scope.rejectApplication = (application,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Rejecting Application')
            .textContent('Reason')
            .placeholder('')
            .ariaLabel('Reason')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Reject')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            fire.db.transactions.update(application.id,{
                "level":"-1",
                "status":"2",
                "data.rejected" : {
                    "message" : result,
                    "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                    "date" : $scope.date_now(),
                    "staff_id" : $scope.user.id
                }
            });
            fire.db.notifications.get(`web_${application.user.id}`,(d)=>{
                let notif = {
                    "transaction_id" : application.id,
                    "message" : "Your Application Was Rejected :  " + result,
                    "status" : "0",
                    "date" : $scope.date_now()
                };
                if(d == undefined){
                    fire.db.notifications.set(`web_${application.user.id}`,{"applications" : [notif]})
                }else {
                    fire.db.notifications.update(`web_${application.user.id}`,{"applications" : firebase.firestore.FieldValue.arrayUnion(notif)})
                }
            })
            delete($scope.tabs.application);
            delete($scope.tabs.pending);
        }, function() {
            // cancel
        });
    }

    $scope.acceptApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "7";
        u["status"] = "3";
        u["data.accepted"] = {
            "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            "date" : $scope.date_now(),
            "staff_id" : $scope.user.id
        };
        
        fire.db.transactions.update(application.id,u);
        fire.db.notifications.get(`web_${application.user.id}`,(d)=>{
            let notif = {
                "transaction_id" : application.id,
                "message" : "Your Application is on checking by the PCSD Permitting Chief ",
                "status" : "0",
                "date" : $scope.date_now()
            };
            if(d == undefined){
                fire.db.notifications.set(`web_${application.user.id}`,{"applications" : [notif]})
            }else {
                fire.db.notifications.update(`web_${application.user.id}`,{"applications" : firebase.firestore.FieldValue.arrayUnion(notif)})
            }
        })
        delete($scope.tabs.application);
        delete($scope.tabs.pending);
    }

});