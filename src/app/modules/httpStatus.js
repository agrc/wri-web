define({
    isSuccessful: function (status, method) {
        console.log('app.modules.httpStatus:isSuccessful', arguments);

        if (['POST', 'GET'].indexOf(method) > -1) {
            return status === 200;
        }

        if (method === 'DELETE') {
            return status === 202;
        }

        if (method === 'PUT') {
            return status === 204;
        }

        return false;
    }
});
