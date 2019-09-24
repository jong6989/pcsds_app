myAppModule.
controller('PermitToSellController', function($scope){
    $scope.n = {
        applicant:{
            name: '',
            address: ''
        },
        permit_number: ''
    }
    $scope.keywords = [
        $scope.n.applicant.name,
        $scope.n.applicant.address,
        $scope.n.permit_number
    ]
})