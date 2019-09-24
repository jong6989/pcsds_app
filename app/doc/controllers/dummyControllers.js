
myAppModule.
controller('WSUPOtherUsesController', function($scope) {
    var permit = {
        type: "COMMERCIAL",
        use_for: "EDUCATIONAL/DOCUMENTATION",
        specy_kingdom: [ "animal"],
        date_filed: "2019-04-14",
        applicant: {
            full_name: "Juan dela Cruz",
            country: "Philippines",
            citizenship: "Filipino",
            birthdate: "1984-05-05",
            birthplace: "Puerto Princesa City",
            address: "Brgy. Sta. Monica, Puerto Princesa City, Palawan",
            contact_number: "09211234567",
            business: {
                address: "Brgy. Sta. Monica, Puerto Princesa City, Palawan",
                contact_number: "09217654321"
            },
            occupation: "Computer Programmer",
            civil_status: "single",
            spouse: { name: "Gigi Hadid" },
            group_membership: [ "Palawan Developer's Group", ""],
            TIN: "1234-56789-0",
            photo: "img1.jpg",
            age: 25
        },
        species: [
            { kind: "green turtile", quantity: 1 },
            { kind: "red butterfly", quantity: 3 },
            { kind: "yellow moth", quantity: 4 }
        ],
        collection_method: "net and cages",
        payment:{
            application_fee: 1000.00,
            mode: "cash",
        },
        official_receipt:{
            number: "ABC12345",
            date: ""
        }
    }
    
    $scope.application = {
        data: {
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
            }            
        },
        status: 1
    };

    $scope.set_application = (data)=> {
        $scope.application.data.application = permit;
    }
    $scope.isSpecyKingdomSelected = (specyKingdom) => {
        return permit.specy_kingdom.includes(specyKingdom);
    }

    $scope.getMark = (permitType, userFor, specyKingdomSelected) => {
        var mark = "X";
        if("RESEARCH" == permit.type && permitType == "RESEARCH"){
            return $scope.isSpecyKingdomSelected(specyKingdomSelected) ? mark : "___";
        }

        if(permit.type == "RESEARCH")
            return "___";

        return permit.type == permitType && userFor == permit.use_for && $scope.isSpecyKingdomSelected(specyKingdomSelected) ?
            mark : "___";
    }

    $scope.isMemberOfAGroup = (applicant) => {
        return applicant.group_membership && applicant.group_membership.length > 0;
    }

    $scope.toString = (collection, key) => {
        var values = key ? collection.map(item => item[key]) : collection;
        return values.join(', ');
    }
}).
controller('DummyLTPWildlifeController', ['$scope', '$localStorage',
    function($scope, $localStorage){
        $scope.transport_date = $scope.currentItem.transport_date;
        $scope.issuance_date = $scope.currentItem.issuance_date;
        $scope.paid_date = $scope.currentItem.paid_date;
    // $localStorage.params = {
    //     data:{
    //         application: {},
    //         received: {
    //             staff: "Maria Clara",
    //             date: "2019-06-12 01:32:43"
    //         },
    //         status: 1
    //     },
    //     date: new Date()
    // };

    // $ltpWildlifeInspection.getItem(0, [], null).then(wildlifeInspection => {
    //     $localStorage.params.data.application = wildlifeInspection;
    //     $scope.ltpWildlifeInspectionTable = $scope.ngTable(wildlifeInspection.species);
    // });

    // $scope.set_application = (data) => {
    //     $scope.application = data;        
    // }

    // $scope.set_certificate = (data) => {
    //     $scope.application = data;        
    // }

    // $scope.render_params = { data: {}}
    // $scope.render_params.data = {
    //     application_no : "2019-01-1234",
    //     line1: "This is to certify that the applicant has undertaken the inspection of wildlife/wildlife derivative and by-products which was produced/gathered from Balabac for the purposes of domestication. The species and its quantity of are as follows:",
    //     line2: "This Certification is being issued upon the request of Mr./Ms.Juan dela Cruz to support his/her application for transport of the above-mentioned specimens to Maria Clara which will be transported on September 04, 2019 through van.",
    //     line3: "Issued this 4th day of September, 2019 in Palawan Council for Sustainable Development Staff (PCSDS) Office, Sta. Monica, Puerto Princesa City.",
    //     species: [
    //         { name: "Orthoptera", quantity: "2 heads", description: "Preserved specimen", remarks: "fresh"},
    //         { name: "Blattodea", quantity: "4 heads", description: "Preserved specimen", remarks: "fresh"},
    //         { name: "Odonata", quantity: "2 heads", description: "Preserved specimen", remarks: "fresh"}
    //     ],
    //     paid_amount: "P1,000",
    //     paid_or_number: "ABCD1234",
    //     paid_date: "September 04, 2019",
    //     sign1: {
    //         name: "Arlan T. Asutilla",
    //         designation: "Programmer",
    //         signature: "xxxxxxxxx"
    //     },
    //     sign2: {
    //         name: "Juan dela Cruz",
    //         designation: "Director",
    //         signature: "xxxxxxxxx"
    //     }
    // }
}]).
controller('WildlifeImportCertificationController', ['$scope', '$localStorage',
function($scope, $localStorage){
    var collection = [];
    

    $localStorage.params  = {
        data:{
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
            },
            status: 1
        },
        date: new Date()
    };
    
    $scope.getLoadingPort = (transportation) => {
        if(transportation.air_cargo)
            return transportation.air_cargo.loading_port;
        if(transportation.sea_cargo)
            return transportation.sea_cargo.loading_port;
        return transportation.postal_cargo.loading_port;
    }

    $scope.pcsd = {
        head: {
            full_name: "Nelson P. Devandera",
            position: "PCSDS Executive Director"
        }
    }

    $scope.toString = (collection, key) => {
        var values = collection.map(item => item[key]);
        return values.join(', ');
    }


    $scope.set_application = (data) => {
        $scope.application = data;
    }

    $scope.render_params ={ data:{
        application_no: '2019-04',
        applicant:{
            last_name: "Asutilla",
            first_name: "Arlan",
            middle_name: "T",
            address: "Sta. Monica, Puerto Princesa City"
        },
        line1: "This is to certify that Pena Dugasan of Brooke's Point, Palawan, is authorized to import from Sandakan, Sabah, Malaysia, the following for commercial purposes only, provided, that a Non-CITES Export Certification or equivalent permit has been secured from CITES Management Authority/Malaysia.",
        line2: "The above-mentioned Edible's Bird Nest, Wild mushroom and Rat's Ear shall be imported by Pena Dugasan on March 15, 2019 via Cargo Vessel at Brooke's Point Port and have been verified as not included in Appendices I, II and III of Convention on International Trade in Endangered Species of Wild Fauna and Flora (CITES).",
        line3: "Certification fee in the amount of Php 360 was paid under the Palawan Council for Sustainable Development (PCSD) Official Receipt No. 2105349 dated March 15, 2019.",
        line4: "This Certification is not valid without the dry seal of the Palawan Council for Sustainable Development or if contains erasures or altercation.",
        line5: "Issued this 15th day of March, 2019 in Palawan Council for Sustainable Development Staff (PCSDS) Office, Sta. Monica, Puerto Princesa City.",
        species: [
            { name: "Edible's Bird Nest", description: "Preserved Specimen", quantity: "13 pcs"},
            { name: "Wild mushroom", description: "Preserved Specimen", quantity: "81 pcs"},
            { name: "Rat's Ear", description: "Preserved Specimen", quantity: "166 pcs"}
        ],
        sign1: {
            name: "Arlan T. Asutilla",
            designation: "Programmer",
            signature: "xxxxxxxxx"
        },
        sign2: {
            name: "Juan dela Cruz",
            designation: "Director",
            signature: "xxxxxxxxx"
        },
        origin: {
            country: "Malaysia",
            address: "Sandakan, Sabah"
        },
        transportation: {
            type: "Aircraft"
        },
        import: {
            date: "2019-08-01"
        },
        destination_port: "Puerto Princesa International Airport",
        issuance_date: "2019-07-28",
        paid_amount: "1000",
        paid_or_number: "ABCD1234",
        paid_date: "2019-07-28"
    }};

    // $scope.n = $scope.render_params.data;
}]).
controller('GratuitousPermitController', ['$scope', 'dummyGratuitousPermitService', "$localStorage",
    function($scope, $gratuitousPermitService, $localStorage){
    var collection = [];

    $localStorage.params  = {
        data:{
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
        },
        status: 1
        },
        date: new Date()
    };

    $gratuitousPermitService.getItem(0, []).then(permit => {
        $localStorage.params.data.application = permit;
    });

    $scope.set_application = (data) => {
    
    $scope.application = data;
    }
}]).
controller('WildlifeExportControllerdummy', ['$scope', 'dummywildlifeExportCertService', "$localStorage",
function($scope, 
    $wildlifeExportService, 
    $localStorage){
    $localStorage.params  = {
        data:{
            application: {},
            received: {
                staff: "Maria Clara",
                date: "2019-06-12 01:32:43"
            },
            status: 1
        },
        date: new Date()
    };

    $wildlifeExportService.getCertification(0).then(certification => {
        $localStorage.params.data.application = certification;
    });

    $scope.pcsd = {
        head: {
            full_name: "Nelson P. Devandera",
            position: "PCSDS Executive Director"
        }
    }

    $scope.set_application = (data) => {
        $scope.application = data;
        
    }

    $scope.render_params = {data:{}}
    $scope.render_params.data.application_no = "2019-13";
    $scope.render_params.data.line1 = "This is to certify that Jong-Seok Park of Chunbuk National University, is authorized to export sample specimen for research purposes only by virtue of Gratuitous Permit No. 2018-39 to wit:";
    $scope.render_params.data.line2 = "Contained in 27 small vials, 7 medium size of containers and 5 packs of Whirl-Pak.";
    $scope.render_params.data.line3 = "The above specimens shall be transported on June 21, 2019 and valid until July 21, 2019 via Aircraft and have been verified as not included in Appendices I, II and III of the Convention on on International Trade in Endangered Species of Wild Fauna and Flora (CITES).";
    $scope.render_params.data.line4 = "This Certification is not valid without the dry seal of the Palawan Council for Sustainable Development or if contains erasures or altercation.";
    $scope.render_params.data.line5 = "Certification fee in the amount of Php 310 was paid under the Palawan Council for Sustainable Development (PCSD) Official Receipt No. 2108209 dated June 20, 2019.";
    $scope.render_params.data.line6 = "Issued this 20th day of June, 2019 in Palawan Council for Sustainable Development Staff (PCSDS) Office, Sta. Monica, Puerto Princesa City.";
    $scope.render_params.data.species = [
        { name: "Orthoptera", description: "Preserved Specimen", quantity: "13 pcs"},
        { name: "Blattodea", description: "Preserved Specimen", quantity: "81 pcs"},
        { name: "Hymenoptera", description: "Preserved Specimen", quantity: "166 pcs"},
        { name: "Hemiptera", description: "Preserved Specimen", quantity: "84 pcs"},
        { name: "Coleoptera", description: "Preserved Specimen", quantity: "509 pcs"},
        { name: "Phasmatodea", description: "Preserved Specimen", quantity: "5 pcs"}
    ];
    $scope.render_params.data.sign1 = {
        name: "Arlan T. Asutilla",
        designation: "Programmer",
        signature: "xxxxxxxxx"
    }
    
    $scope.render_params.data.sign2 = {
        name: "Juan dela Cruz",
        designation: "Director",
        signature: "xxxxxxxxx"
    }

    $scope.render_params.data.paid_amount = "P1,000";
    $scope.render_params.data.paid_or_number = "ABCD1234";
    $scope.render_params.data.paid_date = "September 04, 2019";
}]).
controller('dummyPrintController', function($scope){
    $scope.render_params = {
        data:{
            subject: "Application for certification",
            created: "x",
            published: "y",
            source: "Hogwartz",
            description: "The quick brown fox",
            files:[
                { name: "abc.xy", path: "/path/to/file"}
            ]
        }
    }

    $scope.api_address ="/api_address";
}).
controller('WildlifeCollectorController', function($scope){
    $scope.n = {
        permit_number: "2017-1397R1",
        project: {
            name: "Collection of Reef-fish-for-food"
        },
        proponent: {
            name: "Randy Soner",
            address: "Brgy. Paly, Taytay, Palawan"
        },
        date_issued: "2019-09-09",
        expiry_date: "2020-09-09",
        paid_amount: 160,
        paid_or_number: "859485",
        paid_date: "2019-09-09",
        keywords: [
            "",
            "Randy Soner",
            "Collection of Reef-fish-for-food",
            "Brgy. Paly, Taytay, Palawan"
        ],
        line1: "WILDLIFE COLLECTOR'S PERMIT",
        line2: "2017-1397R1",
        line3: "Pursuant to RA 9147 or the Wildlife Act, PCSD Revised Administrative Order No. 05 \"Guidelines for the Regulation and Monitoring of the Catching, Trading, Culturing, Transporting and Exporting of Reef-fish-for-foodin Palawan\" and Section 18 of PCSD AO # 12, this Wildlife Collector's Permit is hereby granted tot he hereunder-named individuality/entity, subject to the terms and conditions specified at the back hereof:",
        line4: "Randy Soner",
        line5: "Name of Proponent",
        line6: "Collection of Reef-fish-for-food",
        line7: "Name of Project/Undertaking",
        line8: "Brgy. Paly, Taytay, Palawan",
        line9: "Address of Proponent",
        line10: "Issued this 9th day of September, 2019 in Puerto Princesa City valid until the 9th day of September, 2020.",
        line11: "",
        line12: "",
        line13: "PAID FEE: 160.00",
        line14: "Paid Under O.R. # 123456",
        line15: "Date: September 25, 2019",
        line16: "Not valid without PCSD official seal.",
        line17: "(PLEASE SEE AT THE BACK PAGE THE TERMS AND CONDITIONS OF THIS CERTIFICATE OF REGISTRATION)",
        // sign1: {
        //     name: "Nelson P. Devanadera",
        //     designation: "Executive Director PCSDS",
        //     signature: "data:image/png;base64,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"
        // }
    }
})
;