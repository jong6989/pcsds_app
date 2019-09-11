'use strict';

document.write(`<script src="./plugins/chartjs/Chart.min.js"></script>`);
var graphOption = {
    responsive: true,
    title: {
        display: true,
        text: ''
    },
    tooltips: {
        mode: 'index',
        intersect: false,
    },
    hover: {
        mode: 'nearest',
        intersect: true
    },
    scales: {
        xAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Year'
            }
        }],
        yAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Count'
            }
        }]
    }
};
myAppModule.controller('pcsd_database_controller', function ($scope, 
    $timeout, $utils, $mdToast,$localStorage, $crudService, municipalityService) {
    var XLSX = require('xlsx');
    $scope.wsup_db = { data : [], summary : {} };
    $scope.wsup_db.data = ($localStorage.wsup_db_data)?  $localStorage.wsup_db_data : [];
    $scope.wsup_db.summary = ($localStorage.wsup_db_summary)?  $localStorage.wsup_db_summary : {};
    $scope.database_view = './app/pages/database/views/graphs.html';
    $scope.currentNavItem = 'respondents';
    $scope.dropDownSelect = {};
    $scope.selectItems = {};
    $scope.n = {};

    //WSUP
    fire.db.database.query.doc('WSUP').collection("database").onSnapshot(qs => {
        let res = qs.docs.map( dx => {
            let b = dx.data();
            b.id = dx.id;
            return b;
        });
        $scope.wsup_db.data = $localStorage.wsup_db_data = res;
        $scope.invalidate_data_table($scope.wsup_db.data);
    });
    fire.db.database.when("WSUP",(d) => {
        $scope.wsup_db.summary = $localStorage.wsup_db_summary = d;
        setTimeout($scope.loadGraph, 100);
    });

    $scope.invalidate_data_table = (d)=>{
        $scope.data_table = $scope.ngTable(d);
    };

    $scope.getKeys = (data,key) => {
        let f = {};
        data.map( d => { 
            if(d[key]) f[d[key]] = true; 
            return d[key]; 
        } );
        let r = [];
        let c = [];
        for (const key in f) {
            r.push({id: key, title: key});
            c.push(key);
        }
        $scope.selectItems[key] = c;
        $scope.dropDownSelect[key] = r;
    };

    $scope.changeView = (v) => { $scope.database_view = v; };

    var graphYearlyPermit = () => {
        let labels = getLabels();
        let datas = [];

        
        if($scope.wsup_db.summary){
            //Yearly Count
            if($scope.wsup_db.summary.count){
                labels.forEach(label => {
                    const e = $scope.wsup_db.summary.count[label];
                    datas.push(e ? e.total : 0);
                });

                graphOption.title.text = 'Yearly Statistics';
                var graph_config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'WSUP',
                            fill: false,
                            backgroundColor: '#f67019',
                            borderColor: '#f67019',
                            data: datas,
                        }]
                    },
                    options: graphOption
                };
                
                return new Chart(document.getElementById('canvas1').getContext('2d'), graph_config);
            }
        }
    }

    var yearlyGraph;
    var byMunicipalGraph;

    function getLabels() {
        let labels = [];
        var now = new Date();
        
        for(var i = 2012; i <= now.getFullYear(); i++){
            labels.push(i);
        }

        return labels;
    }
    function loadYearlyStatGraph(documentName, label, backgroundColor, borderColor){
        let data = [];
        var statistics = $crudService.getCountByYear(fire.db.database, documentName);
        statistics.then(yearlyCount => {
            yearlyGraph.config.data.labels.forEach(label => {
                data.push(yearlyCount[label] ? yearlyCount[label].total : 0);                
            });

            yearlyGraph.config.data.datasets.push({
                label: label,
                fill: false,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                data: data,
            })
            
        });
    }

    function loadByMunicipalityStatGraph(documentName, label, backgroundColor, borderColor){
        let data = [];
        var statistics = $crudService.getCountByMunicipality(fire.db.database, documentName);
        statistics.then(byMunicipalityCount => {
            byMunicipalGraph.config.data.labels.forEach(label => {
                data.push(byMunicipalityCount[label] ? byMunicipalityCount[label] : 0);                
            });

            byMunicipalGraph.config.data.datasets.push({
                label: label,
                fill: false,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                data: data,
            })
            
        });
    }

    $scope.loadGraph = async() => {
        if($scope.wsup_db.summary){            
            yearlyGraph = graphYearlyPermit();
            loadYearlyStatGraph("ChainsawPermitToPurchase", "Permit to Purchase Chainsaw", "green", "green");
            loadYearlyStatGraph("ChainsawPermitToSell", "Permit to Sell Chainsaw", "blue", "blue");
            loadYearlyStatGraph("ChainsawRegistration", "Chainsaw Registration", "yellow", "yellow");
            loadYearlyStatGraph("Apprehension", "Apprehensions", "brown", "brown");

            //Per Municipality
            byMunicipalGraph = await getByMunicipalityGraph();
            loadByMunicipalityStatGraph("ChainsawPermitToPurchase", "Permit to Purchase Chainsaw", "green", "green");
            loadByMunicipalityStatGraph("ChainsawPermitToSell", "Permit to Sell Chainsaw", "blue", "blue");
            loadByMunicipalityStatGraph("ChainsawRegistration", "Chainsaw Registration", "yellow", "yellow");
            loadByMunicipalityStatGraph("Apprehension", "Apprehensions", "brown", "brown");
            
        };

    }

    async function getByMunicipalityGraph(){
        var graph_config = {};

        var labels = await municipalityService.getMunicipalities();
        var data = [];

        labels.forEach(label => {
            const e = $scope.wsup_db.summary.per_municipality[label];
            data.push(e || 0);
        });

        if($scope.wsup_db.summary.per_municipality) {
            graphOption.title.text = 'Statistics Per Municipality';
            graphOption.scales.xAxes[0].scaleLabel.labelString = 'Municipality/City';
            graph_config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'WSUP',
                        fill: false,
                        backgroundColor: '#f67019',
                        borderColor: '#f67019',
                        data: data,
                    }]
                },
                options: graphOption
            };
        }

        // }else {
        //     setTimeout($scope.loadGraph, 3000);
        // };
        return new Chart(document.getElementById('canvas2').getContext('2d'), graph_config);
    }
    $scope.openAddWSUPModal = (evt) => {
        $scope.n = {};
        $scope.showPrerenderedDialog(evt,'addWSUP');
    };

    $scope.addWSUPData = async (e) => {
        $scope.close_dialog();
        let i = {};
        for (const key in e) {
            if (e.hasOwnProperty(key)) {
                const element = (e[key] != undefined)? e[key] : '';
                i[key] = element;
            }
        }
        i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
        i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
        if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
            i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
        }
        if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
            i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
        }
        i.keywords = i.name.split(' ').filter( d => d.length > 1);
        await fire.db.database.query.doc("WSUP").collection("database").add(i);
        let u = {};
        u["count.all"] = firebase.firestore.FieldValue.increment(1);
        if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
        if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
        if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
        await fire.db.database.query.doc("WSUP").update(u);
        $scope.toast('New WSUP data added!');
    };


    $scope.upload_excel = (files, permitType)=>{
        if(uploading_type != '') return;
        if(typeof(files) == typeof([])){
            uploading_type = t;
            var file = files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = new Uint8Array(e.target.result);
                let wb = XLSX.read(data, {type: 'array'});
                wb.SheetNames.forEach(element => {
                    let jsonData = XLSX.utils.sheet_to_json(wb.Sheets[element]);
                });
            };
            reader.readAsArrayBuffer(file);
        }else {
            $scope.toast("file error");
        }

    }

    $scope.save_database = (json, databaseName)=>{

        async function createDatabase ()  {
            await fire.db.database.query.doc("WSUP").set({"id":"WSUP"});
            //console.log("DB Created");
            json[0].data.forEach( async (e) => {
                let i = {};
                for (const key in e) {
                    if (e.hasOwnProperty(key)) {
                        const element = (e[key] != undefined)? e[key] : '';
                        i[key] = element;
                    }
                }
                i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
                i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
                if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
                    i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
                }
                if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
                    i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
                }
                i.keywords = i.name.split(' ').filter( d => d.length > 1);
                await fire.db.database.query.doc("WSUP").collection("database").add(i);
                let u = {};//statisticss
                u["count.all"] = firebase.firestore.FieldValue.increment(1);
                if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
                if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
                if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
                await fire.db.database.query.doc("WSUP").update(u);
            });
        };
        createDatabase();
        

        // let vv = [ 'Corporation ', 'Last_Name'];

        // vv.forEach(v => {
        //     let mun = {};
        //     d[0].data.forEach(e => {
        //         if(e[v] != undefined)
        //             mun[e[v]] = (mun[e[v]] == undefined)? 1 : mun[e[v]] + 1;
        //     });
        //     console.log(mun);
        // });

        
    }
});

