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
    $scope.me = {};
    $scope.my_chats = {personal : {},others:{}};
    $scope.downloadFolder = app.getPath('downloads') + '/brain_downloads/';
    let ti = 60 * 1000;
    let th = 60 * ti;
    let td = 24 * th;
    let tm = 30 * td;
    let ty = 12 * tm;
    const online_laps = 30000;
    var opc = {};

    fire.db.staffs.query.where("id","==",$scope.user.id).get().then(qs=>{
        qs.forEach(doc=>{
            $scope.me = doc.data();
            $scope.me.doc_id = doc.id;
        })
    });

    $scope.send_sms = (number,message)=>{
        let n = number.length;
        console.log(n);
        if(n >= 11 || n<=13){
            if(n == 11) number = "+63" + number.substr(1);
            console.log(n);
            smsClient.messages
            .create({
                body: message,
                from: '+18577633830',
                to: number
            })
            .then(message => console.log(message.sid),error=>{
                console.log(error)
            });
        }else {
            $scope.toast("invalid mobile number");
        }
    }

    $scope.download_attachment = (server,address)=>{
        let loc = app.getPath('downloads') + "/brain_downloads/" + address;
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
        
        download(server + address, loc, function(){
            console.log("downloaded " + address);
        });
    };

    $scope.isFileExist = (address)=>{
        return fs.existsSync(`${app.getPath('downloads')}/brain_downloads/${address}`);
    }

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

    $scope.move_tab = (k)=>{
        let n = 0;
        for (const key in $scope.tabs) {
            if (key == k) {
                $scope.selectedTab = n;
            }else {
                n++;
            }
        }
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

    function gotoBottom(id){
        setTimeout(()=>{
            var element = document.getElementById(id);
            element.scrollTop = element.scrollHeight - 300;
        },1500);
     }

    async function check_if_online(){
        $scope.is_online = await isOnline();
        $scope.$apply();
    }
    check_if_online();
    setInterval(check_if_online,3000);

    //staffs
    fire.db.staffs.when_all((list)=>{
        $scope.staff_list = list;
    });

    //chats
    fire.db.chats.query.where("member", "array-contains", ""+$scope.user.id)
    .onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            let x = doc.data();
            if(x.type == "personal"){
                x.member.splice(x.member.indexOf(`${$scope.user.id}`),1);
                $scope.my_chats.personal[x.member[0]] = {id:doc.id,data:x};
                if($scope.tabs.personal_chat != undefined){
                    if($scope.tabs.personal_chat.doc_id == doc.id){
                        console.log("new chat");
                        $scope.tabs.personal_chat.tread = x.tread;
                        $scope.move_tab('personal_chat');
                        gotoBottom('spc_message_box');
                    }
                }
            }else {
                $scope.my_chats.others[doc.id] = x;
            }
        });
        $scope.$apply();
    });

    $scope.open_application_tab = (x)=>{
        $scope.tabs.application = { title : 'Application',application : x};
        $scope.move_tab('application');
    }

    $scope.open_personal_chat = (staff)=>{
        function executeOpen(){
            $scope.tabs.personal_chat = { title : staff.data.first_name + ' ' + staff.data.last_name, staff : staff,
                tread : $scope.my_chats.personal[staff.id].data.tread,
                doc_id : $scope.my_chats.personal[staff.id].id
            };
            $scope.move_tab('personal_chat');
            gotoBottom('spc_message_box');
            $scope.closeChatNav();
        };
        if($scope.my_chats.personal[staff.id] != undefined){
            executeOpen();
        }else {
            //create chat room
            fire.db.chats.query.add({
                "member" : [`${$scope.user.id}`,`${staff.id}`],
                "type" : "personal",
                "tread" : []
            }).then(ref=>{
                console.log("added");
                $scope.my_chats.personal[staff.id] = {id:ref.id,data:{tread:[]}};
                executeOpen()
            });
        }
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
        fire.db.staffs.query.doc(`${$scope.user.id}`).collection('chats').doc(`${staff.id}`).update({"tread":firebase.firestore.FieldValue.arrayRemove(message)});
        let i = 0;
        $scope.tabs.personal_chat.tread.forEach(e=>{
            if(e==message){
                $scope.tabs.personal_chat.tread.splice(i,1);
            }
            i++;
        });
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
        if($scope.tabs.personal_chat.doc_id !== undefined){
            let m = {message : message,date : Date.now(),staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name};
            fire.db.chats.query.doc($scope.tabs.personal_chat.doc_id).update({"tread": firebase.firestore.FieldValue.arrayUnion(m)});
            delete($scope.pc_tread_message[`${staff_id}`]);
        }
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
        let notif = {
            "type" : "applicant",
            "user" : applicant_id,
            "transaction_id" : application_id,
            "message" : message,
            "status" : "0",
            "date" : Date.now()
        };
        fire.db.notifications.query.add(notif);
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
            "Your application is received and accepted for processing." 
            + $scope.user.data.first_name + ' ' 
            + $scope.user.data.last_name);
        delete($scope.tabs.application);

        let act = `You received application number ${application.date}.`;
        $scope.toast(act);
        fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        setTimeout(()=>{
            $scope.toast("See your pending box to process application.");
        },3000)
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
            notify_applicant(application.user.id,application.id,"Sorry, we are unable to process your application. Please re-submit." + result);
            clear_application_tabs();

            let act = `You reject application number ${application.date}.`;
            $scope.toast(act);
            fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        }, function() {
            // cancel
        });
    }

    $scope.acceptApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "7";
        if(application.data.accepted == undefined){
            u["status"] = "3";
            u["data.accepted"] = {
                "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                "date" : $scope.date_now(),
                "staff_id" : $scope.user.id
            };
        }
        
        fire.db.transactions.update(application.id,u);
        notify_applicant(application.user.id,application.id,"Your application is undergoing review.");
        clear_application_tabs();

        let act = `You processed application number ${application.date}.`;
        $scope.toast(act);
        fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
    }

    $scope.approveApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "8";
        if(application.data.approved == undefined){
            u["status"] = "4";
            u["data.approved"] = {
                "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                "date" : $scope.date_now(),
                "staff_id" : $scope.user.id
            };
        }
        
        fire.db.transactions.update(application.id,u);
        notify_applicant(application.user.id,application.id,"Your application has been reviewed.");
        clear_application_tabs();

        let act = `You reviewed application number ${application.date} and forwarded for recommendation.`;
        $scope.toast(act);
        fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
    }

    $scope.recommendApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        u["level"] = "4";
        if(application.data.recommended == undefined){
            u["status"] = "5";
            u["data.recommended"] = {
                "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                "date" : $scope.date_now(),
                "staff_id" : $scope.user.id
            };
        }
        let act = `You recommend application number ${application.date} for approval.`;
        $scope.toast(act);
        fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        fire.db.transactions.update(application.id,u);
        notify_applicant(application.user.id,application.id,"Your application has been recommended for approval.");
        clear_application_tabs();
    }

    $scope.acknowledgeApplication = (application,ev,extra)=>{
        var confirm = $mdDialog.prompt()
            .title('Confirm Permit')
            .textContent(`Confirmation Code Was sent to your email. Please confirm the approval of the application number ${application.date}`)
            .placeholder('code')
            .ariaLabel('code')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Confirm')
            .cancel('Close');

        $mdDialog.show(confirm).then(function(result) {
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
            if(application.name == "Application for Local Transport Permit RFF"){
                u["expiration"] = $scope.to_date(Date.now() + tm);
            }else {
                u["expiration"] = $scope.to_date(Date.now() + ty);
            }
                
            fire.db.transactions.update(application.id,u);
            notify_applicant(application.user.id,application.id,"Thank you very much! Your application is approved.");
            clear_application_tabs();

            let act = `You approved application number ${application.date}.`;
            $scope.toast(act);
            fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        }, function() {
            // cancel
        });
        
    }

    $scope.returnApplication = (application,ev,lvl,stats)=>{
        fire.db.transactions.update(application.id,{"level":`${lvl}`,"status":`${stats}`});
        clear_application_tabs();
    }

});