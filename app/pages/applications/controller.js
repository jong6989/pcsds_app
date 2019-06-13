'use strict';

myAppModule.controller('applications_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $http) {
    $scope.application_list = [];
    $scope.pending_list = [];
    $scope.staff_list = [];
    $scope.log_list = [];
    $scope.client_chat_list = [];
    $scope.client_chat_count = 0;
    $scope.api_address = api_address;
    $scope.selectedTab = 0;
    $scope.tabs = {};
    $scope.chatNav = {};
    $scope.add_tread_message = {};
    $scope.pc_tread_message = {};
    $scope.cc_tread_message = {};
    $scope.group_tread_message = {};
    $scope.is_online = false;
    $scope.is_loading = false;
    $scope.me = {doc_id:$scope.user.id};
    $scope.my_chats = {personal : {},others:{}};
    $scope.downloadFolder = (os.platform() == 'win32')? app.getPath('downloads') + '\\brain_downloads\\' : app.getPath('downloads') + '/brain_downloads/';
    let ti = 60 * 1000;
    let th = 60 * ti;
    let td = 24 * th;
    let tm = 30 * td;
    let ty = 12 * tm;
    const online_laps = 30000;
    var opc = {};
    var initials = {};
    var applicationListener = null;
    var download_queue = {};
    var notifChatRecord = {};

    $scope.getTransactionStatus = (n)=>{
        if(n==0)return "New";
        if(n==1)return "Received";
        if(n==2)return "Declined";
        if(n==3)return "On-Process";
        if(n==4)return "On-Review";
        if(n==5)return "For Recommendation";
        if(n==6)return "Approved";
        if(n==7)return "Used";
    };

    function trigerLoading(){
        $scope.is_loading = true;
        $timeout(()=>{$scope.is_loading = false;},4000);
    }

    // fire.db.staffs.query.where("id","==",$scope.user.id).get().then(qs=>{
    //     qs.forEach(doc=>{
    //         $scope.me = doc.data();
    //         $scope.me.doc_id = doc.id;
    //     })
    // });

    fire.db.staffs.when($scope.user.id,(res)=>{
        // if(res.badges.personal_chat > 0) {
        //     $scope.toast('New chat conversation..')
        // }
        // if(res.badges.group_chat > 0) {
        //     $scope.toast('New group chat conversation..')
        // }
        $scope.me = res;
        $scope.me.doc_id = res.id;
    });

    $scope.update_user = (data)=>{
        fire.db.staffs.query.doc($scope.me.doc_id).update(data);
    };
    
    fire.db.staffs.query.doc($scope.user.id).collection("logs").onSnapshot(qs=>{
        let d = [];
        qs.forEach(x=>{
            let dx = x.data();
            dx.id = x.id;
            d.push(dx);
        });
        $scope.log_list = d;
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

    $scope.download_attachment = (server,address,application)=>{
        if(application != undefined && application.date != undefined){
            let loc_array = address.split("/");
            let filename = loc_array[(loc_array.length - 1)];
            let dir = $scope.downloadFolder + application.date;
            dir += (os.platform() == 'win32')? '\\': '/';
            let loc = dir + filename;
            if(!fs.existsSync($scope.downloadFolder)){
                fs.mkdirSync($scope.downloadFolder);
            }
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            if(!fs.existsSync(loc)){
                if(download_queue[loc] == undefined){
                    download_queue[loc] = true;
                    download(server + address, loc, function(){
                        console.log("downloaded " + address);
                        delete(download_queue[loc]);
                    });
                }
            }
        }
    };

    $scope.openFolder = (appId)=>{
        shell.openItem($scope.downloadFolder + appId);
    }

    $scope.isFolderExist = (appId)=>{
        return fs.existsSync($scope.downloadFolder + appId);
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

    $scope.removeTab = (tab)=>{
        delete($scope.tabs[tab]);
    }

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
        var forGroupChat = {};
        querySnapshot.forEach(function(doc) {
            let x = doc.data();
            if(x.type == "personal"){
                x.member.splice(x.member.indexOf(`${$scope.user.id}`),1);
                $scope.my_chats.personal[x.member[0]] = {id:doc.id,data:x};
                
                if(x.tread.length > 0){
                    let n = x.tread[x.tread.length - 1];
                    if (initials[`chat_${doc.id}`]){
                        // if(!notifChatRecord[n.date])$scope.notify_me(n.staff,n.message);
                    }
                    notifChatRecord[n.date] = true;
                }
                initials[`chat_${doc.id}`] = true;
                if($scope.tabs.personal_chat != undefined){
                    if($scope.tabs.personal_chat.doc_id == doc.id){
                        $scope.tabs.personal_chat.tread = x.tread;
                        $scope.move_tab('personal_chat');
                        gotoBottom('spc_message_box');
                    }
                }
            }else if(x.type == 'group') {
                forGroupChat[doc.id] = x;
            }
        });
        $scope.group_chat_list = forGroupChat;
        $scope.$apply();
    });

    //client chats 
    fire.db.chats.query.where('type','==','public').limit(200).onSnapshot(qs => {
        let clientChats = [];
        let pendingChats = 0;
        qs.forEach(doc => {
            const d = doc.data();
            d.id = doc.id;
            clientChats.push(d);
            pendingChats += d.count;
            if($scope.tabs.client_chat !== undefined){
                if($scope.tabs.client_chat.id === doc.id)
                    $scope.open_client_chat(d);
            }
        });
        $scope.client_chat_list = clientChats;
        $scope.client_chat_count = pendingChats;
    });

    $scope.create_group_chat = (data)=>{
        fire.db.chats.query.add(data);
        $scope.toast(`New Group Chat ${data.name} where created.`)
        $scope.close_dialog();
    };

    $scope.open_application_tab = (x)=>{
        $scope.tabs.application = { title : 'Transaction No.',application : x};
        applicationListener = null;
        applicationListener = fire.db.transactions.when(x.id,(d)=>{
            if($scope.tabs.application != undefined){
                $scope.tabs.application.application = d;
            }
        });
        $scope.move_tab('application');
    }

    $scope.open_receipt_tab = (msg,date)=>{
        let stamp = (date == undefined)? Date.now(): date;
        $scope.tabs.receipt = { title : 'Action',message : msg, date : stamp};
        $scope.move_tab('receipt');
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

    $scope.open_client_chat = (user)=>{
        function openclienttab (){
            $scope.tabs.client_chat = { title : user.name, id : user.id,
                count : user.count
            };
            $scope.move_tab('client_chat');
            gotoBottom('cc_message_box');
            $scope.closeChatNav();
        }
        fire.db.chats.query.doc(user.id).collection('treads').limit(500).orderBy('date').onSnapshot(qs=>{
            let chats = []
            qs.forEach(doc=>{
                let d = doc.data();
                d.id = doc.id;
                chats.push(d);
            });
            openclienttab();
            $scope.tabs.client_chat.tread = chats;
        });
        openclienttab();
    };

    $scope.open_group_chat = (group,docId)=>{
        function opengrouptab (){
            $scope.tabs.group_chat = { title : group.name, members : group.member,
                doc_id : docId
            };
            $scope.move_tab('group_chat');
            gotoBottom('group_message_box');
            $scope.closeChatNav();
        }
        fire.db.chats.query.doc(docId).collection('treads').limit(500).orderBy('date').onSnapshot(qs=>{
            let chats = []
            qs.forEach(doc=>{
                let d = doc.data();
                d.id = doc.id;
                chats.push(d);
            });
            opengrouptab();
            // notifChatRecord['group_'+n.date] =true;
            // initials[`groupchat_${docId}`] = true;
            $scope.tabs.group_chat.tread = chats;
        });
        opengrouptab();
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
                console.log(doc.id);
                d.push(z);
                if (initials[`transaction_${doc.id}`]){
                    let t = `${$scope.getTransactionStatus(z.status)}, Transaction`;
                    let m = `Transaction Number : ${z.date}`;
                    // $scope.notify_me(t,m);
                }
                initials[`transaction_${doc.id}`] = true;
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

    $scope.remove_spc = (docId,message)=>{
        fire.db.chats.query.doc(docId).update({"tread":firebase.firestore.FieldValue.arrayRemove(message)});
        let i = 0;
        $scope.tabs.personal_chat.tread.forEach(e=>{
            if(e==message){
                $scope.tabs.personal_chat.tread.splice(i,1);
            }
            i++;
        });
    };

    $scope.remove_chat_from_group = (groupId,docId,idx)=>{
        let u = $scope.user.data.first_name + " " + $scope.user.data.last_name;
        fire.db.chats.query.doc(groupId).collection('treads').doc(docId).update({"deleted": true,"removed_by": u});
        $scope.tabs.group_chat.tread.splice(idx,1);
    };

    $scope.remove_chat_from_client = (clientId,docId,idx)=>{
        let u = $scope.user.data.first_name + " " + $scope.user.data.last_name;
        fire.db.chats.query.doc(clientId).collection('treads').doc(docId).update({"deleted": true,"removed_by": u});
        $scope.tabs.client_chat.tread.splice(idx,1);
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

    $scope.group_tread = (message)=>{
        if($scope.tabs.group_chat.doc_id !== undefined){
            let m = {message : message,date : Date.now(),staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name};
            fire.db.chats.query.doc($scope.tabs.group_chat.doc_id).collection('treads').add(m);
        }
    }

    $scope.client_tread = (message)=>{
        if($scope.tabs.client_chat.id !== undefined){
            let m = {message : message,date : Date.now(),user: $scope.user.data.first_name + ' ' + $scope.user.data.last_name};
            fire.db.chats.query.doc($scope.tabs.client_chat.id).collection('treads').add(m).then(()=>{
                fire.db.chats.query.doc($scope.tabs.client_chat.id).update({"count":0,"received": 1});
            });
        }
    }

    $scope.upload_attachments = (files,app_id,tab)=>{
        var upload_file = (idx)=>{
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data,code)=>{
                $scope.uploading_file = false;
                if(code == 200){
                    if(files.length == (idx + 1) ){
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        if(tab == 'chat'){
                            if($scope.pc_tread_message[`${app_id}`] == undefined) $scope.pc_tread_message[`${app_id}`] = "";
                            $scope.pc_tread_message[`${app_id}`] += m + "<br>\n";
                        }else if(tab == 'group'){
                            if($scope.group_tread_message[`${app_id}`] == undefined) $scope.group_tread_message[`${app_id}`] = "";
                            $scope.group_tread_message[`${app_id}`] += m + "<br>\n";
                        }else if(tab == 'client'){
                            if($scope.cc_tread_message[`${app_id}`] == undefined) $scope.cc_tread_message[`${app_id}`] = "";
                            $scope.cc_tread_message[`${app_id}`] += m + "<br>\n";
                        }else {
                            if($scope.add_tread_message[`${app_id}`] == undefined) $scope.add_tread_message[`${app_id}`] = "";
                            $scope.add_tread_message[`${app_id}`] += m + "<br>\n";
                        }
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

    // function notify_applicant(applicant_id,application_id,message){
    //     let notif = {
    //         "type" : "applicant",
    //         "user" : applicant_id,
    //         "transaction_id" : application_id,
    //         "message" : message,
    //         "status" : "0",
    //         "date" : Date.now()
    //     };
    //     fire.db.notifications.query.add(notif);
    // }

    // function clear_application_tabs(){
    //     delete($scope.tabs.application);
    // }

    $scope.receive_single = (application)=>{
        trigerLoading();
        fire.call('receive_transaction')({
            doc_id:application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res=>{
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete($scope.tabs.application);

        // fire.db.transactions.update(application.id,{
        //     "level":"5",
        //     "status":"1",
        //     "data.received" : {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     }
        // });
        // notify_applicant(application.user.id,application.id,
        //     "Your application is received and accepted for processing. Staff : " 
        //     + $scope.user.data.first_name + ' ' 
        //     + $scope.user.data.last_name);
        // delete($scope.tabs.application);

        // let act = `You received application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box to process application. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        // setTimeout(()=>{
        //     $scope.toast("See your pending box to process application.");
        // },3000)
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
            trigerLoading();
            fire.call('reject_transaction')({
                doc_id:application.id,
                doc_date: application.date,
                staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                reject_reason: result,
                staff_id: $scope.me.doc_id,
                applicant_id: application.user.id,
                applicant_name: application.data.application.applicant
            }).then(res=>{
                $scope.is_loading = false;
                $scope.toast(res.data);
                $scope.open_receipt_tab(res.data);
            });
            delete($scope.tabs.application);

            // fire.db.transactions.update(application.id,{
            //     "level":"-1",
            //     "status":"2",
            //     "data.rejected" : {
            //         "message" : result,
            //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            //         "date" : $scope.date_now(),
            //         "staff_id" : $scope.user.id
            //     }
            // });
            // notify_applicant(application.user.id,application.id,"Sorry, we are unable to process your application. Please re-submit. Reason: " + result);
            // clear_application_tabs();

            // let act = `You reject application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}.`;
            // $scope.toast(act);
            // $scope.open_receipt_tab(act);
            // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        }, function() {
            // cancel
        });
    }

    $scope.acceptApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        // u["level"] = "7";
        // if(application.data.accepted == undefined){
        //     u["status"] = "3";
        //     u["data.accepted"] = {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     };
        // }
        trigerLoading();
        fire.call('process_transaction')({
            doc_id:application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            process_info: u,
            returned: (application.data.accepted == undefined)? true: false,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res=>{
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete($scope.tabs.application);
        
        // fire.db.transactions.update(application.id,u);
        // notify_applicant(application.user.id,application.id,"Your application is undergoing review.");
        // clear_application_tabs();
        // console.log(application)
        // let act = `You processed application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
    }

    $scope.approveApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        trigerLoading();
        fire.call('review_transaction')({
            doc_id:application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            process_info: u,
            returned: (application.data.approved == undefined)? true: false,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res=>{
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete($scope.tabs.application);

        // u["level"] = "8";
        // if(application.data.approved == undefined){
        //     u["status"] = "4";
        //     u["data.approved"] = {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     };
        // }
        
        // fire.db.transactions.update(application.id,u);
        // notify_applicant(application.user.id,application.id,"Your application has been reviewed.");
        // clear_application_tabs();

        // let act = `You reviewed application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
    }

    $scope.recommendApplication = (application,ev,extra)=>{
        let u = {};
        if(extra !== undefined) u = extra;
        trigerLoading();
        fire.call('recommend_transaction')({
            doc_id:application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            process_info: u,
            returned: (application.data.recommended == undefined)? true: false,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res=>{
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete($scope.tabs.application);

        // u["level"] = "4";
        // if(application.data.recommended == undefined){
        //     u["status"] = "5";
        //     u["data.recommended"] = {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     };
        // }
        // let act = `You recommend application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        // fire.db.transactions.update(application.id,u);
        // notify_applicant(application.user.id,application.id,"Your application has been recommended for approval.");
        // clear_application_tabs();
    }

    $scope.acknowledgeApplication = (application,ev,extra)=>{
        var confirm = $mdDialog.prompt()
            .title('Confirm Permit')
            .textContent(`Confirmation Code was sent to your mobile number. Please confirm the approval of the application number ${application.date}`)
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
            // u["level"] = "-1";
            // u["status"] = "6";
            // u["data.acknowledged"] = {
            //     "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            //     "date" : $scope.date_now(),
            //     "staff_id" : $scope.user.id
            // };
            
            //expiration
            // if(application.name == "Application for Local Transport Permit RFF"){
            //     u["expiration"] = $scope.to_date(Date.now() + tm);
            // }else {
            //     u["expiration"] = $scope.to_date(Date.now() + ty);
            // }
            trigerLoading();
            fire.call('approve_transaction')({
                doc_id:application.id,
                doc_date: application.date,
                staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                process_info: u,
                staff_id: $scope.me.doc_id,
                application_name: application.name,
                applicant_id: application.user.id,
                applicant_name: application.data.application.applicant
            }).then(res=>{
                $scope.is_loading = false;
                $scope.toast(res.data);
                $scope.open_receipt_tab(res.data);
            });
            delete($scope.tabs.application);
                
            // fire.db.transactions.update(application.id,u);
            // notify_applicant(application.user.id,application.id,"Thank you very much! Your application is approved.");
            // clear_application_tabs();

            // let act = `You approved application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
            // $scope.toast(act);
            // $scope.open_receipt_tab(act);
            // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        }, function() {
            // cancel
        });
        
    }

    $scope.returnApplication = (application,ev,lvl,stats)=>{
        fire.db.transactions.update(application.id,{"level":`${lvl}`,"status":`${stats}`});
        let act = `You return application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        $scope.toast(act);
        $scope.open_receipt_tab(act);
        fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        clear_application_tabs();
    }

});