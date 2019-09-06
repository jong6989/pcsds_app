'use strict';

myAppModule.controller('doc_ctrl_files', function ($scope, $timeout, $utils, $mdToast,$mdDialog) {
    const userId = $scope.userId;
    $scope.fileLogs = [];

    doc.db.collection(acc).doc(userId).collection(offlineFiles).onSnapshot(qs => {
        let res = qs.docs.map( doc => { let x = doc.data(); x.id = doc.id; return x;});
        $scope.fileLogs = res;
    });
});