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
        getProjectsWhereClause: function () {
            // summary:
            //      returns a definition query containing the current project ids
            // returns: String
            console.log('app/router:getProjectsWhereClause', arguments);

            if (this.projectIds.length === 0) {
                return '1 = 1';
            }
            var id_nums = this.projectIds.map(function (id) {
                return parseInt(id, 10);
            });
            return dojoString.substitute('${0} IN (${1})', [config.fieldNames.Project_ID, id_nums]);
        }
    };
});
