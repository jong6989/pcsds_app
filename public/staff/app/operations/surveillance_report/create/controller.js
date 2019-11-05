'use strict';

myAppModule.controller('surveillance_report_create_controller', function ($scope, $timeout, $mdDialog, $interval, $http, $localStorage) {
    $scope.is_loading = false;
    $scope.last_control_number = '';
    $scope.last_control_number_id = '';
    $scope.date = $scope.date_now('YYYY-MM-DD');

    $scope.load_last_number = ()=>{
        db.collection('meta').where('key','==','last_no_for_surveillance_report').onSnapshot( qs => {
            let results = qs.docs.map( d => {
                let item = d.data();
                item.id = d.id;
                return item;
            } );
            if(results.length > 0){
                $scope.last_control_number = results[0].value;
                $scope.last_control_number_id = results[0].id;
            }else {
                db.collection('meta').add({key: 'last_no_for_surveillance_report', value : ''}).then(ref => {
                    $scope.last_control_number_id = ref.id;
                });
            }
            $scope.$apply();
        });
        //initialize data from other document
        if($localStorage.soi_data){
            let soi = $localStorage.soi_data;
            $scope.n.soi_number = soi.control_number;
            $scope.n.alleged_violations = soi.alleged_violations;
            $scope.n.recommended_operation_type = soi.recommendation;
            $scope.n.name = soi.persons_involved;
            $scope.n.report_subject = soi.summary_subject;
            delete($localStorage.soi_data);
        }
    };

    $scope.n = {
        subject : 'Surveillance Report',
        template : {
			"name" : "Surveillance Report",
			"type" : "report",
			"permit" : false,
			"create" : 	"./app/templates/templates/intelligence/surveillance/create.html",
			"edit" : 	"./app/templates/templates/intelligence/surveillance/edit.html",
			"print" : 	"./app/templates/templates/intelligence/surveillance/print.html",
			"view" : 	"./app/templates/templates/intelligence/surveillance/view.html"
        },
        created : $scope.date_now('YYYY-MM-DD'),
        published : $scope.date_now('YYYY-MM-DD'),
        date : $scope.date_now('YYYY-MM-DD'),
        category : 'surveillance_report',
        keywords : []
    };

    $scope.create = (user_id) =>{
        if(user_id !== undefined) {
            $scope.is_loading = true;
            let x = $scope.n;
            x.publisher = user_id;
            x.created_time = Date.now();
            x.status = 'published';
            x.meta = {'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
            x.agency = $scope.global.ops;

            x.keywords = x.keywords.filter( (value) => { return (value == undefined || value == '' || value == ' ')? false : true; } );

            try {
                db.collection('documents').add(x).then( (ref) => {
                    if($scope.last_control_number_id !== ''){
                        db.collection('meta').doc($scope.last_control_number_id).update({"value": x.control_number});
                        $scope.last_control_number = x.control_number;
                    }
                    if(ref.id){
                        $scope.toast_s("document created!");
                        x.id = ref.id;
                        $localStorage.data = x;
                        $scope.set_path('/operations/surveillance_report/view');
                    }else {
                        $scope.set_path('/operations/surveillance_report/list/single');
                    }
                });
            } catch (error) {
                console.log(error);
                $scope.toast_e("Sorry, System Error! Reloading...");
                $timeout(()=>{location.reload();},3000);
            }
            
        }else {
            $scope.toast_e("system error, please activate your account for document network.");
        }
    };

});
