myAppModule.
controller('ChainsawMonitoringController', function($scope){
    $scope.n.compliances = [
        { terms: "An authenticated copy of this Certificate must accompany the chainsaw user at all times."},
        { terms: "The chainsaw unit covered by this Certificate shall not be rented out to other persons and shall be used only for the purpose stated on the face hereof. Unauthorized use of the chainsaw shall be a ground for the cancellation of this Certificate of Registration."},
        { allowed_area_to_be_use: ["", "", "", "", ""] }, 
        { terms: "The chainsaw unit covered by this Certificate shall be used for cutting of timber in the area stated on the face hereof, and only upon possession of a valid cutting or utilization permit from concerned government agencies when necessary."},
        { terms: "In case of loss of the unit covered by this Certificate of Registration, the District Management Office concerned or the PCSDS should be informed in writing within three (3) calendar days from the discovery of such loss."}
    ]

    $scope.n.compliances[2]. terms = "The chainsaw shall be used only for the intended purpose and shall not be utilized " +
        "and transported outside the applied area covered by " + $scope.n.compliances[2].allowed_area_to_be_use[0] +
        " of " + $scope.n.compliances[2].allowed_area_to_be_use[1] + "located at Bgy. " + 
        $scope.n.compliances[2].allowed_area_to_be_use[2] + ", Palawan and his residential area located in " + 
        $scope.n.compliances[2].allowed_area_to_be_use[3] +
        "(geographical location).";
}).
controller('SUPMonitoringController', function($scope){
    $scope.n.compliances = [
        { terms: "An authenticated copy of this Certificate must accompany the chainsaw user at all times."},
        { terms: "The Permit is issued to the holder hereof for the purpose of transporting and/or use of the subject chainsaws only in the place of destination and for the purpose stated on the face of this Permit."},
        { allowed_area_to_be_use: ["", "",] }, 
        { terms: "This Permit should accompany the Permit to Cut or similar permits or authorization issued by the concerned government agencies."},
        { terms: "Allow the duly authorized PCSD Staff and/or members of Enforcement/Monitoring Team at any time within reasonable hours of the day and night, with or without notice, to conduct periodic inspection of the subject chainsaws in the exercise of the inspection and visitorial powers of the PCSD."},
        { terms: "The Permit is valid only up to one (1) month from date of issue."},
        { terms: "Furnish PCSDS monthly production report for monitoring purposes."}
    ]

    $scope.n.compliances[2]. terms = "The chainsaws covered by this Permit shall be used " + 
        " only within the parcel of land covered by " + $scope.n.compliances[2].allowed_area_to_be_use[0]  +  
        "in Bgy. " + $scope.n.compliances[2].allowed_area_to_be_use[1] + " Palawan.";
})