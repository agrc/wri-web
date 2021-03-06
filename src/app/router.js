define([
    'app/config',

    'dojo/_base/lang',
    'dojo/hash',
    'dojo/io-query',
    'dojo/string',
    'dojo/topic',

    'lodash/array/difference'
], function (
    config,

    lang,
    hash,
    ioQuery,
    dojoString,
    topic,

    difference
) {
    return {
        // description:
        //      Parse and update the URL parameters used to set and preserve the state of the application

        // projectIds: String []
        //      The id or id's of the currently displayed projects
        projectIds: null,

        // inClause: string
        // summary:
        //      the in where clause template
        inClause: '${0} IN(${1})',

        // notInClause: string
        // summary:
        //      the inverse where clause template
        notInClause: '${0} NOT IN(${1})',

        startup: function () {
            // summary:
            //      spin up and get everything set up
            console.log('app/router::startup', arguments);

            topic.subscribe('/dojo/hashchange', lang.hitch(this, 'onHashChange'));

            var beginHash = hash();
            this.onHashChange(beginHash);
        },
        onHashChange: function (newHash) {
            // summary:
            //      Fires anytime the hash in the URL changes.
            //      Check for changes to hash props that we care about
            //      and fire relevant events.
            // newHash: String
            console.log('app/router:onHashChange', arguments);

            var newProps = ioQuery.queryToObject(newHash);

            if (!newProps.id) {
                newProps.id = [];
            } else {
                newProps.id = (typeof newProps.id === 'string') ? [newProps.id] : newProps.id;
            }

            // on first load, still publish if no hash is present
            if (!this.projectIds) {
                this.projectIds = newProps.id;
                this.onIdsChange(this.projectIds);

                return;
            }

            if (difference(newProps.id, this.projectIds).length > 0 ||
                difference(this.projectIds, newProps.id).length > 0) {
                this.projectIds = newProps.id;
                this.onIdsChange(newProps.id);
            }
        },
        setHash: function (props) {
            // summary:
            //      updates the URL with the properties
            // props: Object
            //      id: String || String[]
            console.log('app/router:setHash', arguments);

            hash(ioQuery.objectToQuery(props));
        },
        onIdsChange: function (newIds) {
            // summary:
            //      fires when the project ids in the hash have changed
            // newIds: String[]
            console.log('app/router:onIdsChange', arguments);

            topic.publish(config.topics.projectIdsChanged, newIds);
        },
        getProjectsWhereClause: function (args) {
            // summary:
            //      returns a definition query containing the current project ids
            // args: object { negate: bool}
            // returns: String
            console.log('app/router:getProjectsWhereClause', arguments);

            if (!this.projectIds || this.projectIds.length === 0 || !Array.isArray(this.projectIds)) {
                return '1=1';
            }

            var id_nums = this.projectIds.filter(function (id) {
                return !isNaN(parseInt(id, 10));
            });

            if (!id_nums || id_nums.length === 0) {
                return '1=1';
            }

            var template = this.inClause;

            if (args && args.negate) {
                template = this.notInClause;
            }

            return dojoString.substitute(template, [config.fieldNames.Project_ID, id_nums]);
        },
        getProjectId: function () {
            // summary:
            //      returns the single project id
            console.log('app/router:getProjectId', arguments);

            if (!this.projectIds) {
                return 0;
            }

            if (this.projectIds.length === 1) {
                return this.projectIds[0];
            } else if (this.projectIds.length > 1) {
                throw 'multiple project ids!';
            } else {
                throw 'no project ids!';
            }
        }
    };
});
