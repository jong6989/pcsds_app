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

}).
controller('RFFMonitoringController', function($scope){
    $scope.n.compliances = [
        { terms: "Buy and sell of RFF species must start only after submission to " + 
        "ECAN Board Endorsement duly approved by the Municipal ECAN Board Chairman on the current year which covers RFF as part of the approved business permit." },
        { terms: "The permittee shall only buy RFF from catchers with duly issued " + 
        "valid PCSD Wildlife Collector’s Permit (WCP) and who are included in their list of catchers." },
        { terms: "The permittee shall secure Local Transport Permit (LTP) from " + 
        "PCSDS prior to the shipment date for transport of RFF from Palawan to other places within the Philippines." },
        { terms: "The Permittee shall only deal or transact to individuals issued " + 
        "with valid Wildlife Collector’s and/or Wildlife Special Use Permit." },
        { terms: "The permittee shall secure from PCSDS a Non-CITES export " + 
        "certification three (3) working days prior to the date of shipment for export of RFF coming from Palawan even if the port of exit is outside the province." },
        { terms: "The use of RFF species for caging purposes shall be in " + 
        "accordance with the size/weight restriction specified under PCSD Revised AO 5 as amended by PCSD Resolution No. 17-587 that the allowed wild-caught RFF species shall have a minimum weight of 250 grams and shall not exceed 1500 grams (250 grams – 1500 grams). No caging of wild-caught suno with weight below 250 grams is allowed except those sourced from accredited hatcheries." },
        { terms: "Wild-caught suno which weigh below 250 grams and more than " + 
        "1500 grams, is/are gravid shall be released immediately back to the capture site." },
        { terms: "The use of Dynamite, Cyanide and Compressor for fishing " + 
        "shall be prohibited, except when compressor is used for cleaning cages and feeding suno kept thereat. Provided, that compressors are installed and controlled at the Sitio and Barangay Sites." },
        { terms: "No trash fish caught using illegal method such as dynamite " + 
        "fishing is allowed as feeds for the RFF species under this permit." },
        { terms: "The permittee shall observe cleanliness and good sanitation " + 
        "at all times in the maintenance of the aquarium facility/ies to prevent possible contamination and/or spread of pest/diseases which may affect the survival of both live fish/es in the aquarium and wild fish populations and other species in the discharge area/s." },
        { terms: "All prohibitions indicated under Section 16 of PCSD Revised " + 
        "Administrative Order No. 05, series of 2014 (attached hereto as “Annex A”) which are applicable to catching, trading, transport, and export and breeding of RFF shall be an integral part of the terms and conditions herein provided." },
        { terms: "The permittee shall submit to the PCSDS a quarterly report " + 
        "using quarterly monitoring report for traders of RFF (attached hereto as Annex B). Failure to submit a report for the previous quarter shall be ground for non-approval of the current application for Local Transport Permit." },
        { terms: "This Permit shall not be used to trade RFF defined in this " + 
        "order which were caught in Core Zones or areas declared by concerned LGUs as overfished or Marine Protected Areas." },
        { terms: "Comply with the terms of the Letter of Commitment submitted " + 
        "to the PCSD." },
        { terms: "Practice waste segregation by providing garbage bins in the " + 
        "buying station and aquarium according to the general types of wastes  (Biodegradable, Recyclable, Non-Recyclable)for proper disposal of the wastes generated during project operation.  Composting shall be practiced for biodegradable wastes" },
        { terms: "Provide a septic tank in the buying station and aquarium, " + 
        "if necessary and/or as determined by the PCSDS." },
        { terms: "Put a perimeter net that will serve as solid waste screener " + 
        "underneath the buying station and aquarium." },
        { terms: "Secure other necessary permits from concerned agencies prior " + 
        "to the commencement of the project." },
        { terms: "Shall not allow other entities, natural or juridical the use " + 
        "of PCSD permit for purposes of engaging in any of the RFF operations." },
        { terms: "Inform the concerned PCSD DMO Staff if the buying station and " + 
        "aquarium is relocated to another place." },
        { terms: "In case there is a need for additional condition(s) and/or " + 
        "amendment to this permit to ensure environmental integrity or sustainability of RFF as a result of technical evaluation/assessment/scientific studies or as recommended by the technical working group created under the Joint Executive Order No. 1  (Creation of  the Technical Working Group and Resource Persons Pool For Reef-Fish-For-Food Industry in the Province of Palawan) entered into between PCSD and the office of the Provincial Government, and change or amendment in RFF policy by the PCSD the same shall be imposed by PCSDS." },
        { terms: "Any alteration, erasure or obliteration in this permit shall " + 
        "be sufficient ground for the cancellation/revocation of this permit without prejudice to criminal and other liabilities of the offender." }
    ];
}).
controller('SEPMonitoringController', function($scope, Upload){
    $scope.n.compliances = [
    { terms: "Confine project operation within the applied area of 300 square meters.", uploadedImages:[]},
    { terms: "Any expansion of the project is subject to a separate SEP Clearance.", uploadedImages:[]},
    { terms: "Strictly implement and comply with the mitigating measures stipulated" +
    " in Initial    Environmental Examination (IEE) Report.", uploadedImages:[]},
    { terms: "The herein grantee shall assume full responsibility and liability for" +
    " damages to private/public property caused by the project."},
    { terms: "Should the implementation of the project cause adverse environmental" +
    " impact and pose nuisance to public health and safety as determined by PCSDS, " +
    " these factors shall be sufficient ground for the cancellation or suspension of the SEP Clearance.", uploadedImages:[]},
    { 
        terms: "Institute an energy and resource efficient measures and other green" +
        " methodologies in the operation of the following systems: lighting, transport, " +
        " ventilation, refrigeration, air-conditioning, waste disposal, water supply, water heating, and supply chain. " , uploadedImages:[]},
    { terms: "Register to the ZCR Project within 30 days from receipt of the SEP" +
    " Clearance. Registration forms are available at the PCSD Main Office and at the District Management Office.", uploadedImages:[] },
    { terms: "Institute an energy and resource efficient measures and other green" +
    " methodologies in the operation of the following systems: lighting, transport, " +
    " ventilation, refrigeration, air-conditioning, waste disposal, water supply, water heating, and supply chain.", uploadedImages:[]},
    { terms: "Effect a yearly reduction in the energy bill from fossil fuel sources", uploadedImages:[] },
    { terms: "Establish monthly self-monitoring system which would include among others" +
    " power/energy, water and chemical consumption, effluent and ambient water " +
    " quality and volume of solid and liquid wastes generated. Water and electricity " +
    " bills and fuel receipts are required as supporting documents, if applicable. " +
    " This shall be audited by the PCSD-ZCR Team. ", uploadedImages:[] },
    { terms: "The Proponent shall pay the corresponding monitoring fee to the ECAN Board which will form part of the monitoring fund to be used by the latter in monitoring activities", uploadedImages: []},
    { terms: "This project (its documents, structures, equipment and operation) is subject to monitoring or actual inspection by the ECAN Board (by itself or through its SMT) and PCSDS at any time of the day or night with or without prior permission", uploadedImages: []},
    { terms: "This Clearance may be transferred to another only after the requisites stipulated in Section 15 of PCSD AO No. 6, as amended, are complied with", uploadedImages: []},
    { terms: "The issuance of the SEP Clearance is subject to a post-condition that the corresponding LGU endorsement, ECC, FPIC, license, permit and other similar instruments must be subsequently secured, a copy of which will be furnished to the PCSD", uploadedImages: []},
    { terms: "In case there is a need for additional condition(s) to ensure environmental integrity and public safety as a result of regular monitoring/inspection, the same shall be imposed by PCSD.", uploadedImages: []}
    ];

    var imageID = 1;
    $scope.addToGallery = (files, imageCollection, index) => {
        Upload.
            base64DataUrl(files).
            then(urls => {
                urls.forEach(url => {
                    var image = {
                        id: `${imageID}-${index}`,
                        url: url,
                        deletable: true
                    }

                    imageCollection.push(image);
                    imageID++;
                })
            })
    }

    $scope.removeFromGallery = (imageToRemove, onDelete) => {
        var imageIDinArray = imageToRemove.id.split('-');
        var rowIndex = parseInt(imageIDinArray[imageIDinArray.length - 1], 10);
        var index = $scope.n.compliances[rowIndex].uploadedImages.findIndex(image => image.id == imageToRemove.id);
        if (index > -1) {
            $scope.n.compliances[rowIndex].uploadedImages.splice(index, 0);
            onDelete();
        }
    }
})