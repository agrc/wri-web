require([
    'app/modules/httpStatus'
], function (
    patient
) {
    describe('app/modules/httpStatus', function () {
        describe('POST', function () {
            it('200 is successful', function () {
                expect(patient.isSuccessful(200, 'POST')).toEqual(true);
            });
            it('anything else is unsuccessful', function () {
                expect(patient.isSuccessful(201, 'POST')).toEqual(false);
            });
        });
        describe('GET', function () {
            it('200 is successful', function () {
                expect(patient.isSuccessful(200, 'GET')).toEqual(true);
            });
            it('anything else is unsuccessful', function () {
                expect(patient.isSuccessful(201, 'GET')).toEqual(false);
            });
        });
        describe('DELETE', function () {
            it('202 is successful', function () {
                expect(patient.isSuccessful(202, 'DELETE')).toEqual(true);
            });
            it('anything else is unsuccessful', function () {
                expect(patient.isSuccessful(201, 'DELETE')).toEqual(false);
            });
        });
        describe('PUT', function () {
            it('204 is successful', function () {
                expect(patient.isSuccessful(204, 'PUT')).toEqual(true);
            });
            it('anything else is unsuccessful', function () {
                expect(patient.isSuccessful(201, 'PUT')).toEqual(false);
            });
        });
    });
});
