'use strict';

myAppModule.controller('user_management_controller', function ($scope, $mdDialog, $utils, $mdToast, NgTableParams) {
  var USER_DB = new JsonDB(dbFolder + "USERS", true, false);
  const user_string = "/users";

  try {
    USER_DB.getData(user_string + "[0]");
  } catch(error) {
    USER_DB.push(user_string,[]);
  };
  
  $scope.selected_user = {};
  $scope.is_single_user_selected = false;
  $scope.selectedIndex = 0;
  $scope.user_types = [
    {level:99,name:"Admin"},
    {level:0,name:"OJT"},
    {level:1,name:"Front Desk Staff"},
    {level:2,name:"Central Registry Staff"},
    {level:3,name:"ED Secretary"},
    {level:4,name:"Executive Director"},
    {level:5,name:"Permitting Staff"},
    {level:6,name:"Field Staff"},
    {level:7,name:"Permitting Chief"},
    {level:8,name:"Operations Director"},
    {level:9,name:"Legal Staff"},
    {level:10,name:"Staff"},
    {level:11,name:"Division Head"},
    {level:12,name:"Department Head"}
  ];

  $scope.invalidate_table = ()=>{
    var data = USER_DB.getData(user_string);
    $scope.tbl_users =  new NgTableParams({sorting: { id: "desc" }, count : 100 }, { dataset: data });
  };

  $scope.get_users_by_level = (lvl)=>{
    return USER_DB.getData(user_string).filter(user => user.user_level == lvl );
  };

  $scope.get_users = ()=>{
    return USER_DB.getData(user_string);
  };

  $scope.get_user = (id)=>{
    return USER_DB.getData(user_string).filter(user => user.id == id )[0];
  };
 
  $scope.download_users = ()=>{
    $scope.invalidate_table();
    var q = { 
        data : { 
            action : "user/get",
            user_id : $scope.user.id
        },
        callBack : (data)=>{
            if(data.data.status == 1){
              USER_DB.push(user_string,data.data.data);
                $scope.invalidate_table();
            }
        }
    };
    $utils.api(q);
  };
    
  $scope.add_new_user = function(d){
    var q = { 
      data : { 
        action : "user/add",
        id_number : d.id_number,
        user_key : d.user_key,
        data : d.data,
        user_level : d.user_level,
        user_id : $scope.user.id
      },
      callBack : function(data){
        if(data.data.status == 0){
          $scope.toast(data.data.error + "  : " + data.data.hint);
        }else {
          $scope.toast(data.data.data);
          $scope.download_users();
          $scope.selectedIndex = 0;
        }
      }
    };
    $utils.api(q);
  };

  $scope.activate_user = function(user_id){
    var q = { 
      data : { 
        action : "user/activate",
        id : user_id
      },
      callBack : function(data){
        if(data.data.status == 1){
          $scope.toast(data.data.data);
          $scope.download_users();
        }
      }
    };
    $utils.api(q);
  };

  $scope.change_password = (d,ev)=> {
    var confirm = $mdDialog.prompt()
      .title(`${d.data.first_name} ${d.data.last_name}`)
      .textContent('Change password.')
      .placeholder('password')
      .ariaLabel('Change password')
      .initialValue('')
      .targetEvent(ev)
      .required(true)
      .ok('Change')
      .cancel('Close');

    $mdDialog.show(confirm).then(function(result) {
      var q = { 
        data : { 
          action : "user/change_pass",
          id : d.id,
          password : result
        },
        callBack : function(data){
          if(data.data.status == 0){
            $scope.toast(data.data.error + "  : " + data.data.hint);
          }else {
            $scope.toast(data.data.data);
          }
        }
      };
      $utils.api(q);
    }, function() {
      //
    });
  };

  $scope.update_selected_user = function(d){
    var q = { 
      data : { 
        action : "user/update",
        id : d.id,
        id_number : d.id_number,
        data : d.data,
        user_level : d.user_level,
        user_id : $scope.user.id
      },
      callBack : function(data){
        if(data.data.status == 0){
          $scope.toast(data.data.error + "  : " + data.data.hint);
        }else {
          $scope.is_single_user_selected = false;
          $scope.download_users();
          $scope.toast(data.data.data);
          $scope.selectedIndex = 0;
        }
      }
    };
    $utils.api(q);
  };
  
  $scope.open_selected_user = function(s){
    $scope.selected_user = s;
    $scope.is_single_user_selected = true;
  };

});