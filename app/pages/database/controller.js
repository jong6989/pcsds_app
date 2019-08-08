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
myAppModule.controller('pcsd_database_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    var XLSX = require('xlsx');
    $scope.wsup_db = { data : [], summary : {} };
    $scope.wsup_db.data = ($localStorage.wsup_db_data)?  $localStorage.wsup_db_data : [];
    $scope.wsup_db.summary = ($localStorage.wsup_db_summary)?  $localStorage.wsup_db_summary : {};
    $scope.database_view = './app/pages/database/views/graphs.html';
    $scope.currentNavItem = 'Statistics';
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
        data.map( d => { if(d[key]) f[d[key]] = true; return d[key]; } );
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

    $scope.loadGraph = () => {
        let labels = [];
        let datas = [];
        if($scope.wsup_db.summary){
            //Yearly Count
            if($scope.wsup_db.summary.count){
                for (const key in $scope.wsup_db.summary.count) {
                    if ($scope.wsup_db.summary.count.hasOwnProperty(key)) {
                        const e = $scope.wsup_db.summary.count[key];
                        if(key != 'all'){
                            labels.push(key);
                            datas.push(e.total);
                        }
                    }
                }
                graphOption.title.text = 'Yearly Permit Status';
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
                new Chart(document.getElementById('canvas1').getContext('2d'), graph_config);
            }
            
            //Per Municipality
            if($scope.wsup_db.summary.per_municipality){
                labels = [];
                datas = [];
                for (const key in $scope.wsup_db.summary.per_municipality) {
                    if ($scope.wsup_db.summary.per_municipality.hasOwnProperty(key)) {
                        const e = $scope.wsup_db.summary.per_municipality[key];
                        if(e > 50) {
                            labels.push(key);
                            datas.push(e);
                        }
                    }
                }
                graphOption.title.text = 'Total Permit Per Municipality';
                graphOption.scales.xAxes[0].scaleLabel.labelString = 'Municipality/City';
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
                new Chart(document.getElementById('canvas2').getContext('2d'), graph_config);
            }
        }else {
            setTimeout($scope.loadGraph, 3000);
        };
    };

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
        $scope.toast('new WSUP data added!');
    };


    // $scope.upload_excel = (f,t)=>{
    //     if(uploading_type != '') return null;
    //     if(typeof(f) == typeof([])){
    //         uploading_type = t;
    //         var f = f[0];
    //         var reader = new FileReader();
    //         reader.onload = function(e) {
    //             var data = e.target.result;
    //             data = new Uint8Array(data);
    //             let wb = XLSX.read(data, {type: 'array'});
    //             wb.SheetNames.forEach(element => {
    //                 let jsonData = XLSX.utils.sheet_to_json(wb.Sheets[element]);
    //             });
    //         };
    //         reader.readAsArrayBuffer(f);
    //     }else {
    //         $scope.toast("file error");
    //     }
    // }

    $scope.save_database = (d,t)=>{

        // async function createDatabase ()  {
        //     await fire.db.database.query.doc("WSUP").set({"id":"WSUP"});
        //     console.log("DB Created");
        //     d[0].data.forEach( async (e) => {
        //         let i = {};
        //         for (const key in e) {
        //             if (e.hasOwnProperty(key)) {
        //                 const element = (e[key] != undefined)? e[key] : '';
        //                 i[key] = element;
        //             }
        //         }
        //         i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
        //         i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
        //         if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
        //             i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
        //         }
        //         if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
        //             i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
        //         }
        //         i.keywords = i.name.split(' ').filter( d => d.length > 1);
        //         await fire.db.database.query.doc("WSUP").collection("database").add(i);
        //         let u = {};
        //         u["count.all"] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
        //         await fire.db.database.query.doc("WSUP").update(u);
        //     });
        // };
        // createDatabase();
        

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