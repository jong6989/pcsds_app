myAppModule.controller('jao_controller',function($scope,$localStorage, $utils,$http) 
{
    $scope.Accounting_JAO = $localStorage.Accounting_JAO || [];
    $scope.Accounting_JAO1 = $localStorage.Accounting_JAO1 || [];
    //$scope.Accounting_Year = $localStorage.Accounting_Year || [];
    $scope.Accounting_Year;
    $scope.Accounting_Month
    $scope.Accounting_DIVISION;
    $scope.Accounting_AllotClass;
  
    $scope.jaoBudgetMOOE_add = function(d,e){
        //var databudget = Object.assign(e.data,d.data);
       
        var q = { 
            
            data : { 
                action : "Accounting/jao/addBudget",
                Year : d.YearBudget,
                Division : d.divisionBudget,
                AllotmentClass: "Maintenance and Other Operating Expenses",
                Month : e.Month,
                data : e.data
                
            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  }
              }
            };
        $utils.api(q);

    }

    $scope.jaoBudgetPS_add = function(d,e){
        var databudget = Object.assign(e.data,d.data);
       
        var q = { 
            
            data : { 
                action : "Accounting/jao/addBudget",
                Year : d.YearBudget,
                Division : d.divisionBudget,
                AllotmentClass: "Personal Services",
                Month : e.Month,
                data : e.data
                
            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  }
              }
            };
        $utils.api(q);
    }

    $scope.jaoBudgetCO_add = function(d,e){
        
        
        var databudget = Object.assign(e.data,d.data);
       
        var q = { 
            
            data : { 
                action : "Accounting/jao/addBudget",
                Year : d.YearBudget,
                Division : d.divisionBudget,
                AllotmentClass: "Capital Overlay",
                Month : e.Month,
                data : e.data
                
            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  }
              }
            };
        $utils.api(q);

    }
    var typeclass;

    $http.get('app/pages/Accounting/JAO/data.json').then((data)=>{
       // console.log(data);
        $scope.jsondata = data.data;
        typeclass = data.data;

    });

    var aYear,aMonth,aDivision,aAllotClass;
    

    //$scope.Accounting_Month = $localStorage.Accounting_Month || [];

    $scope.trylang = function(){
        $scope.is_single_account_selected = true;
        $scope.open_view_Budget = true;
        $scope.disabled1 = true;
        $scope.disabled2 = true;
        $scope.disabled3 = true;

    };

    $scope.type_EDis = (s) =>{
        console.log(s);

        // $scope.selected_account = s;
        if(s == "Personal Services"){
            $scope.PST = typeclass.PS;
        }
        else if (s == "Maintenance and Other Operating Expenses"){
            $scope.PST = typeclass.MOOE;
        }
        else if (s == "Capital Overlay"){
            $scope.PST = typeclass.CO;
        }
         $scope.is_single_account_selected = false;
     };

    

    $scope.open_selected_account = () =>{
        //$scope.selected_account = s;
        //$scope.is_single_account_selected = false;

        $scope.ViewExpenses = $scope.templates[8];

        var q = { 
            data : { 
                action : "Accounting/jao/get",
                Month_Date : aMonth,
                Year_Date : aYear,
                DIVISION : aDivision,
                AllotmentClass : aAllotClass

            },
            callBack : function(data){
                       $localStorage.Accounting_JAO = $scope.JAO_List =  $scope.ngTable(data.data.data);
                       $localStorage.Accounting_JAO1 =  data.data.data;
                }   
            };
            $utils.api(q);
            
            $scope.YearData = aYear;
            $scope.MonthData = aMonth;
            $scope.DivisionData = aDivision;
            $scope.ACData = aAllotClass;
    };

    $scope.SData = function(d){
        //console.log(d);
        aYear = d;
        console.log(aYear);
        $scope.disabled1 = false;

        var q = { 
            data : { 
                action : "Accounting/jao/getMonth",
                //date : d
                Year_Date: d
                             
            },
            callBack : function(data){
                       $scope.Accounting_Month = data.data.data;
                }   
            };
            $utils.api(q);
            

    };

    $scope.DData = function(d){
        //console.log(d);
        aMonth = d;
        console.log(aMonth);
        $scope.disabled2 = false;

        var q = { 
            data : { 
                action : "Accounting/jao/getDivision",
                Month_Date : aMonth,
                Year_Date : aYear
                             
            },
            callBack : function(data){
                       $scope.Accounting_DIVISION = data.data.data;
                       
                }   
            };
            $utils.api(q);

    }

    $scope.EData = function(d){
        
        console.log(d);
        $scope.disabled3 = false;
        aDivision = d;

       
        var q = { 
            data : { 
                action : "Accounting/jao/getAllotClass",
                Month_Date : aMonth,
                Year_Date : aYear,
                DIVISION : aDivision
                             
            },
            callBack : function(data){
                       $scope.Accounting_AllotClass = data.data.data;
                       
                }   
            };
            $utils.api(q);
    }

    $scope.FData = function(d){
        console.log(d);
        aAllotClass = d;

    }

    

    $scope.get_year = function(){
        var q = { 
            data : { 
                action : "Accounting/jao/getYear",
                             
            },
            callBack : function(data){
                       $scope.Accounting_Year = data.data.data;
                       
                }   
            };
            $utils.api(q);
    };
    
    $scope.jao = {};
    
    $scope.jao_add = function(d){

        
        obj = JSON.parse(d.expenses);
        console.log(obj);
        console.log(obj.hello);
        
        month = $scope.to_month(d.data.date);
        year = $scope.to_year(d.data.date);
        var q = { 
            data : { 
                action : "Accounting/jao/getBudget",
                Year: year,
                Month: month,
                AllotmentClass: d.allotment,
                Division : d.division,
                             
            },
            callBack : function(data){

                      amount = data.data.data;

                      console.log(amount);
                      
                      var results = [];
                      
                      
                      for(var i = 0; i < amount.length; i++){//get amountbudget
                            results.push(amount[i].data.BuildingBudget);
                        }
                      console.log(results);
                        
                      var TotalBudget = 0;

                      for (var i  = 0; i < results.length; i++){//get totalamountbudget
                        TotalBudget  += results[i];
                      }
                        console.log(TotalBudget);

                     if(TotalBudget >= d.data.amount){
                            // document.getElementById("formreset").reset();
            
                            // d.data.date = $scope.to_date(d.data.date);
                            // 
                            // console.log("month");
                            // //$scope.is_single_account_selected = true;

                            // var t = { 
                                
                            //     data : { 
                            //         action : "Accounting/jao/add",
                            //         ObrNo : d.ObrNo,
                            //         data : d.data,
                            //         AllotmentClass : d.allotment,
                            //         Type_Expenses : d.expenses,
                            //         DIVISION : d.division,
                            //         Month_DATE : month,
                            //         Year_Date : year

                                    
                            //     },
                            //     callBack : function(data){
                            //         if(data.data.status == 0){
                            //         $scope.toast(data.data.error + "  : " + data.data.hint);
                            //         }
                                    
                            //         else {
                            //         $scope.toast(data.data.data);
                            //         $scope.jao = {data : {}}
                            //         }
                            //     }
                            // };
                            // $utils.api(t);
                            
                        console.log("Meron");
                     }
                     else{
                        console.log("Wala");
                     }

                }   
            };
        $utils.api(q);

    }

    $scope.get_jao = function(){
        
    };

    $scope.ShowSearchExpenses = function(){
        
        $scope.ViewExpenses = $scope.templates[7];

    }

    $scope.view_budget = function(){
        
        $scope.ViewExpenses = $scope.templates[9];

        var q = { 
            data : { 
                action : "Accounting/jao/getBudget",

            },
            callBack : function(data){
                        $scope.JAOBudget =  $scope.ngTable(data.data.data);
                        $scope.JaoBudgetlist = data.data.data;
                      
                }   
            };
        $utils.api(q);

        console.log(JAOBudget);


    }
    

    $scope.templates =
      [{ name: 'template1.html', url: './app/pages/Accounting/JAO/template1.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/template2.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AddExpenses.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/PS.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/MOOE.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/CO.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AddBadget.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewExpenses.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewData.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewBudget.html'}];

    $scope.template = $scope.templates[0];
    $scope.AddExpenses = $scope.templates[2];
    $scope.AB_Allot_PS = $scope.templates[3];
    $scope.AB_Allot_MOOE = $scope.templates[4];
    $scope.AB_Allot_CO = $scope.templates[5];
    $scope.AddBudgets = $scope.templates[6];
    $scope.ViewExpenses = $scope.templates[7];
     


})