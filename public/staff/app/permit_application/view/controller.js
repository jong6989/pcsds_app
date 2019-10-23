'use strict';

myAppModule.controller('permit_application_transaction_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.is_transaction_selected = false;
    $scope.application = undefined;
    $scope.application_templates = [];
    $scope.permit_application_list = [];
    $scope.total_query_size = 0;
    $scope.query_limit = 10;
    $scope.pointer_query_array = [];
    var last_query_doc;

    $scope.load_permit_applications = (query,decrement,is_initial)=>{
        query.get().then( async (qs) => {
            if(!qs.empty){
                let results = qs.docs.map( d => {
                    let item = d.data();
                    item.id = d.id;
                    return item;
                } );

                last_query_doc = qs.docs[qs.docs.length - 1];
                $scope.permit_application_list = results;

                if(is_initial || !decrement)
                    $scope.pointer_query_array.push(qs.docs[0].data().date);
                
                $scope.$apply();
                //lazy load next items
                if(qs.docs.length == $scope.query_limit){
                    db.collection("transactions")
                    .orderBy("date","desc")
                    .limit($scope.query_limit)
                    .startAfter(last_query_doc)
                    .get();
                }
            }
        });
    };

    db.collection('transactions').onSnapshot( qs => {
        $scope.total_query_size = qs.size;
        let query_set = db.collection("transactions")
        .orderBy("date","desc")
        .limit($scope.query_limit);
        $scope.load_permit_applications(query_set,false,true);
    });

    $scope.next_query_items = ()=>{
        let query_set = db.collection("transactions")
        .orderBy("date","desc")
        .limit($scope.query_limit)
        .startAfter(last_query_doc);
        $scope.load_permit_applications(query_set);
    };

    $scope.previus_query_items = ()=>{
        let previous_doc = $scope.pointer_query_array[$scope.pointer_query_array.length - 2];
        $scope.pointer_query_array.splice($scope.pointer_query_array.length - 1,1);
        let query_set = db.collection("transactions")
        .orderBy("date","desc")
        .limit($scope.query_limit)
        .startAt(parseInt(previous_doc));
        $scope.load_permit_applications(query_set,true);
    };

    $scope.find_application = ()=>{
        let find_result;
        Swal.fire({
            title: 'Enter Transaction Number',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off',
                minlength: 13,
                maxlength: 15
            },
            inputValidator: (value) => {
                if (!value) {
                    return 'Invalid Number!'
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Open Transaction',
            showLoaderOnConfirm: true,
            preConfirm: async(search) => {
                let qs = await db.collection("transactions").where("date","==",parseInt(search)).get();
                
                if(!qs.empty){
                    find_result = qs.docs[0].data();
                    find_result.id = qs.docs[0].id;
                    $scope.select_transaction(find_result);
                    return undefined;
                }else {
                    Swal.showValidationMessage(
                        `Transaction not found!`
                      )
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });
    };

    //load json data
    $http.get("/json/permitting/templates.json").then(function(data){
        $scope.application_templates = data.data.data; 
    });

    $scope.select_transaction = (transaction)=> {
        $scope.application = transaction;
        $scope.is_transaction_selected = true;
    };

    $scope.clear_selected_transaction = ()=> {
        delete($scope.application);
        $scope.is_transaction_selected = false;
    };


});
