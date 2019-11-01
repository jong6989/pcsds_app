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
}).
controller('WSUPMonitoringController', function($scope){
    $scope.n.compliances = [
        { terms: "The permittee is allowed to buy and sell the " + 
            "following marine wildlife species that are non threatened and " + 
            "economically important. Provided, that the buy and sell of " + 
            "said species shall be done only upon compliance of the no. 2 condition hereof;"},
        { terms: "Buy and sell of marine species enumerated above " + 
            "(except on marine fishes) must start only after submission to " + 
            "PCSDS of a copy of the Mayor’s permit duly approved by the " + 
            "Municipal Mayor on the current year indicating the species as part thereof;"},
        { terms: "The permittee shall only deal or transact to " + 
            "individuals with Wildlife Collector’s and/or Wildlife Specia Use Permit;"},
        { terms: "Collection of the above species must be done " + 
            "by the permittee and his authorized collectors namely: "},
        { terms: "The transport of allowed species indicated " + 
            "in # 1 above form Palawan to other places within the " + 
            "Philippines shall be accompanied by a Local Transport " + 
            "Permit (LTP) to be secured form PCSDS prior to the scheduled date of transport;"},
        { terms: "In case of transport of live marine wildlife " + 
            "specimens (indicated in no. 1 condition) to other places " + 
            "within the Philippines, the permittee must observe " + 
            "the applicable provisions of the City Ordinance No. 110 (as amended), " + 
            "of to be transported via Puerto Princesa City;"},
        { terms: "The permittee shall submit to the PCSDS a " + 
            "quarterly report using quarterly monitoring report for " + 
            "traders of Fishery Products (attached hereto as Annex " + 
            "A). failure to submit a quarterly report shall be a ground " + 
            "for non-approval of the application for Local Transport Permit;"},
        { terms: "In case of incidental catches that can no longer to return " + 
            "to the wild, the permittee shall submit an inventory if incidental " + 
            "catches within fifteen (15) days after collection;"},
        { terms: "The permittee and/or his authorized collectors " + 
            "are allowed to collect aforementioned species. The methods of " + 
            "collection must be with least of no detrimental " + 
            "effects to existing marine wild population and their habitats;"},
        { terms: "In case the location of the business " + 
            "establishment will be transferred, the permittee shall inform the PCSDS in writing;"},
        { terms: "The permittee shall observe cleanliness and " + 
            "sanitation in the maintenance of the aquarium facility/ies to " + 
            "prevent possible contamination and/or spread of pest/" + 
            "diseases which may effect the survival of marine wildlife populations " + 
            "and other species in the discharge area/s;"},
        { terms: "The permit must be posted at the office " + 
            "and/or where buying/selling station of the Permittee is located;"},
        { terms: "In the exercise of visitorial powers, " + 
            "PCSDS officials and personnel shall be allowed to conduct " + 
            "monitoring/inspection of activities without prior notice;"},
        { terms: "In case there is a need for additional " + 
            "condition(s) and/or amendment to this permit to ensure " + 
            "environmental integrity or sustainability of fishery product harvest " + 
            "as a result of technical assessment/evaluation/scientific studies " + 
            "and/or regular monitoring/inspection, the same shall be imposed by PCSDS;"},
        { terms: "Allow PCSD staff to conduct random sampling " + 
            "of species subject of every transport for biometric purposes " + 
            "in order to support a study on the " + 
            "population of said specimens; "},
        { terms: "Failure to comply with any of the terms and " + 
            "conditions herein specified shall be sufficient ground for the " + 
            "cancellation of this permit and disqualification from renewal," + 
            " subject to administrative due process;"},
        { terms: "Any alternation, erasure of obliteration in " + 
            "this permit shall be sufficient ground for the cancellation/revocation " + 
            "of this permit without prejudice to criminal and " + 
            "other liabilities of the offender."},
        { terms: "This permit is NON-TRANSFERABLE and shall be " + 
            "effective for ONE YEAR (1) form the date of issuance hereof, " + 
            "unless sooner revoked of cancelled for non-compliance " + 
            "with and/or violation f the terms and conditions specified herein, " + 
            "or for violation of pertinent laws, rules and regulation."},
        { terms: "Non-compliance with any of the above conditions " + 
            "of the relevant provisions of PCSD Admin Order No. 12 series of " + 
            "2011 and other relevant laws, rules and " + 
            "regulations shall be sufficient cause for the suspension of " + 
            "cancellation of this permit and the imposition of appropriate " + 
            "penalty provided under the said Admin Order."}
    ];

})