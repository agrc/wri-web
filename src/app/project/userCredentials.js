define([

], function (

) {
    return {
        getUserData: function () {
            // summary:
            //      gets the user data from the form
            // {key: token:}
            console.log('app.project.userCredentials:getUserData', arguments);

            var form = document.getElementById('user-data');
            var key = 'key' in form ? form.key.value : null;
            var token = 'token' in form ? form.token.value : null;

            return {
                key: key,
                token: token
            };
        }
    };
});
