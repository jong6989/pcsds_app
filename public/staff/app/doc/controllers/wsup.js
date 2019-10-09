myAppModule.
controller('WSUPEvaluationController', function($scope){
    $scope.toggle = (item) => {
        var index = $scope.n.submitted_requirements.indexOf(item);
        if(index > -1)
            $scope.n.submitted_requirements.splice(index, 1);
        else
            $scope.n.submitted_requirements.push(item);
    }
})