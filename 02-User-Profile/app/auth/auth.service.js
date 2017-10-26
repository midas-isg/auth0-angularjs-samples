(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$state', 'angularAuth0', '$timeout'];

  function authService($state, angularAuth0, $timeout) {

    var userProfile;

    function login() {
      angularAuth0.authorize();
    }

    function renew () {
      angularAuth0.renewAuth({
       timeout: 1000, // Set it to be quick to refresh controllers. A better way is to notify controllers.
       redirectUri: AUTH0_CALLBACK_URL,
       usePostMessage: true
      }, function (err, result) {
       if (err || (result && result.error)) { // For auth0.js version 8.8, the error shows up at result.error
        if (result)
         err = {error: result.errorDescription}; // For auth0.js version 8.8, the error message shows up at result.errorDescription
        console.log(`Could not get a new token using silent authentication (${err.error}). Redirecting to login page...`);
       } else {
        setSession(result);
       }
      });
    }

    function toMidasAccountsUrl(endpoint, message, title) {
     title = title || "AngularJS SSO Example";
     message = message || "Please sign on to use the services";
     return MIDAS_ACCOUNTS_URL + endpoint + '?returnToUrl='
        + encodeURIComponent(window.location) + '&title=' + title + '&message=' + message;
    }

    function signoff() {
        localStorage.clear();
        location.href = toMidasAccountsUrl('/signoff', 'You have been signed off. You may sign on again.');
    }

    function handleAuthentication() {
      angularAuth0.parseHash(function(err, authResult) {
        if (authResult && authResult.idToken) {
          setSession(authResult);
          $state.go('home');
        } else if (err) {
          console.log(err);
          //alert('Error: ' + err.error + '. Check the console for further details.');
        } else {
          renew();
        }
      });
    }

    function getProfile(cb) {
      var accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('Access token must exist to fetch profile');
      }
      angularAuth0.client.userInfo(accessToken, function(err, profile) {
        if (profile) {
          setUserProfile(profile);
        }
        cb(err, profile);
      });
    }

    function setUserProfile(profile) {
      userProfile = profile;
    }

    function getCachedProfile() {
      return userProfile;
    }

    function setSession(authResult) {
      // Set the time that the access token will expire at
      let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
      localStorage.setItem('access_token', authResult.accessToken);
      localStorage.setItem('id_token', authResult.idToken);
      localStorage.setItem('expires_at', expiresAt);
    }
    
    function logout() {
      // Remove tokens and expiry time from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      $state.go('home');
    }
    
    function isAuthenticated() {
      // Check whether the current time is past the 
      // access token's expiry time
      let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
      return new Date().getTime() < expiresAt;
    }

    return {
      midasSsoHref: toMidasAccountsUrl('/sso'),
      signoff: signoff,
      login: login,
      getProfile: getProfile,
      getCachedProfile: getCachedProfile,
      handleAuthentication: handleAuthentication,
      logout: logout,
      isAuthenticated: isAuthenticated
    }
  }
})();
