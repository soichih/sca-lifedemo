'use strict';

app.controller('PageController', ['$scope', 'appconf', '$route', 'menu', 'jwtHelper',
function($scope, appconf, $route, menu, jwtHelper) {
    $scope.appconf = appconf;
    $scope.title = appconf.title;
    $scope.menu = menu;
    var jwt = localStorage.getItem(appconf.jwt_id);
    if(jwt) {
        $scope.user = jwtHelper.decodeToken(jwt);
    }

    //this is crap..
    $scope.reset_urls = function($routeParams) {
        appconf.breads.forEach(function(item) {
            item.url = "#/"+item.id+"/"+$routeParams.instid;
        });
    }
    
    //$scope.user = menu.user; //for app menu
    //$scope.i_am_header = true;
}]);

app.controller('StartController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    $location.path("/process/"+$routeParams.instid).replace();
}]);

/*
app.controller('UploadController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    $scope.back = function() { $location.path("/start/"+$routeParams.instid); }
    $scope.$on("file_uploaded", function() {
        console.log("file_uploaded");
        $scope.changed = true;
    });
    $scope.next = function() {
        if($scope.changed)  $location.path("/import");
        else $location.path("/process");
    }
}]);
*/

app.controller('InputController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    //default goes here
    $scope.config = {
        url: ''
    };

    instance.load($routeParams.instid).then(function(_instance) {
        $scope.instance = _instance;
    });

    function do_import(download_task) {
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-product-lifebrain", //invoke product-nifti's importer
            config: {
                source_dir: download_task._id+"/download" //import source
            },
            deps: [download_task._id],
        })
        .then(function(res) {
            var import_task = res.data.task;
            //$location.path("/import/"+$routeParams.instid+"/"+res.data.task.progress_key);
            $location.path("/import/"+$routeParams.instid+"/"+import_task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }
    $scope.seturl = function(url) {
        $scope.url = url;
    }
    $scope.fromurl = function(url) {
        //first submit download service
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-product-raw",
            config: {
                download: [{dir:"download", url:url}],
            }
        })
        .then(function(res) {
            var download_task = res.data.task;
            do_import(download_task);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
    $scope.fromsda = function(path) {
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-service-hpss",
            config: {
                get: [{localdir:"download", hpsspath:path}],
                auth: {
                    //TODO - let user pick this
                    username: "hayashis",
                    keytab: "5682f80ae8a834a636dee418.keytab",
                }
            },
        })
        .then(function(res) {
            var download_task = res.data.task;
            do_import(download_task);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.doneupload = function() {
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-product-lifebrain", 
            config: {
                source_dir: $scope.appconf.upload_task_id,
            }
        })
        .then(function(res) {
            $location.path("/import/"+$routeParams.instid+"/"+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
}]);

//center of the star
app.controller('ProcessController', ['$scope', 'menu', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location', '$routeParams', 'instance',
function($scope, menu,  scaMessage, toaster, jwtHelper, $http, $location, $routeParams, instance) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    /*
    $scope.config = {
        param1: "test1",
        param2: "test2",
        param3: true,
    }
    */

    instance.load($routeParams.instid).then(function(_instance) { $scope.instance = _instance; });

    //$scope.config = { input: $scope.datas[0], paramx: "123", paramy: "345", paramz: "abc"};
    //
    //find the latest successful nifti data products
    $http.get($scope.appconf.sca_api+"/task", {params: {
        //find one with nifti output
        where: {
            instance_id: $routeParams.instid,
            "products.type": "life/brain",
            status: "finished",
        },
        //find the latest one
        sort: "-update_date",
        limit: 1,
    }})
    .then(function(res) {
        if(res.data[0]) {
            $scope.input_task = res.data[0];
            $scope.inputs = $scope.input_task.products.files;
            $scope.inputs.forEach(function(file) {
                file.checked = true;
            });
        }
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    //load previously submitted tasks
    $http.get($scope.appconf.sca_api+"/task", {params: {
        //find one with nifti output
        where: {
            instance_id: $routeParams.instid,
            service_id: "sca-service-life",
        }
    }})
    .then(function(res) {
        $scope.tasks = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.open = function(task) {
        $location.path("/task/"+$routeParams.instid+"/"+task._id);
        //open sca generic task viewer
        //window.open($scope.appconf.sca_url+"#/task/"+$routeParams.instid+"/"+task._id, "task:"+task._id);
    }

    $scope.submit = function() {
        //will be set to the latest input
        //TODO - should I let user aggregate?
        $scope.instance.config.input_task_id = $scope.input_task._id;

        //list input files checked
        $scope.instance.config.files = [];
        $scope.inputs.forEach(function(input) {
            if(input.checked) $scope.instance.config.files.push(input);
        });
        $scope.instance.config.files.forEach(function(file) { delete file.checked });

        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-service-life",
            config: $scope.instance.config,
        })
        .then(function(res) {
            //toaster.success(res.data.message);
            $location.path("/task/"+$routeParams.instid+"/"+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.addinput = function() {
        $location.path("/input/"+$routeParams.instid);
    }

    //$scope.editingheader = false;
    $scope.editheader = function() {
        $scope.editingheader = true;
    }
    $scope.updateheader = function() {
        instance.save($scope.instance).then(function(_instance) {
            $scope.editingheader = false;
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

}]);

app.controller('ImportController', 
['$scope', 'menu', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location', '$routeParams', '$timeout', 'instance',
function($scope, menu, scaMessage, toaster, jwtHelper, $http, $location, $routeParams, $timeout, instance) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    instance.load($routeParams.instid).then(function(_instance) {
        $scope.instance = _instance;
    });

    $scope.taskid = $routeParams.taskid;

    //from sca-wf-taskdeps 
    $scope.$on('task_finished', function(event, task) {
        $location.path("/process/"+$routeParams.instid);
    });

    //$scope.path = $routeParams.instid+"/"+$scope.taskid; //path to open by default

    //for file service to show files to download
    //$scope.jwt = localStorage.getItem($scope.appconf.jwt_id);


    $scope.back = function() {
        $location.path("/input/"+$routeParams.instid);
    }

    /*
    $scope.stop = function() {
        $http.put($scope.appconf.sca_api+"/task/stop/"+$scope.task._id)
        .then(function(res) {
            toaster.success("Requested to stop this task");
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.rerun = function() {
        $http.put($scope.appconf.sca_api+"/task/rerun/"+$scope.task._id)
        .then(function(res) {
            toaster.success("Requested to rerun this task");
            load();
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
    */

}]);

app.controller('TaskController', 
['$scope', 'menu', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location', '$routeParams', '$timeout',
function($scope, menu, scaMessage, toaster, jwtHelper, $http, $location, $routeParams, $timeout) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    $scope.taskid = $routeParams.taskid;
    $scope.jwt = localStorage.getItem($scope.appconf.jwt_id);

    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }

    /*
    $http.get(appconf.api+"/demo/task/recent")
    .then(function(res) {
        $scope.tasks = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });
    */
}]);

//just a list of previously submitted tasks
app.controller('TasksController', ['$scope', 'menu', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location', '$routeParams', 'instance',
function($scope, menu,  scaMessage, toaster, jwtHelper, $http, $location, $routeParams, instance) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    instance.load($routeParams.instid).then(function(_instance) { $scope.instance = _instance; });

    //load previously submitted tasks
    $http.get($scope.appconf.sca_api+"/task", {params: {
        where: {
            instance_id: $routeParams.instid,
            service_id: "sca-service-life",
        }
    }})
    .then(function(res) {
        $scope.tasks = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.open = function(task) {
        $location.path("/task/"+$routeParams.instid+"/"+task._id);
    }
    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }

}]);

