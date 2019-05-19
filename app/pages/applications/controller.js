'use strict';

myAppModule.controller('applications_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $http) {
    $scope.application_list = [];
    $scope.pending_list = [];
    $scope.staff_list = [];
    $scope.api_address = api_address;
    $scope.selectedTab = 0;
    $scope.tabs = {};
    $scope.chatNav = {};
    $scope.add_tread_message = {};
    $scope.pc_tread_message = {};
    $scope.is_online = false;
    let ti = 60 * 1000;
    let th = 60 * ti;
    let td = 24 * th;
    let tm = 30 * td;
    const online_laps = 30000;
    var opc = {};

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

    $scope.now = ()=>{ return Date.now();}

    $scope.calculate_if_online = (last_seen)=>{
        let gap = Date.now() - last_seen;
        return (gap <= online_laps + 10)? true : false;
    };

    fire.db.staffs.get($scope.user.id,(res)=>{
        function iam_online(){
            setInterval(()=>{
                fire.db.staffs.update($scope.user.id,{"last_seen": Date.now()});
            },online_laps);
        }
        if(res == undefined){
            $scope.user.last_seen = Date.now();
            fire.db.staffs.set($scope.user.id,$scope.user);
            iam_online();
        }else {
            fire.db.staffs.update($scope.user.id,{"last_seen": Date.now()});
            iam_online();
        }
    });

    async function check_if_online(){
        $scope.is_online = await isOnline();
        $scope.$apply();
    }
    check_if_online();
    setInterval(check_if_online,3000);

    fire.db.staffs.when_all((list)=>{
        $scope.staff_list = list;
        list.forEach(e=>{
            if($scope.tabs.personal_chat !== undefined){
                if($scope.tabs.personal_chat.staff.id == e.id){
                    $scope.tabs.personal_chat.staff = e;
                }
            }
        })
    });

    $scope.open_personal_chat = (staff)=>{
        opc = null;
        opc = fire.db.staffs.query.doc(`${$scope.user.id}`).collection('chats').doc(`${staff.id}`).onSnapshot(function(doc) {
            let tread = [];
            if (!doc.exists) {
                fire.db.staffs.query.doc(`${$scope.user.id}`).collection('chats').doc(`${staff.id}`).set({tread:[]});
            }else {
                tread = doc.data();
            }
            $scope.tabs.personal_chat = { title : staff.data.first_name + ' ' + staff.data.last_name, staff : staff,tread:tread.tread};
        });
        $scope.closeChatNav();
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
                    if ($scope.tabs.hasOwnProperty(key) && key == 'application') {
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

    $scope.remove_spc = (staff,message)=>{
        // fire.db.staffs.query.doc(`${$scope.user.id}`).collection('chats').doc(`${staff.id}`).update()
    };
    
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
            date : Date.now()
        };
        fire.db.transactions.update(`${app_id}`,{"actions": firebase.firestore.FieldValue.arrayUnion(t) });
        delete($scope.add_tread_message[`${app_id}`]);
    };

    $scope.pc_tread = (staff_id,message)=>{
        let m = {message : message,date : Date.now(),staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name};
        fire.db.staffs.query.doc(`${$scope.user.id}`).collection('chats').doc(`${staff_id}`).update({"tread": firebase.firestore.FieldValue.arrayUnion(m)});
        delete($scope.pc_tread_message[`${staff_id}`])
    }

    $scope.upload_attachments = (files,app_id)=>{
        var upload_file = (idx)=>{
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data,code)=>{
                $scope.uploading_file = false;
                if(code == 200){
                    if(files.length == (idx + 1) ){
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        if($scope.add_tread_message[`${app_id}`] == undefined) $scope.add_tread_message[`${app_id}`] = "";
                        $scope.add_tread_message[`${app_id}`] += m + "<br>\n";
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

    $scope.load_html = (text,i,c)=>{
        $timeout(
            ()=>{
                $("."+c+i).html( text );
            },50
        )
    }

    function notify_applicant(applicant_id,application_id,message){
        fire.db.notifications.get(`web_${applicant_id}`,(d)=>{
            let notif = {
                "transaction_id" : application_id,
                "message" : message,
                "status" : "0",
                "date" : $scope.date_now()
            };
            if(d == undefined){
                fire.db.notifications.set(`web_${applicant_id}`,{"applications" : [notif]})
            }else {
                fire.db.notifications.update(`web_${applicant_id}`,{"applications" : firebase.firestore.FieldValue.arrayUnion(notif)})
            }
        });
    }
    function clear_application_tabs(){
        delete($scope.tabs.application);
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
        notify_applicant(application.user.id,application.id,
            "Your Application Was Received and being processed by : " 
            + $scope.user.data.first_name + ' ' 
            + $scope.user.data.last_name);
        // fire.db.notifications.get(`web_${application.user.id}`,(d)=>{
        //     let notif = {
        //         "transaction_id" : application.id,
        //         "message" : "Your Application Was Received and being processed by : " + $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "status" : "0",
        //         "date" : $scope.date_now()
        //     };
        //     if(d == undefined){
        //         fire.db.notifications.set(`web_${application.user.id}`,{"applications" : [notif]})
        //     }else {
        //         fire.db.notifications.update(`web_${application.user.id}`,{"applications" : firebase.firestore.FieldValue.arrayUnion(notif)})
        //     }
        // })
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
            notify_applicant(application.user.id,application.id,"Your Application Was Rejected :  " + result);
            clear_application_tabs();
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
        notify_applicant(application.user.id,application.id,"Your Application is on checking by the PCSD Permitting Chief ");
        clear_application_tabs();
    }

    $scope.approveApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "8";
        u["status"] = "4";
        u["data.approved"] = {
            "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            "date" : $scope.date_now(),
            "staff_id" : $scope.user.id
        };
        
        fire.db.transactions.update(application.id,u);
        notify_applicant(application.user.id,application.id,"Your Application was Approved and now for recomendation.");
        clear_application_tabs();
    }

    $scope.recommendApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "4";
        u["status"] = "5";
        u["data.recommended"] = {
            "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            "date" : $scope.date_now(),
            "staff_id" : $scope.user.id
        };
        
        fire.db.transactions.update(application.id,u);
        notify_applicant(application.user.id,application.id,"Your Application was recommended for releasing of permit, permit on process...");
        clear_application_tabs();
    }

    $scope.acknowledgeApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "-1";
        u["status"] = "6";
        u["data.acknowledged"] = {
            "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            "date" : $scope.date_now(),
            "staff_id" : $scope.user.id
        };
        
        //expiration
        if(application.name == "Application for Local Transport Permit RFF")
            u["expiration"] = $scope.to_date(Date.now() + tm);
        
        fire.db.transactions.update(application.id,u);
        notify_applicant(application.user.id,application.id,"Your Permit was aknowledge by the PCSD Director and ready to use!");
        clear_application_tabs();
    }

});