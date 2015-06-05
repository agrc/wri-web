define([
    'app/config',

    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/hash',
    'dojo/io-query',
    'dojo/promise/all',
    'dojo/request',
    'dojo/string',
    'dojo/topic',

    'esri/geometry/Extent',

    'lodash/array/difference'
], function (
    config,

    lang,
    Deferred,
    hash,
    ioQuery,
    all,
    request,
    dojoString,
    topic,

    Extent,

    difference
) {
    var obj = {
        // description:
        //      Parse and update the URL parameters used to set and preserve the state of the application

        // projectIds: String []
        //      The id or id's of the currently displayed projects
        projectIds: [],

        startup: function () {
            // summary:
            //      spin up and get everything set up
            console.log('app/router::startup', arguments);

            topic.subscribe('/dojo/hashchange', lang.hitch(this, 'onHashChange'));

            var beginHash = hash();
            if (beginHash) {
                this.onHashChange(beginHash);
            }
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
        },
        getProjectIdsExtent: function () {
            // summary:
            //      if there are existing id(s) then query the server and return extent
            //      otherwise return null so that the default extent is used
            // returns: Promise || null
            console.log('app/router:getProjectIdsExtent', arguments);

            if (this.projectIds.length === 0) {
                return null;
            }

            var that = this;
            var makeRequest = function (index) {
                // query for extent of all features that match the query
                var url = dojoString.substitute('${0}/${1}/query', [config.urls.mapService, index]);
                return request.get(url, {
                    query: {
                        returnExtentOnly: true,
                        where: that.getProjectsWhereClause(),
                        f: 'json'
                    },
                    handleAs: 'json'
                });
            };

            var promises = [];
            var li = config.layerIndices;
            [li.point, li.line, li.poly].forEach(function (i) {
                promises.push(makeRequest(i));
            });

            var def = new Deferred();
            all(promises).then(function (extents) {
                var unionedExtent;
                extents.forEach(function (e) {
                    if (!isNaN(e.extent.xmin)) {
                        var newExtent = new Extent(e.extent);
                        if (!unionedExtent) {
                            unionedExtent = newExtent;
                        } else {
                            unionedExtent.union(newExtent);
                        }
                    }
                });

                def.resolve(unionedExtent);
            });

            return def.promise;
        }
    };

    obj.startup();

    return obj;
});
