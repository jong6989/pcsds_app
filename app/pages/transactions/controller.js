'use strict';


myAppModule.controller('transactions_controller', function ($scope, $timeout, $utils, $mdToast,$mdDialog,NgTableParams) {
    
    var APPLICANT_DB = new JsonDB("DB/APPLICANTS", true, false);
    const applicant_string = "/applicants";
    var TRANSACTION_DB = new JsonDB("DB/TRANSACTIONS", true, false);
    const incoming_string = "/incoming";

    try {
        TRANSACTION_DB.getData(incoming_string + "[0]");
        APPLICANT_DB.getData(applicant_string + "[0]");
    } catch(error) {
        TRANSACTION_DB.push(incoming_string,[]);
        APPLICANT_DB.push(applicant_string,[]);
    };

    $scope.is_loading = false;
    $scope.is_single_loading = false;
    $scope.application_loading = false;
    $scope.update_queue = 0;
    $scope.opened_single = {};
    $scope.current_page_view = "app/pages/transactions/views/incoming_transactions.html";
    $scope.current_active_view = "incoming_transactions";
    $scope.dataSelector = "";
    $scope.my_transactions = [];

    $scope.change_current_view = (p)=>{
        $scope.current_page_view = "app/pages/transactions/views/" + p + ".html";
        $scope.current_active_view = p;
    }

    if($scope.user.user_level == ('7' || '8') ){
        $scope.change_current_view('my_transactions');
    }

    $scope.invalidate_table = ()=>{
        let data = TRANSACTION_DB.getData(incoming_string);
        $scope.tbl_incoming =  new NgTableParams({sorting: { id: "desc" } }, { dataset: data });
    };

    $scope.set_application = (x)=>{
        $scope.application = x;
    }

    $scope.get_my_transactions = ()=>{
        $scope.user.user_level = parseInt($scope.user.user_level);
        var d = [];
        switch ($scope.user.user_level) {
            case 99:
            case 5:
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status > 0 && d.data.received.staff.id == $scope.user.id && d.status != 2 ).reverse();
                break;
            case 99:
            case 7:
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 3 ).reverse();
                break;
            case 99:
            case 8:
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 4 ).reverse();
                break;
            default:
                break;
        }
        return d;
    };

    $scope.invalidate_my_transactions = ()=>{
        $scope.my_transactions = $scope.get_my_transactions();
    }

    $scope.get_user_by_id = (id)=> {
        let data = USER_DB.getData(user_string);
        for (let x of data) {
            if(x.id == id) return x;
        }
        return undefined;
    }

    $scope.filter_incoming = (selector)=>{
        $scope.dataSelector = selector;
        if(selector == ""){
            $scope.invalidate_table();
        } else {
            let data = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == selector );
            $scope.tbl_incoming =  new NgTableParams({sorting: { id: "desc" } }, { dataset: data });
        }
    }

    $scope.open_single = (x,ev)=>{
        $scope.opened_single = {};
        TRANSACTION_DB.getData(incoming_string).forEach(element => {
            if(element.id == x.id){
                $scope.opened_single = element;
                $scope.showPrerenderedDialog(ev,'receiveSingleTransaction');
                return;
            }
        });
    }

    //$scope.filter_incoming($scope.dataSelector);
    $scope.db_changes = (DB,st,d,item,callBack)=>{
        let index = 0;
        DB.getData(st).forEach(element => {
            if(element.id == item.id){
                DB.push(st + "["+index+"]",d);
                // item = d;
                $timeout( ()=>{ if(callBack != undefined) callBack(); }, 200 );
                return;
            }else {
                index++;
            }
        });
    }

    $scope.update_single = (x)=>{
        if($scope.update_queue == 0){
            $scope.update_queue = 1;
            let q = { 
                data : { 
                    action : "applicant/transaction/get",
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.update_queue = 0;
                    if(data.data.status == 1){
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{$scope.filter_incoming($scope.dataSelector);});
                    }
                }
            };
            $utils.api(q);
        }
    }

    $scope.getTransactionStatus = (n)=>{
        if(n==0)return "New";
        if(n==1)return "On-Review";
        if(n==2)return "Declined";
        if(n==3)return "Proccesing";
        if(n==4)return "For Approval";
        if(n==5)return "For Release";
        if(n==6)return "Released";
        if(n==7)return "For Pic-up";
        if(n==8)return "Received by Applicant";
        if(n==9)return "Used";
        if(n==10)return "Expired";
    };

    $scope.download_incoming = ()=>{
        $scope.invalidate_table();
        $scope.is_loading = true;
        let d = TRANSACTION_DB.getData(incoming_string);
        let l = (d.length > 0)? d[d.length - 1].id : 0;
        let current_length = d.length;
        let q = { 
            data : { 
                action : "applicant/transaction/load",
                offset : current_length,
                last_id : l,
                user_id : $scope.user.id
            },
            callBack : (data)=>{
                if(data.data.status == 1){
                    $scope.is_loading = false;
                    TRANSACTION_DB.push(incoming_string,data.data.data,false);
                    $timeout($scope.download_incoming,50);
                }else {
                    $timeout(()=>{ $scope.filter_incoming($scope.dataSelector); },100);
                    $scope.is_loading = false;
                }
            },
            errorCallBack : ()=>{
                $timeout(()=>{ $scope.filter_incoming($scope.dataSelector); },100);
                $scope.is_loading = false;
            }
        };
        $utils.api(q);
    };

    $scope.receive_single = (x)=>{
        $scope.is_single_loading = true;
        let q = { 
            data : { 
                action : "applicant/transaction/receive",
                id : x.id,
                staff_id : $scope.user.id
            },
            callBack : (data)=>{
                $scope.is_single_loading = false;
                if(data.data.status == 1){
                    $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{$scope.filter_incoming($scope.dataSelector);});
                    $scope.close_dialog();
                }
            },
            errorCallBack : ()=>{
                $scope.toast("OFFLINE, try again later...")
            }
        };
        $utils.api(q);
    }
    
    $scope.download_applicant = ()=>{
        let d = APPLICANT_DB.getData(applicant_string);
        let l = (d.length > 0)? d[d.length - 1].id : 0;
        let current_length = d.length;
        let q = { 
            data : { 
                action : "applicant/account/load",
                offset : current_length,
                last_id : l,
                user_id : $scope.user.id
            },
            callBack : (data)=>{
                if(data.data.status == 1){
                    APPLICANT_DB.push(applicant_string,data.data.data,false);
                    $timeout($scope.download_applicant,50);
                }
            }
        };
        $utils.api(q);
    };

    $scope.rejectApplication = (x,ev)=>{
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
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/reject",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                        $scope.application = undefined;
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.acceptApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Accepting Application')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Accept and proceed to Approval')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/accept",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = "";
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.approveApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Approve Application')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('approve')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/approve",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = "";
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.recommendApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Recommend for Permit Releasing')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('recommend')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/recommend",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = "";
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

});