document.write(`<script src="./app/doc/services/crudService.js"></script>`);
document.write(`<script src="./app/doc/services/municipalitiesService.js"></script>`);
document.write(`<script src="./app/doc/services/dateService.js"></script>`);
document.write(`<script src="./app/doc/services/collection.js"></script>`);
document.write(`<script src="./app/doc/services/addressService.js"></script>`);

document.write(`<script src="./app/doc/controllers/Apprehension.js"></script>`);
document.write(`<script src="./app/doc/controllers/ChainsawRegistration.js"></script>`);
document.write(`<script src="./app/doc/controllers/CriminalCases.js"></script>`);
document.write(`<script src="./app/doc/controllers/Permit.js"></script>`);
document.write(`<script src="./app/doc/controllers/CaseRespondent.js"></script>`);
document.write(`<script src="./app/doc/controllers/wildLifeImport.js"></script>`);
document.write(`<script src="./app/doc/controllers/wildlifeExport.js"></script>`);
document.write(`<script src="./app/doc/controllers/wildlifeInspection.js"></script>`);
document.write(`<script src="./app/doc/controllers/wsup.js"></script>`);

document.write(`<script src="./app/doc/services/dummyCrudService.js"></script>`);
document.write(`<script src="./app/doc/controllers/dummyControllers.js"></script>`);

