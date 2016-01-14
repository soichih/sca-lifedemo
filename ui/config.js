'use strict';

angular.module('app.config', [])
.constant('appconf', {

    title: 'Life Demo',
    api: '../api/life',

    //shared servive api and ui urls (for menus and stuff)
    profile_api: '../api/profile',
    profile_url: '../profile',

    //shared servive api and ui urls (for menus and stuff)
    shared_api: '../api/shared',
    shared_url: '../shared',
    
    progress_api: '../api/progress',
    progress_url: '../progress',

    sca_api: '../api/sca',
    sca_url: '../sca', //not sure if I will use this

    //authentcation service API to refresh token, etc.
    auth_api: '../api/auth',
    auth_url: '../auth',

    jwt_id: 'jwt',

    menu: [
        {
            id: "about",
            label: "About",
            url: "#/about",
        },
        {
            id: "workflows",
            label: "Workflows",
            url: "#/workflows",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
        {
            id: "resources",
            label: "Resources",
            url: "#/resources",
            show: function(scope) {
                if(~scope.sca.indexOf('user')) return true;
                return false;
            }
        },
    ]
});

