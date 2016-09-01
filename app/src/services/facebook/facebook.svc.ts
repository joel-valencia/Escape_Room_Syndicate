import {async, register} from 'platypus';
import BaseService from '../base/base.svc';
import SyndicateRepo from '../../repositories/syndicate/syndicate.repo';

declare var FB:any;
declare var window:any;
declare var statusChangeCallback:any;

export default class FacebookService extends BaseService {
    
    constructor(private synRepo:SyndicateRepo) {
        super();
    }
    
    initFB() {
        // set function for sdk to call when loaded
        window.fbAsyncInit = function() {
            // initialize library
            FB.init({
                appId: '110976615969719',
                cookie: true,
                xfbml: true,
                version: 'v2.5',
                status: true
            });
            
            // listen for login and get user variables
            FB.Event.subscribe('auth.login', (response:any) => {
                this.synRepo.user.accessToken = response.authResponse.accessToken;
                console.log(this.synRepo.user.accessToken);
                FB.api('/me', (response:any) => {
                    this.synRepo.user.name = response.name;
                    this.synRepo.user.id = response.id;
                    console.log(this.synRepo.user.name);
                    console.log(this.synRepo.user.id);
                });
            });

            // check if already logged in
            FB.getLoginStatus(function(response:any) {
                statusChangeCallback(response);
            });
        }.bind(this);
        
        // load sdk
        (function(d:any, s:any, id:any) {
            var js:any, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        } (document, 'script', 'facebook-jssdk'));
    };
    
    logoutFB() {
        FB.api('/me/permissions', 'delete', (response:any) => {
            if (response.success == true) {
                console.log("logged out");
                document.getElementById('fb_login').style.display = "inline";
                document.getElementById('fb_user').style.display = "none";
            };
        });
    };
}

register.injectable('facebookapi-svc', FacebookService, [SyndicateRepo]);
