'use strict';

app.controller('HeaderController', ['$scope', 'appconf', '$route', 'serverconf', 'menu',
function($scope, appconf, $route, serverconf, menu) {
    $scope.title = appconf.title;
    serverconf.then(function(_c) { $scope.serverconf = _c; });
    $scope.menu = menu;
    $scope.user = menu.user; //for app menu
    $scope.i_am_header = true;
}]);

app.controller('SubmitController', ['$scope', 'appconf', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location',
function($scope, appconf, menu, serverconf, scaMessage, toaster, jwtHelper, $http, $location) {
    scaMessage.show(toaster);
    $scope.appconf = appconf;

    //TODO - will use sca UI's resource query interface (or should I have that served via API?)
    $scope.allresources = [
        {name: "Karst", desc: "IU's main HTC cluster [ppn=16]", resource_id: "5697b3d427863e2273414bed"},
        {name: "BigRed II", desc: "IU's HPC supercomputer [ppn=32]", resource_id: "569d611670a0f97550661e0c"},
        //{name: "Jetstream VM", desc: "A jetstream VM allocated for this prototype", resource_id: "569d5ff770a0f97550661e0b"},
    ];
    $scope.resources = {compute: $scope.allresources[0]};

    $scope.datas = [ 
        {name: "LiFE Demo Data (IU)", desc: "Copy of Demo data provided by Franco Pestilli (cached at xd-login for faster download)", url: "http://xd-login.opensciencegrid.org/scratch/hayashis/life/life_demo_data.tar.gz"},
        {name: "LiFE Demo Data (Stanford)", desc: "Demo data provided by Franco Pestilli", url: "https://stacks.stanford.edu/file/druid:cs392kv3054/life_demo_data.tar.gz"},
    ];
    $scope.config = { input: $scope.datas[0], paramx: "123", paramy: "345", paramz: "abc"};

    $scope.submit = function() {
        $http.post(appconf.api+"/demo/submit", {
            resources: {
                compute: $scope.resources.compute.resource_id,
            },
            config: $scope.config
        })
        .then(function(res) {
            toaster.success(res.data.message);
            //$scope.task = res.data.task;
            $location.path('/task/'+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
}]);

app.controller('TaskController', 
['$scope', 'appconf', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location', '$routeParams', '$timeout',
function($scope, appconf, menu, serverconf, scaMessage, toaster, jwtHelper, $http, $location, $routeParams, $timeout) {
    scaMessage.show(toaster);
    $scope.appconf = appconf;
    $scope.task_id = $routeParams.id;

    
    //keep up with which tabs are active
    $scope.tabs = {
        products: { active: false },
        progress: { active: false },
        config: { active: false },
    }
    function set_active_tab(name) {
        for(var k in $scope.tabs) {
            $scope.tabs[k].active = false;
        }
        $scope.tabs[name].active = true;
    }

    load_task().then(function(task) {
        if($scope.task.status != "finished") {         
            //$scope.tabs.progress.active = true;
            set_active_tab("progress");
            load_progress();
        } else {
            //$scope.tabs.products.active = true;
            set_active_tab("products");
        }
    });


    function load_task() {
        return $http.get(appconf.api+"/demo/task/"+$scope.task_id)
        .then(function(res) {
            $scope.task = res.data;

            if($scope.task.products) {
                var jwt = localStorage.getItem(appconf.jwt_id);
                var pid = 0;
                $scope.task.products.forEach(function(product) {
                    var fid = 0;
                    product.files.forEach(function(file) {
                        file.url = "https://soichi7.ppa.iu.edu/api/life/demo/raw?t="+$scope.task._id+"&p="+pid+"&f="+fid+"&at="+jwt;
                        fid++;
                    });
                    pid++;
                });
            }

            return res.data;
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.progressType = function(status) {
        switch(status) {
        case "running":
            return "";
        case "finished":
            return "success";
        case "canceled":
        case "paused":
            return "warning";
        case "failed":
            return "danger";
        default:
            return "info";
        }
    }

    function load_progress() {
        $http.get(appconf.progress_api+"/status/"+$scope.task.progress_key)
        .then(function(res) {
            /*
            //load products if status becomes running to finished
            if(scope.progress && scope.progress.status == "running" && res.data.status == "finished") {
                toaster.success("Task "+scope.task.name+" completed successfully"); //can I assume it's successful?
                //reload_task().then(reload_products);
                reload_task();
            }
            */
            $scope.progress = res.data;

            //reload progress - with frequency based on how recent the last update was (0.1 to 60 seconds)
            var age = Date.now() - $scope.progress.update_time;
            var timeout = Math.min(Math.max(age/2, 100), 60*1000);
            if($scope.progress.status != "finished") $timeout(load_progress, timeout);
            else {
                toaster.success("Task completed successfully"); //can I assume it's successful?
                set_active_tab("products");
                load_task();
            }
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
}]);

