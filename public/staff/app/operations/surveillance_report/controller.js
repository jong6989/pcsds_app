'use strict';

myAppModule.controller('surveillance_report_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    const time_key = 'created_time';
    const collection = 'documents';
    const category = 'surveillance_report';

    $scope.load_data = ()=>{
        $scope.currentItem = $localStorage.data;
        if($scope.currentItem == undefined) $scope.set_path('/operations/surveillance_report/create');
    };

    $scope.open_view = (item)=>{
        $localStorage.data = item;
        $scope.set_path('/operations/surveillance_report/view');
    };

    $scope.ceil = (number)=> {
        return Math.ceil(number);
    };

    $scope.load_all = ()=>{
        $scope.all_items = [];
        $scope.total_query_size = 0;
        $scope.query_limit = 20;
        $scope.pointer_query_array = [];
        let last_query_doc;

        let load_query = (query,decrement,is_initial)=>{
            query.get().then( async (qs) => {
                if(!qs.empty){
                    let results = qs.docs.map( d => {
                        let item = d.data();
                        item.id = d.id;
                        return item;
                    } );
    
                    last_query_doc = qs.docs[qs.docs.length - 1];
                    $scope.all_items = results;
    
                    if(is_initial || !decrement)
                    $scope.pointer_query_array.push(qs.docs[0].data()[time_key]);
                    
                    $scope.$apply();
                }
            });
        };

        $scope.next_query_items = ()=>{
            let query_set = db.collection(collection)
            .orderBy(time_key,"desc")
            .where('category','==',category)
            .limit($scope.query_limit)
            .startAfter(last_query_doc);
            load_query(query_set);
        };
    
        $scope.previus_query_items = ()=>{
            let previous_doc = $scope.pointer_query_array[pointer_query_array.length - 2];
            $scope.pointer_query_array.splice($scope.pointer_query_array.length - 1,1);
            let query_set = db.collection(collection)
            .orderBy(time_key,"desc")
            .where('category','==',category)
            .limit($scope.query_limit)
            .startAt(parseInt(previous_doc));
            load_query(query_set,true);
        };

        db.collection(collection).where('category','==',category).onSnapshot( qs => {
            $scope.total_query_size = qs.size;
            let query_set = db.collection(collection)
            .where('category','==',category)
            .orderBy(time_key,"desc")
            .limit($scope.query_limit);
            load_query(query_set,false,true);
        });
    };

    $scope.listen_document_change = (callBack)=>{
        if($scope.currentItem){
            db.collection(collection).doc($scope.currentItem.id).onSnapshot( (res)=>{
                let d = res.data();
                d.id = res.id;
                $scope.currentItem = d;
                if(callBack) callBack();
                $scope.$apply();
            } );
        }
    };

});

document.write(`<script src='app/operations/surveillance_report/create/controller.js'></script>`);
document.write(`<script src='app/operations/surveillance_report/list/single/controller.js'></script>`);
