'use strict';

myAppModule.controller('applicant_dashboard_controller', function ($scope, $http, $timeout, $utils, $mdDialog, $interval, Upload, $localStorage) {
    var my_applications = null;
    $scope.application_menus = [
        { name : "Reef fish for food Local Transport Permit", url : "#!/pages/application/wildlife/ltp_rff" },
        { name : "Wildlife products Local Transport Permit", url : "#!/pages/application/wildlife/ltp_ao12" },
        { name : "Wildlife Special Use Permit (RFF)", url : "#!/pages/application/wildlife/wsup_rff" },
        { name : "Wildlife Special Use Permit (AO12)", url : "#!/pages/application/wildlife/wsup_ao12" },
        { name : "Wildlife Collector's Permit", url : "#!/pages/application/wildlife/wcp" },
        { name : "Wildlife Farm Permit", url : "#!/pages/application/wildlife/wfp" }
    ];

    $scope.load_my_applications = ()=>{
        fire.db.transactions.query.where("user.id", "==", `${$scope.user.id}`)
        .onSnapshot(function(querySnapshot) {
            var d = [];
            querySnapshot.forEach(function(doc) {
                let z = doc.data();
                d.push(z);
            });
            $localStorage.my_applications = d;
            $scope.$apply();
        });
    };

    $scope.profile_checker = (user,event)=>{
        if(user.data.profile_picture == undefined){
            $scope.alert("Incomplete Profile","Please Upload your Profile Picture!",event);
            window.location = "#!/pages/profile";
        }
    }

    $scope.set_application = (x,ev)=>{
        $scope.application = x;
        $scope.showPrerenderedDialog(ev,'singleTransaction');
    }

});
