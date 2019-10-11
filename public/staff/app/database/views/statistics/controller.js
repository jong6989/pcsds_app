
myAppModule.
controller('StatController', function($scope, $crudService, $localStorage, municipalityService){
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
    
    var yearlyGraph;
    var byMunicipalGraph;
    $scope.wsup_db = { data : [], summary : {} };
    $scope.wsup_db.data = ($localStorage.wsup_db_data)?  $localStorage.wsup_db_data : [];
    $scope.wsup_db.summary = ($localStorage.wsup_db_summary)?  $localStorage.wsup_db_summary : {};

    $scope.loadWSUP = () => {
        fire.db.database.query.doc('WSUP').collection("database").onSnapshot(qs => {
            let res = qs.docs.map( dx => {
                let b = dx.data();
                b.id = dx.id;
                return b;
            });
            $scope.wsup_db.data = $localStorage.wsup_db_data = res;
        });
    
        fire.db.database.when("WSUP",(d) => {
            $scope.wsup_db.summary = $localStorage.wsup_db_summary = d;
            setTimeout($scope.loadGraph, 100);
        });
    }

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
            yearlyGraph.update();

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
            byMunicipalGraph.update();
        });
    }

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

    // $scope.loadGraph();
    $scope.loadWSUP();
});
document.write(`<script src="/plugins/chartjs/Chart.min.js"></script>`);
