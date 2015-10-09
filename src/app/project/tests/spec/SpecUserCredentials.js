require([
    'app/project/userCredentials',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/project/userCredentials', function () {
        var widget;

        beforeEach(function () {
            widget = WidgetUnderTest;
        });

        afterEach(function () {
            if (widget) {
                widget = null;
            }
        });
        describe('getUserData', function () {
            var form;
            var key;
            var token;
            beforeEach(function () {
                form = domConstruct.create('form', {
                    id: 'user-data'
                }, document.body);
                key = domConstruct.create('input', {
                    type: 'hidden',
                    name: 'key',
                    value: 'i am a user key'
                }, form);
                token = domConstruct.create('input', {
                    type: 'hidden',
                    name: 'token',
                    value: 'i am a user token'
                }, form);
            });
            afterEach(function () {
                domConstruct.destroy(form);
            });
            it('pulls the user information from the form', function () {
                var actual = widget.getUserData();
                expect(actual).toEqual({
                    key: 'i am a user key',
                    token: 'i am a user token'
                });
            });
            it('sends null values if the items are empty', function () {
                domConstruct.destroy(key);
                domConstruct.destroy(token);

                var actual = widget.getUserData();
                expect(actual).toEqual({
                    key: null,
                    token: null
                });
            });
        });
    });
});
